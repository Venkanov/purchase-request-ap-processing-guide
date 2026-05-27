#!/usr/bin/env python3
"""
Ingest Big 4 ASC 606 & ASC 842 guidance PDFs into the Accounting Research Portal.
Uses pypdf for local text extraction, then sends UTF-8 text (base64) to the app.
"""

import base64
import json
import re
import sys
import time
import urllib.request
import urllib.error
from pathlib import Path

try:
    import pypdf
except ImportError:
    print("ERROR: pypdf not installed. Run: pip3 install pypdf")
    sys.exit(1)

FILES = [
    {"path": "/Users/venkatesh/Desktop/KPMG leases-handbook.pdf",         "name": "KPMG Leases Handbook"},
    {"path": "/Users/venkatesh/Desktop/ey Lease guide.pdf",               "name": "EY Lease Guide (ASC 842)"},
    {"path": "/Users/venkatesh/Desktop/pwcleasesguide1224.pdf",           "name": "PwC Leases Guide"},
    {"path": "/Users/venkatesh/Desktop/KPMG revenue-software-saas-1.pdf", "name": "KPMG Revenue – Software & SaaS"},
    {"path": "/Users/venkatesh/Desktop/KPMG revenue-recognition.pdf",     "name": "KPMG Revenue Recognition Handbook"},
    {"path": "/Users/venkatesh/Desktop/PwC Rev Rec Guide.pdf",            "name": "PwC Revenue Recognition Guide"},
    {"path": "/Users/venkatesh/Desktop/ey Rev Rec Guide.pdf",             "name": "EY Revenue Recognition Guide"},
]

KNOWN_VERSIONS = {
    "pwcleasesguide1224.pdf":           "PwC, December 2024",
    "KPMG leases-handbook.pdf":         "KPMG, Handbook Series",
    "ey Lease guide.pdf":               "EY, Technical Line",
    "KPMG revenue-software-saas-1.pdf": "KPMG, Handbook Series",
    "KPMG revenue-recognition.pdf":     "KPMG, Handbook Series",
    "PwC Rev Rec Guide.pdf":            "PwC, Guide Series",
    "ey Rev Rec Guide.pdf":             "EY, Technical Line",
}

BASE_URL = "http://localhost:3000"
MAX_RETRIES = 3
RETRY_DELAY = 8   # seconds between retries
FILE_DELAY  = 3   # seconds between files


def wait_for_server(max_wait: int = 60) -> bool:
    """Poll /api/sources until the server responds or timeout."""
    print("⏳ Waiting for server to be ready...", end="", flush=True)
    deadline = time.time() + max_wait
    while time.time() < deadline:
        try:
            with urllib.request.urlopen(f"{BASE_URL}/api/sources", timeout=5) as r:
                if r.status == 200:
                    print(" ready.\n")
                    return True
        except Exception:
            pass
        print(".", end="", flush=True)
        time.sleep(2)
    print(" timed out.")
    return False


def detect_version(cover_text: str, file_name: str) -> str:
    base = Path(file_name).name
    known = KNOWN_VERSIONS.get(base, "")

    m = re.search(
        r"(January|February|March|April|May|June|July|August|September|October|November|December)\s+20\d\d",
        cover_text, re.IGNORECASE
    )
    if m:
        return f"{known} — {m.group(0)}" if known else m.group(0)

    years = re.findall(r"20(2\d)", cover_text)
    if years:
        latest = max(set(years))
        return f"{known} — 20{latest}" if known else f"20{latest}"

    return known or "Version unknown — verify currency before use"


def extract_text(path: str) -> tuple[str, int]:
    reader = pypdf.PdfReader(path)
    # Decrypt KPMG AES-encrypted PDFs (empty password)
    if reader.is_encrypted:
        reader.decrypt("")
    pages = []
    for page in reader.pages:
        pages.append(page.extract_text() or "")
    return "\n".join(pages), len(reader.pages)


def send_with_retry(payload_bytes: bytes, display_name: str) -> dict:
    """POST payload to /api/ingest with up to MAX_RETRIES attempts."""
    req = urllib.request.Request(
        f"{BASE_URL}/api/ingest",
        data=payload_bytes,
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    last_error = None
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            with urllib.request.urlopen(req, timeout=180) as resp:
                body = resp.read().decode("utf-8")
            result = json.loads(body)
            if result.get("status") == "indexed":
                return result
            # Server returned a non-indexed result — retry
            last_error = result.get("error", json.dumps(result))
        except urllib.error.HTTPError as e:
            body = e.read().decode("utf-8")
            try:
                last_error = json.loads(body).get("error", body[:200])
            except Exception:
                last_error = body[:200]
        except Exception as ex:
            last_error = str(ex)

        if attempt < MAX_RETRIES:
            print(f"   ⚠️  Attempt {attempt} failed ({last_error[:80]}). Retrying in {RETRY_DELAY}s...", flush=True)
            time.sleep(RETRY_DELAY)

    return {"error": last_error}


def ingest_file(file: dict) -> dict:
    size_mb = Path(file["path"]).stat().st_size / 1024 / 1024
    print(f"\n📄 {file['name']}  ({size_mb:.1f} MB)")

    print("   Parsing PDF... ", end="", flush=True)
    text, num_pages = extract_text(file["path"])
    print(f"{num_pages} pages, {len(text)//1000}k chars extracted")

    cover_text = re.sub(r"\s+", " ", text[:800]).strip()
    version = detect_version(cover_text, file["path"])
    display_name = f"{file['name']} [{version}]"

    print(f"   Version : {version}")
    print(f"   Sending to app...", flush=True)

    text_b64 = base64.b64encode(text.encode("utf-8")).decode("ascii")
    payload_bytes = json.dumps({
        "pool": "guidance",
        "fileName": display_name,
        "fileType": "txt",
        "content": text_b64,
    }).encode("utf-8")

    result = send_with_retry(payload_bytes, display_name)

    if result.get("status") == "indexed":
        print(f"   ✅ Indexed — {result.get('chunkCount')} chunks (sourceId: {result.get('sourceId')})")
    else:
        print(f"   ❌ Failed — {result.get('error', json.dumps(result))}")

    return {"displayName": display_name, "version": version, "numpages": num_pages, **result}


def main():
    print("═══════════════════════════════════════════════════════")
    print("  Accounting Research Portal — Guidance Ingestion")
    print("  Source: Big 4 ASC 606 & ASC 842 Technical Guides")
    print("═══════════════════════════════════════════════════════\n")

    if not wait_for_server():
        print("ERROR: Server not reachable. Start the dev server first.")
        sys.exit(1)

    results = []
    for i, f in enumerate(FILES):
        if i > 0:
            time.sleep(FILE_DELAY)
        try:
            results.append(ingest_file(f))
        except Exception as ex:
            print(f"   ❌ Error: {ex}")
            results.append({"displayName": f["name"], "error": str(ex)})

    print("\n\n═══════════════════════════════════════════════════════")
    print("SUMMARY")
    print("═══════════════════════════════════════════════════════")
    for r in results:
        ok = r.get("status") == "indexed"
        print(f"{'✅' if ok else '❌'} {r['displayName']}")
        if ok:
            print(f"   {r.get('numpages')} pages → {r.get('chunkCount')} chunks")
        if r.get("error"):
            print(f"   Error: {r['error']}")

    print("\n⚠️  CURRENCY NOTICE: Always verify these guides against")
    print("   current FASB ASC updates and KPMG/EY/PwC website for")
    print("   latest versions before relying on outputs in practice.")


if __name__ == "__main__":
    main()
