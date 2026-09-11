import io
import os
import uuid
import re
from typing import Tuple
from fastapi import UploadFile
from PIL import Image

from core.config import settings
from core.exceptions import InvalidImageException, FileSizeLimitExceededException


def is_allowed_file_extension(filename: str) -> bool:
    """
    Checks if the filename has an allowed image extension (.jpg, .jpeg, .png).
    """
    if not filename or "." not in filename:
        return False
    ext = os.path.splitext(filename)[1].lower()
    return ext in settings.ALLOWED_EXTENSIONS


def sanitize_filename(filename: str) -> str:
    """
    Sanitizes filename removing unsafe characters.
    """
    base = os.path.basename(filename)
    clean = re.sub(r'[^a-zA-Z0-9_.-]', '_', base)
    return clean or "fundus_image.jpg"


async def validate_and_save_image(
    file: UploadFile,
    patient_id: str = "general"
) -> Tuple[str, str]:
    """
    Validates the uploaded file:
    1. Check presence and non-empty filename
    2. Check allowed extension (.jpg, .jpeg, .png)
    3. Check file size <= MAX_UPLOAD_SIZE_MB
    4. Validate image readability and color mode with Pillow
    5. Save safely into uploads/ directory with unique identifier
    
    Returns:
        (saved_filepath, relative_url)
    """
    if not file or not file.filename:
        raise InvalidImageException("No image file provided in upload request")

    # Extension validation
    if not is_allowed_file_extension(file.filename):
        allowed_str = ", ".join(settings.ALLOWED_EXTENSIONS)
        raise InvalidImageException(
            f"Unsupported file type '{file.filename}'. Allowed formats: {allowed_str}"
        )

    # Read content
    try:
        contents = await file.read()
    except Exception as e:
        raise InvalidImageException(f"Failed to read uploaded file: {str(e)}")

    # Check for empty file
    if not contents or len(contents) == 0:
        raise InvalidImageException("Uploaded file is empty")

    # Size limit validation
    if len(contents) > settings.max_upload_size_bytes:
        raise FileSizeLimitExceededException(
            f"File size exceeds the {settings.MAX_UPLOAD_SIZE_MB}MB limit"
        )

    # Pillow validation & RGB verification
    try:
        image_stream = io.BytesIO(contents)
        with Image.open(image_stream) as pil_img:
            # Check format recognised by Pillow
            img_format = (pil_img.format or "").upper()
            if img_format not in ["JPEG", "JPG", "PNG"]:
                raise InvalidImageException(f"Invalid or corrupted image format: {img_format}")

            # Verify image integrity
            pil_img.verify()

        # Re-open after verify() (Pillow closes stream after verify)
        image_stream.seek(0)
        with Image.open(image_stream) as pil_img:
            width, height = pil_img.size
            if width <= 0 or height <= 0:
                raise InvalidImageException("Image has invalid dimensions")

            # Generate unique and safe storage filename
            ext = os.path.splitext(file.filename)[1].lower()
            if ext not in settings.ALLOWED_EXTENSIONS:
                ext = ".jpg"
            
            clean_pid = re.sub(r'[^a-zA-Z0-9_-]', '', patient_id) or "patient"
            unique_id = uuid.uuid4().hex[:10]
            saved_filename = f"{clean_pid}_{unique_id}{ext}"
            saved_filepath = os.path.join(settings.UPLOAD_DIR, saved_filename)

            # Save original image bytes directly to disk without lossy re-compression
            with open(saved_filepath, "wb") as f:
                f.write(contents)

        # Release memory buffers
        del contents
        image_stream.close()

    except (InvalidImageException, FileSizeLimitExceededException):
        raise
    except Exception as e:
        raise InvalidImageException(f"Invalid or corrupt image file: {str(e)}")

    relative_url = f"/uploads/{saved_filename}"
    return saved_filepath, relative_url
