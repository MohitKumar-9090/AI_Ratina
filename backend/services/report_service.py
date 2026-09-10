import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from core.database import get_reports_collection, is_mongo_connected
from core.exceptions import ResourceNotFoundException, ServiceUnavailableException
from schemas.report import ReportCreate


class ReportService:
    """MongoDB report metadata; generated report files remain outside MongoDB."""
    @staticmethod
    def _collection():
        if not is_mongo_connected():
            raise ServiceUnavailableException('Reports are unavailable because MongoDB is disconnected.')
        collection = get_reports_collection()
        if collection is None:
            raise ServiceUnavailableException('Reports are unavailable because MongoDB is disconnected.')
        return collection

    @staticmethod
    def _clean(document: Dict[str, Any]) -> Dict[str, Any]:
        document = dict(document); document.pop('_id', None); return document

    async def get_all(self, patient_id: Optional[str] = None) -> List[Dict[str, Any]]:
        query = {} if not patient_id else {'$or': [{'patient_id': patient_id}, {'patientId': patient_id}]}
        return [self._clean(doc) for doc in self._collection().find(query, {'_id': 0}).sort('created_at', -1)]

    async def get_by_id(self, report_id: str) -> Dict[str, Any]:
        doc = self._collection().find_one({'$or': [{'report_id': report_id}, {'reportId': report_id}]}, {'_id': 0})
        if not doc: raise ResourceNotFoundException(f"Report with ID '{report_id}' was not found.")
        return self._clean(doc)

    async def create(self, screening_id: str, data: ReportCreate) -> Dict[str, Any]:
        report_id = data.report_id or f'REP-{uuid.uuid4().hex[:12].upper()}'
        now = datetime.now(timezone.utc).isoformat()
        record = data.model_dump(by_alias=True, exclude_none=True)
        record.update({'report_id': report_id, 'reportId': report_id, 'screening_id': screening_id, 'screeningId': screening_id, 'created_at': now, 'createdAt': now, 'pdf_url': None, 'pdfUrl': None})
        self._collection().update_one({'$or': [{'report_id': report_id}, {'reportId': report_id}]}, {'$set': record}, upsert=True)
        return self._clean(record)

    async def generate_pdf(self, report_id: str) -> Optional[str]:
        await self.get_by_id(report_id)
        return None


report_service = ReportService()
