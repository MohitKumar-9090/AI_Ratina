from typing import Any, Optional, Dict
from fastapi.responses import JSONResponse


def api_response(
    data: Any = None,
    message: str = "Success",
    status_code: int = 200,
    meta: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Standard envelope structure for consistent API success responses.
    """
    payload = {
        "success": True,
        "message": message,
    }
    if data is not None:
        payload["data"] = data
    if meta is not None:
        payload["meta"] = meta
    return payload


def error_response(
    message: str = "An error occurred",
    status_code: int = 400,
    details: Optional[Any] = None
) -> JSONResponse:
    """
    Constructs a consistent error JSONResponse.
    """
    return JSONResponse(
        status_code=status_code,
        content={
            "success": False,
            "error": {
                "code": status_code,
                "message": message,
                "details": details
            }
        }
    )
