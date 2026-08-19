#!/usr/bin/env python3
"""Importe automatiquement la BDPM en découvrant les vrais liens de téléchargement.

La BDPM change parfois l'URL technique de téléchargement. On ne hardcode donc
pas l'URL du fichier : on lit la page officielle /telechargement et on récupère
les liens actuellement publiés.
"""

from pathlib import Path
import csv
import datetime
import html
import json
import re
import ssl
import urllib.parse
import urllib.request

DOWNLOAD_PAGE = "https://base-donnees-publique.medicaments.gouv.fr/telechargement"

FILES = {
    "specialites": "CIS_bdpm.txt",
    "presentations": "CIS_CIP_bdpm.txt",
    "compositions": "CIS_COMPO_bdpm.txt",
}


def fetch(url: str) -> bytes:
    request = urllib.request.Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0 Medicalc/1.0",
            "Accept": "*/*",
        },
    )
    with urllib.request.urlopen(
        request,
        timeout=90,
        context=ssl.create_default_context(),
    ) as response:
        return response.read()


def discover_links():
    print(f"Lecture de la page officielle : {DOWNLOAD_PAGE}")
    page = fetch(DOWNLOAD_PAGE).decode("utf-8", errors="replace")

    # Decode HTML entities and collect every href.
    page = html.unescape(page)
    hrefs = re.findall(
        r"""href\s*=\s*["']([^"']+)["']""",
        page,
        flags=re.IGNORECASE,
    )

    found = {}
    for href in hrefs:
        full = urllib.parse.urljoin(DOWNLOAD_PAGE, href)
        lower = full.lower()

        for key, filename in FILES.items():
            if filename.lower() in lower:
                found[key] = full

    missing = [name for name in FILES if name not in found]
    if missing:
        raise RuntimeError(
            "Impossible de trouver sur la page BDPM les liens : "
            + ", ".join(FILES[name] for name in missing)
        )

    for key, url in found.items():
        print(f"Lien BDPM {key} : {url}")

    return found


def download(key: str, url: str) -> Path:
    filename = FILES[key]
    print(f"Téléchargement {filename}...")
    data = fetch(url)

    if len(data) < 1000:
        raise RuntimeError(
            f"Réponse trop petite pour {filename} : {len(data)} octets"
        )

    # Refuse une page HTML d'erreur à la place du fichier TXT.
    sample = data[:500].lstrip().lower()
    if sample.startswith(b"<!doctype html") or b"<html" in sample:
        raise RuntimeError(
            f"La BDPM a renvoyé une page HTML au lieu de {filename}"
        )

    path = Path(filename)
    path.write_bytes(data)
    return path


def read_rows(path: Path):
    with path.open("r", encoding="latin-1", newline="") as handle:
        return list(csv.reader(handle, delimiter="\t"))


def main():
    links = discover_links()

    files = {
        key: download(key, links[key])
        for key in FILES
    }

    specialites = read_rows(files["specialites"])
    presentations = read_rows(files["presentations"])
    compositions = read_rows(files["compositions"])

    medicines = {}

    for row in specialites:
        if not row or not row[0].strip():
            continue

        cis = row[0].strip()
        medicines[cis] = {
            "id": f"CIS-{cis}",
            "cis": cis,
            "nom": row[1].strip() if len(row) > 1 else "",
            "forme": row[2].strip() if len(row) > 2 else "",
            "voies": (
                [x.strip() for x in row[3].split(";") if x.strip()]
                if len(row) > 3
                else []
            ),
            "presentations": [],
            "substances": [],
            "source": "BDPM",
            "date_import": datetime.date.today().isoformat(),
            "clinically_validated": False,
        }

    for row in presentations:
        if len(row) > 2 and row[0].strip() in medicines:
            cis = row[0].strip()
            medicines[cis]["presentations"].append({
                "cip7": row[1].strip() if len(row) > 1 else "",
                "libelle": row[2].strip() if len(row) > 2 else "",
                "cip13": row[6].strip() if len(row) > 6 else "",
            })

    for row in compositions:
        if len(row) > 3 and row[0].strip() in medicines:
            cis = row[0].strip()
            substance = row[3].strip()
            if substance and substance not in medicines[cis]["substances"]:
                medicines[cis]["substances"].append(substance)

    output = {
        "source": "BDPM",
        "date_import": datetime.date.today().isoformat(),
        "medicaments": list(medicines.values()),
    }

    Path("medicaments.json").write_text(
        json.dumps(output, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    print(f"Import BDPM terminé : {len(medicines)} spécialités")


if __name__ == "__main__":
    main()
