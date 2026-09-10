import sys
from pathlib import Path

backend_dir = Path(__file__).resolve().parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from fastapi.testclient import TestClient
from main import app
from core.config import settings

def test_cors_verification():
    print("=" * 65)
    print("       RETINA AI FASTAPI BACKEND — CORS VERIFICATION")
    print("=" * 65)

    print("\n[1] Configured CORS Origins in settings:")
    for o in settings.cors_origins:
        print(f"  - {o}")
    print(f"  Regex: {settings.cors_origin_regex}")

    with TestClient(app) as client:
        origin = "https://ai-ratina-kn7w.vercel.app"
        endpoints = [
            "/health",
            "/api/patients",
            "/api/reports",
            "/api/screenings"
        ]

        print(f"\n[2] Testing GET Requests from Production Origin: {origin}")
        for ep in endpoints:
            res = client.get(ep, headers={"Origin": origin})
            acao = res.headers.get("access-control-allow-origin")
            acac = res.headers.get("access-control-allow-credentials")
            print(f"  {ep:<18} -> HTTP {res.status_code} | ACAO: {acao} | ACAC: {acac}")
            assert acao == origin, f"CORS failed for {ep}: expected {origin}, got {acao}"
            assert acac == "true", f"Credentials failed for {ep}: expected 'true', got {acac}"

        print(f"\n[3] Testing OPTIONS Preflight from Production Origin: {origin}")
        for ep in endpoints:
            res = client.options(ep, headers={
                "Origin": origin,
                "Access-Control-Request-Method": "GET",
                "Access-Control-Request-Headers": "content-type"
            })
            acao = res.headers.get("access-control-allow-origin")
            acam = res.headers.get("access-control-allow-methods")
            print(f"  {ep:<18} -> HTTP {res.status_code} | ACAO: {acao} | Methods: {acam}")
            assert acao == origin, f"OPTIONS CORS failed for {ep}: expected {origin}, got {acao}"

        print("\n[4] Testing Local Development Origins:")
        for dev_origin in ["http://localhost:5173", "http://localhost:5174", "http://127.0.0.1:5173"]:
            res = client.get("/health", headers={"Origin": dev_origin})
            acao = res.headers.get("access-control-allow-origin")
            print(f"  {dev_origin:<25} -> HTTP {res.status_code} | ACAO: {acao}")
            assert acao == dev_origin, f"Localhost CORS failed for {dev_origin}: got {acao}"

        print("\n[5] Testing Disallowed Origin (Should NOT receive ACAO):")
        evil_res = client.get("/health", headers={"Origin": "https://malicious-site.com"})
        evil_acao = evil_res.headers.get("access-control-allow-origin")
        print(f"  https://malicious-site.com -> HTTP {evil_res.status_code} | ACAO: {evil_acao}")
        assert evil_acao is None, f"Security violation: unexpected origin allowed: {evil_acao}"

    print("\n" + "=" * 65)
    print("  ALL CORS AUDIT AND VERIFICATION TESTS PASSED SUCCESSFULLY!")
    print("=" * 65)

if __name__ == "__main__":
    test_cors_verification()
