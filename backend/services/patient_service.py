import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List

from pymongo import ReturnDocument
from pymongo.errors import DuplicateKeyError

from core.database import get_patients_collection, is_mongo_connected
from core.exceptions import ConflictException, ResourceNotFoundException, ServiceUnavailableException
from schemas.patient import PatientCreate, PatientUpdate


class PatientService:
    """MongoDB-backed patient records. No memory or seed-data fallback is permitted."""

    @staticmethod
    def _collection():
        if not is_mongo_connected():
            raise ServiceUnavailableException('Patient records are unavailable because MongoDB is disconnected.')
        collection = get_patients_collection()
        if collection is None:
            raise ServiceUnavailableException('Patient records are unavailable because MongoDB is disconnected.')
        return collection

    @staticmethod
    def _clean(document: Dict[str, Any]) -> Dict[str, Any]:
        document = dict(document)
        document.pop('_id', None)
        return document

    async def get_all(self) -> List[Dict[str, Any]]:
        return [self._clean(document) for document in self._collection().find({}, {'_id': 0}).sort('created_at', -1)]

    async def get_by_id(self, patient_id: str) -> Dict[str, Any]:
        document = self._collection().find_one({'$or': [{'patient_id': patient_id}, {'patientId': patient_id}]}, {'_id': 0})
        if not document:
            raise ResourceNotFoundException(f"Patient with ID '{patient_id}' was not found.")
        return self._clean(document)

    async def create(self, data: PatientCreate) -> Dict[str, Any]:
        collection = self._collection()
        patient_id = data.patient_id or f'PAT-{uuid.uuid4().hex[:10].upper()}'
        now = datetime.now(timezone.utc).isoformat()
        if collection.find_one({'$or': [{'patient_id': patient_id}, {'patientId': patient_id}]}, {'_id': 1}):
            raise ConflictException('Patient ID already exists.')
        record = data.model_dump(by_alias=True, exclude_none=True)
        record.update({'patient_id': patient_id, 'patientId': patient_id, 'created_at': now, 'createdAt': now, 'updated_at': None, 'updatedAt': None})
        try:
            collection.insert_one(record)
        except DuplicateKeyError as error:
            raise ConflictException('Patient ID already exists.') from error
        return self._clean(record)

    async def update(self, patient_id: str, data: PatientUpdate) -> Dict[str, Any]:
        collection = self._collection()
        updates = data.model_dump(by_alias=True, exclude_none=True)
        updates.update({'updated_at': datetime.now(timezone.utc).isoformat(), 'updatedAt': datetime.now(timezone.utc).isoformat()})
        result = collection.find_one_and_update({'$or': [{'patient_id': patient_id}, {'patientId': patient_id}]}, {'$set': updates}, return_document=ReturnDocument.AFTER, projection={'_id': 0})
        if not result:
            raise ResourceNotFoundException(f"Patient with ID '{patient_id}' was not found.")
        return self._clean(result)

    async def delete(self, patient_id: str) -> bool:
        result = self._collection().delete_one({'$or': [{'patient_id': patient_id}, {'patientId': patient_id}]})
        if not result.deleted_count:
            raise ResourceNotFoundException(f"Patient with ID '{patient_id}' was not found.")
        return True


patient_service = PatientService()
