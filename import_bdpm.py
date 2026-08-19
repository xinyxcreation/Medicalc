#!/usr/bin/env python3
"""Importe les fichiers publics de la BDPM dans medicaments.json."""

from pathlib import Path
import csv
import datetime
import json
import ssl
import urllib.request

BASE_URL = "https://base-donnees-publique.medicaments.gouv.fr/telechargement.php?fichier="

FILES = {
    "specialites": "CIS_bdpm.txt",
    "presentations": "CIS_CIP_bdpm.txt",
    "compositions": "CIS_COMPO_bdpm.txt",
}


def download(filename: str) -> Path:
    path = Path(filename)
    url = BASE_URL + filename
    print(f"Telechargement : {url}")

    request = urllib.request.Request(
        url,
        headers={"User-Agent": "Medicalc-BDPM-Importer/1.0"},
    )

    with urllib.request.urlopen(
        request,
        timeout=60,
        context=ssl.create_default_context(),
    ) as response:
        data = response.read()

    if len(data) < 1000:
        raise RuntimeError(
            f"Fichier BDPM invalide ou trop petit : {filename} ({len(data)} octets)"
        )

    path.write_bytes(data)
    return path


def read_rows(path: Path):
    with path.open("r", encoding="latin-1", newline="") as handle:
        return list(csv.reader(handle, delimiter="\t"))


def main() -> None:
    files = {
        key: download(filename)
        for key, filename in FILES.items()
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
                [item.strip() for item in row[3].split(";") if item.strip()]
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

            medicines[cis]["presentations"].append(
                {
                    "cip7": row[1].strip() if len(row) > 1 else "",
                    "libelle": row[2].strip() if len(row) > 2 else "",
                    "cip13": row[6].strip() if len(row) > 6 else "",
                }
            )

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

    print(f"Import BDPM termine : {len(medicines)} specialites")


if __name__ == "__main__":
    main()
