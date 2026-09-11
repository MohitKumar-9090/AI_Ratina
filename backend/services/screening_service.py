import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from pymongo.errors import DuplicateKeyError, ConnectionFailure, ServerSelectionTimeoutError
from core.database import get_screenings_collection, is_mongo_connected, mark_mongo_success, mark_mongo_failure
from core.exceptions import ResourceNotFoundException, ServiceUnavailableException
from schemas.screening import ScreeningCreate
from services.patient_service import patient_service


class ScreeningService:
    """Completed real model results, persisted only in MongoDB."""

    @staticmethod
    def _collection():
        if not is_mongo_connected():
            raise ServiceUnavailableException('Screening records are unavailable because MongoDB is disconnected.')
        collection = get_screenings_collection()
        if collection is None:
            raise ServiceUnavailableException('Screening records are unavailable because MongoDB is disconnected.')
        return collection

    @staticmethod
    def _clean(document: Dict[str, Any]) -> Dict[str, Any]:
        document = dict(document); document.pop('_id', None); return document

    async def get_all(self, patient_id: Optional[str] = None) -> List[Dict[str, Any]]:
        query = {} if not patient_id else {'$or': [{'patient_id': patient_id}, {'patientId': patient_id}]}
        return [self._clean(document) for document in self._collection().find(query, {'_id': 0}).sort('created_at', -1)]

    async def get_by_id(self, screening_id: str) -> Dict[str, Any]:
        document = self._collection().find_one({'$or': [{'screening_id': screening_id}, {'screeningId': screening_id}]}, {'_id': 0})
        if not document:
            raise ResourceNotFoundException(f"Screening with ID '{screening_id}' was not found.")
        return self._clean(document)

    async def create(self, data: ScreeningCreate) -> Dict[str, Any]:
        await patient_service.get_by_id(data.patient_id)
        screening_id = data.screening_id or f'SCR-{uuid.uuid4().hex[:12].upper()}'
        now = datetime.now(timezone.utc).isoformat()
        record = data.model_dump(by_alias=False, exclude_none=True)
        record.update({
            'screening_id': screening_id,
            'screeningId': screening_id,
            'created_at': now,
            'createdAt': now,
            'patient_id': data.patient_id,
            'patientId': data.patient_id,
            'dr_stage': data.dr_stage,
            'drStage': data.dr_stage,
            'dr_label': data.dr_label or data.dr_result,
            'drLabel': data.dr_label or data.dr_result,
            'dr_result': data.dr_result or data.dr_label,
            'drResult': data.dr_result or data.dr_label,
            'rfmid_findings': data.rfmid_findings,
            'rfmidFindings': data.rfmid_findings,
            'odir_findings': data.odir_findings,
            'odirFindings': data.odir_findings,
            'image_url': data.image_url,
            'imageUrl': data.image_url,
            'gradcam_url': data.gradcam_url,
            'gradcamUrl': data.gradcam_url,
            'gradcam_status': data.gradcam_status or ('completed' if data.gradcam_url else 'processing'),
            'gradcamStatus': data.gradcam_status or ('completed' if data.gradcam_url else 'processing'),
            'screening_date': data.screening_date,
            'screeningDate': data.screening_date
        })
        try:
            self._collection().insert_one(record)
            mark_mongo_success()
        except DuplicateKeyError:
            # Duplicate screening ID - treat as already persisted
            pass
        except (ConnectionFailure, ServerSelectionTimeoutError) as err:
            mark_mongo_failure()
            raise ServiceUnavailableException('Failed to persist screening due to database connection error.') from err
        return self._clean(record)

    async def update_gradcam(self, screening_id: str, gradcam_url: Optional[str], gradcam_status: str) -> Dict[str, Any]:
        update_fields: Dict[str, Any] = {
            'gradcam_status': gradcam_status,
            'gradcamStatus': gradcam_status,
        }
        if gradcam_url is not None:
            update_fields['gradcam_url'] = gradcam_url
            update_fields['gradcamUrl'] = gradcam_url

        try:
            result = self._collection().find_one_and_update(
                {'$or': [{'screening_id': screening_id}, {'screeningId': screening_id}]},
                {'$set': update_fields},
                return_document=True
            )
            mark_mongo_success()
        except (ConnectionFailure, ServerSelectionTimeoutError) as err:
            mark_mongo_failure()
            raise ServiceUnavailableException('Failed to update Grad-CAM due to database connection error.') from err

        if not result:
            raise ResourceNotFoundException(f"Screening with ID '{screening_id}' was not found.")
        return self._clean(result)


screening_service = ScreeningService()
