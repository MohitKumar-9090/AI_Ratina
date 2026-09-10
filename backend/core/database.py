import logging
from typing import Optional
from pymongo import MongoClient
from pymongo.database import Database
from pymongo.collection import Collection
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError

from core.config import settings

logger = logging.getLogger("retina_ai")

_mongo_client: Optional[MongoClient] = None
_mongo_db: Optional[Database] = None
_is_connected: bool = False


def is_mongo_connected() -> bool:
    """Returns True if MongoDB Atlas is currently connected and responsive."""
    global _is_connected
    if not _is_connected:
        ping_database()
    return _is_connected


def get_mongo_client() -> Optional[MongoClient]:
    """
    Returns the active MongoClient singleton or initializes one.
    Reuses a single connection pool across the application.
    Uses certifi CA bundle for reliable TLS on all platforms.
    """
    global _mongo_client, _mongo_db
    if _mongo_client is None:
        if not settings.MONGODB_URI:
            return None
        try:
            # Use certifi CA bundle to avoid platform-specific TLS issues.
            tls_ca_file = None
            try:
                import certifi
                tls_ca_file = certifi.where()
            except ImportError:
                pass

            client_kwargs = dict(
                serverSelectionTimeoutMS=5000,
                connectTimeoutMS=5000,
                socketTimeoutMS=10000,
                maxPoolSize=50,
                minPoolSize=5,
            )
            if tls_ca_file:
                client_kwargs["tlsCAFile"] = tls_ca_file

            _mongo_client = MongoClient(settings.MONGODB_URI, **client_kwargs)
            _mongo_db = _mongo_client[settings.MONGODB_DATABASE]
        except Exception as e:
            logger.error(f"MongoClient initialization error: {type(e).__name__}")
            _mongo_client = None
            _mongo_db = None
    return _mongo_client


def get_database() -> Optional[Database]:
    """Returns the 'retina_ai' Database object or None."""
    global _mongo_db
    if _mongo_db is None:
        client = get_mongo_client()
        if client is not None:
            _mongo_db = client[settings.MONGODB_DATABASE]
    return _mongo_db


def get_patients_collection() -> Optional[Collection]:
    """Returns the 'patients' collection if connected."""
    db = get_database()
    return db["patients"] if db is not None else None


def get_screenings_collection() -> Optional[Collection]:
    """Returns the 'screenings' collection if connected."""
    db = get_database()
    return db["screenings"] if db is not None else None


def get_reports_collection() -> Optional[Collection]:
    """Returns the 'reports' collection if connected."""
    db = get_database()
    return db["reports"] if db is not None else None


def ping_database() -> bool:
    """Sends a lightweight ping command to MongoDB Atlas."""
    global _is_connected
    try:
        client = get_mongo_client()
        if client is None:
            _is_connected = False
            return False
        client.admin.command("ping")
        _is_connected = True
        return True
    except Exception:
        _is_connected = False
        return False


def _diagnose_error(exc: Exception) -> str:
    """
    Produces a safe, actionable diagnostic message from a MongoDB exception.
    NEVER exposes credentials, URIs, or passwords.
    """
    msg = str(exc)
    if "TLSV1_ALERT_INTERNAL_ERROR" in msg or "SSL handshake failed" in msg:
        return (
            "SSL/TLS handshake rejected by Atlas. "
            "This almost always means your current public IP is NOT whitelisted. "
            "Go to: Atlas > Security > Network Access > Add IP Address."
        )
    if "Authentication failed" in msg or "auth" in msg.lower():
        return (
            "MongoDB authentication failed. "
            "Check the username/password in MONGODB_URI and ensure the user exists in Atlas."
        )
    if "ServerSelectionTimeoutError" in type(exc).__name__:
        return (
            f"Could not reach any MongoDB Atlas server within the timeout. "
            f"Underlying error: {type(exc).__name__}"
        )
    if "ConfigurationError" in type(exc).__name__:
        return f"MongoDB configuration error: {msg[:200]}"
    return f"{type(exc).__name__}: {msg[:200]}"


def connect_to_mongo() -> bool:
    """
    Application startup initialization hook.
    NEVER logs credentials or connection strings.
    Logs clear, actionable diagnostics on failure.
    """
    global _is_connected
    try:
        client = get_mongo_client()
        if client is None:
            print("[Retina AI Backend] WARNING: MONGODB_URI is empty. Database features disabled.")
            logger.warning("MONGODB_URI is empty — database features are disabled.")
            return False

        client.admin.command("ping")
        _is_connected = True
        logger.info("MongoDB connection established successfully.")
        print("[Retina AI Backend] MongoDB connection established successfully.")
        return True

    except Exception as e:
        _is_connected = False
        diagnosis = _diagnose_error(e)
        logger.warning(f"MongoDB connection failed: {diagnosis}")
        print(f"[Retina AI Backend] MongoDB connection FAILED: {diagnosis}")

        # Reset client so next attempt creates a fresh one
        global _mongo_client, _mongo_db
        _mongo_client = None
        _mongo_db = None
        return False


def close_mongo_connection() -> None:
    """Application shutdown hook."""
    global _mongo_client, _mongo_db, _is_connected
    if _mongo_client is not None:
        try:
            _mongo_client.close()
        except Exception:
            pass
        _mongo_client = None
        _mongo_db = None
        _is_connected = False
        logger.info("MongoDB connection closed")
        print("[Retina AI Backend] MongoDB connection closed cleanly.")
