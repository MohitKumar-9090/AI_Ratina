import os

def get_process_memory_mb() -> float:
    """Returns the resident set size of the current process in MB."""
    try:
        import psutil
        return psutil.Process(os.getpid()).memory_info().rss / (1024 * 1024)
    except Exception:
        return 0.0

def log_memory(label: str) -> float:
    """Prints structured process memory to stdout without exposing secrets."""
    mb = get_process_memory_mb()
    print(f"{label}: {mb:.2f} MB", flush=True)
    return mb
