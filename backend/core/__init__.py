"""
Retina AI - Core Module
Application configuration and global error handling.
"""

from .config import settings
from .exceptions import (
    AppException,
    ResourceNotFoundException,
    InvalidImageException,
    FileSizeLimitExceededException,
    ValidationException,
    setup_exception_handlers,
)

__all__ = [
    "settings",
    "AppException",
    "ResourceNotFoundException",
    "InvalidImageException",
    "FileSizeLimitExceededException",
    "ValidationException",
    "setup_exception_handlers",
]
