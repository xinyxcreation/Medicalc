#!/usr/bin/env python3
"""Import automatique de la BDPM depuis la page officielle de téléchargement."""

from pathlib import Path
import csv
import datetime
import html
import json
import re
import ssl
import urllib.error
import urllib.parse
import urllib.request
from html.parser import HTMLParser

DOWNLOAD_PAGE = "https://base-donnees-publique.medicaments.gouv.fr/telechargement"

FILES = {
    "specialites": ("CIS_bdpm.txt", "Fichier des spécialités"),
    "presentations": ("CIS_CIP_bdpm.txt", "Fichier des présentations"),
    "compositions": ("CIS_COMPO_bdpm.txt", "Fichier des compositions"),
}

FALLBACKS = {
    "specialites": [
        "https://rec-bdm.ansm.integra.fr/telechargement.php?fichier=CIS_bdpm.txt",
        "https://base-donnees-publique.medicaments.gouv.fr/telechargement.php?fichier=CIS_bdpm.txt",
    ],
    "presentations": [
        "https://rec-bdm.ansm.integra.fr/telechargement.php?fichier=CIS_CIP_bdpm.txt",
        "https://rec-bdm.ansm.integra.fr/telechargement.php?fichier=cis_cip_bdpm.txt",
        "https://base-donnees-publique.medicaments.gouv.fr/telechargement.php?fichier=CIS_CIP_bdpm.txt",
    ],
    "compositions": [
        "https://rec-bdm.ansm.integra.fr/telechargement.php?fichier=CIS_COMPO_bdpm.txt",
        "https://base-donnees-publique.medicaments.gouv.fr/telechargement.php?fichier=CIS_COMPO_bdpm.txt",
    ],
}

class LinkParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links=[]
        self.current=None
    def handle_starttag(self, tag, attrs):
        if tag.lower()=="a":
            d=dict(attrs)
            self.current={"href":d.get("href",""),"text":""}
    def handle_data(self, data):
        if self.current is not None:
            self.current["text"] += " "+data
    def handle_endtag(self, tag):
        if tag.lower()=="a" and self.current is not None:
            self.links.append(self.current)
            self.current=None

def fetch(url):
    req=urllib.request.Request(url,headers={
        "User-Agent":"Mozilla/5.0 (compatible; Medicalc/1.0)",
        "Accept":"text/html,application/xhtml+xml,*/*",
    })
    with urllib.request.urlopen(req,timeout=120,context=ssl.create_default_context()) as r:
        return r.read()

def discover():
    print("Lecture de la page officielle BDPM :",DOWNLOAD_PAGE)
    data=fetch(DOWNLOAD_PAGE)
    page=data.decode("utf-8","replace")
    parser=LinkParser()
    parser.feed(page)
    found={}
    for key,(filename,label) in FILES.items():
        candidates=[]
        for link in parser.links:
            href=html.unescape(link["href"]).strip()
            text=re.sub(r"\s+"," ",html.unescape(link["text"])).strip().lower()
            if not href: continue
            score=0
            if label.lower() in text: score+=100
            if filename.lower() in href.lower(): score+=50
            if key=="presentations" and ("présentation" in text or "presentation" in text): score+=20
            if key=="specialites" and ("spécialit" in text or "specialit" in text): score+=20
            if key=="compositions" and "composition" in text: score+=20
            if score:
                candidates.append((score,urllib.parse.urljoin(DOWNLOAD_PAGE,href)))
        candidates.sort(reverse=True)
        found[key]=[u for _,u in candidates]+FALLBACKS[key]
        print(f"{label}: {len(found[key])} lien(s) candidat(s)")
    return found

def download(key, urls, required):
    filename=FILES[key][0]
    last=None
    seen=set()
    for url in urls:
        if url in seen: continue
        seen.add(url)
        print(f"Téléchargement {filename} : {url}")
        try:
            req=urllib.request.Request(url,headers={"User-Agent":"Mozilla/5.0 Medicalc/1.0","Accept":"*/*"})
            with urllib.request.urlopen(req,timeout=180,context=ssl.create_default_context()) as r:
                data=r.read()
            if len(data)>=1000:
                path=Path(filename); path.write_bytes(data)
                print(f"  -> {len(data):,} octets")
                return path
            print(f"  -> réponse vide/trop petite ({len(data)} octets)")
            last=f"réponse vide ({len(data)} octets)"
        except (urllib.error.HTTPError,urllib.error.URLError,TimeoutError) as e:
            print(f"  -> échec : {e}"); last=e
    if required:
        raise RuntimeError(f"Impossible de télécharger {filename}: {last}")
    print(f"  ⚠️ {filename} indisponible, import poursuivi sans ce fichier.")
    return None

def read_rows(path):
    with path.open("r",encoding="latin-1",newline="") as f:
        return list(csv.reader(f,delimiter="\t"))

def main():
    urls=discover()
    files={}
    files["specialites"]=download("specialites",urls["specialites"],True)
    files["presentations"]=download("presentations",urls["presentations"],False)
    files["compositions"]=download("compositions",urls["compositions"],False)

    specialites=read_rows(files["specialites"])
    presentations=read_rows(files["presentations"]) if files["presentations"] else []
    compositions=read_rows(files["compositions"]) if files["compositions"] else []

    meds={}
    for row in specialites:
        if not row or not row[0].strip(): continue
        cis=row[0].strip()
        meds[cis]={
            "id":f"CIS-{cis}","cis":cis,
            "nom":row[1].strip() if len(row)>1 else "",
            "forme":row[2].strip() if len(row)>2 else "",
            "voies":[x.strip() for x in row[3].split(";") if x.strip()] if len(row)>3 else [],
            "presentations":[],"substances":[],"source":"BDPM",
            "date_import":datetime.date.today().isoformat(),
            "clinically_validated":False,
        }

    for row in presentations:
        if len(row)>2 and row[0].strip() in meds:
            cis=row[0].strip()
            meds[cis]["presentations"].append({
                "cip7":row[1].strip() if len(row)>1 else "",
                "libelle":row[2].strip() if len(row)>2 else "",
                "cip13":row[6].strip() if len(row)>6 else "",
            })

    for row in compositions:
        if len(row)>3 and row[0].strip() in meds:
            cis=row[0].strip(); sub=row[3].strip()
            if sub and sub not in meds[cis]["substances"]:
                meds[cis]["substances"].append(sub)

    out={"source":"BDPM","date_import":datetime.date.today().isoformat(),"medicaments":list(meds.values())}
    Path("medicaments.json").write_text(json.dumps(out,ensure_ascii=False,indent=2),encoding="utf-8")
    print(f"Import terminé : {len(meds):,} spécialités")
    print(f"Avec présentations : {sum(bool(m['presentations']) for m in meds.values()):,}")

if __name__=="__main__":
    main()
