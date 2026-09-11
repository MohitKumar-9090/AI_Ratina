import logging
from typing import Any, Optional
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

logger = logging.getLogger("retina_ai")


class AppException(Exception):
    """Base application exception."""
    def __init__(self, message: str, status_code: int = status.HTTP_400_BAD_REQUEST, details: Optional[Any] = None):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.details = details


class ResourceNotFoundException(AppException):
    """404 Not Found exception."""
    def __init__(self, message: str = "Resource not found", details: Optional[Any] = None):
        super().__init__(message=message, status_code=status.HTTP_404_NOT_FOUND, details=details)


class ConflictException(AppException):
    """409 Conflict exception."""
    def __init__(self, message: str = "Resource conflict occurred", details: Optional[Any] = None):
        super().__init__(message=message, status_code=status.HTTP_409_CONFLICT, details=details)


class InvalidImageException(AppException):
    """400 Bad Request exception for invalid image formats or corrupted files."""
    def __init__(self, message: str = "Invalid image file format", details: Optional[Any] = None):
        super().__init__(message=message, status_code=status.HTTP_400_BAD_REQUEST, details=details)


class FileSizeLimitExceededException(AppException):
    """413 Payload Too Large exception."""
    def __init__(self, message: str = "Uploaded file exceeds maximum allowed size", details: Optional[Any] = None):
        super().__init__(message=message, status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, details=details)


class ValidationException(AppException):
    """422 Unprocessable Entity exception."""
    def __init__(self, message: str = "Validation failed", details: Optional[Any] = None):
        super().__init__(message=message, status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, details=details)


class ServiceUnavailableException(AppException):
    """503 error used when a required dependency is unavailable."""
    def __init__(self, message: str = "Required service is unavailable"):
        super().__init__(message=message, status_code=status.HTTP_503_SERVICE_UNAVAILABLE)


def setup_exception_handlers(app: FastAPI) -> None:
    """
    Registers global exception handlers on the FastAPI app.
    Guarantees standard JSON error responses and prevents raw stack traces from reaching clients.
    """

    @app.exception_handler(AppException)
    async def app_exception_handler(request: Request, exc: AppException):
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "detail": exc.message,
                "success": False,
                "error": {
                    "code": exc.status_code,
                    "message": exc.message,
                    "details": exc.details
                }
            }
        )

    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(request: Request, exc: StarletteHTTPException):
        message = exc.detail if isinstance(exc.detail, str) else "HTTP error occurred"
        details = exc.detail if not isinstance(exc.detail, str) else None
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "detail": message,
                "success": False,
                "error": {
                    "code": exc.status_code,
                    "message": message,
                    "details": details
                }
            }
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        # Format Pydantic errors into human-readable details
        formatted_errors = []
        for err in exc.errors():
            loc = " -> ".join(str(l) for l in err.get("loc", []))
            formatted_errors.append({
                "field": loc,
                "message": err.get("msg")
            })
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "detail": "Request validation failed",
                "success": False,
                "error": {
                    "code": status.HTTP_422_UNPROCESSABLE_ENTITY,
                    "message": "Request validation failed",
                    "details": formatted_errors
                }
            }
        )

    @app.exception_handler(Exception)
    async def generic_exception_handler(request: Request, exc: Exception):
        from core.database import sanitize_credentials
        safe_msg = sanitize_credentials(str(exc))
        logger.error(f"Unhandled server error on {request.url.path}: {safe_msg}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "detail": "An internal server error occurred. Please try again later.",
                "success": False,
                "error": {
                    "code": status.HTTP_500_INTERNAL_SERVER_ERROR,
                    "message": "An internal server error occurred. Please try again later."
                }
            }
        )
