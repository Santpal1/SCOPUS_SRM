import sys
import io
import mysql.connector
from elsapy.elsclient import ElsClient
from elsapy.elsprofile import ElsAuthor
import json
import os
from datetime import datetime

# ---------------- UTF-8 fix ----------------
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
# ------------------------------------------

LOG_FILE = "progress_log.jsonl"

# ---------- LOGGING ----------

def log_progress(status, progress=None, details=None):
    entry = {
        "time": datetime.now().isoformat(),
        "status": status,
        "progress": progress,
        "details": details or {}
    }
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(json.dumps(entry, ensure_ascii=False) + "\n")
    print(json.dumps(entry, ensure_ascii=False), flush=True)

def clear_progress_log():
    if os.path.exists(LOG_FILE):
        os.remove(LOG_FILE)

# ---------- CONFIG ----------

def load_config():
    with open("./config.json") as f:
        return json.load(f)

def connect_to_database():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="",
        database="scopuss",
        port=3306
    )

def initialize_elsclient(config):
    return ElsClient(config["apikey"])

# ---------- HELPERS ----------

def clean_scopus_id(val):
    if val is None:
        return None
    try:
        return int(float(str(val)))
    except:
        return None

# ---------- DB QUERIES ----------

def get_existing_papers(cursor):
    """
    {(faculty_id, doi)}
    """
    cursor.execute("SELECT scopus_id, doi FROM papers")
    existing = set()
    for sid, doi in cursor.fetchall():
        if doi:
            existing.add((sid, doi))
    return existing

def get_faculty_scopus_map(cursor):
    """
    { faculty_id: [scopus_id1, scopus_id2, ...] }
    """
    cursor.execute("""
        SELECT faculty_id, scopus_id
        FROM users
        WHERE faculty_id IS NOT NULL
    """)
    faculty_map = {}
    for faculty_id, scopus_id in cursor.fetchall():
        scopus_id = clean_scopus_id(scopus_id)
        if not scopus_id:
            continue
        faculty_map.setdefault(faculty_id, []).append(scopus_id)
    return faculty_map

# ---------- INSERT PAPER ----------

def insert_paper(cursor, scopus_id, doi, title, pub_type, pub_name, date, authors, affiliations):
    authors += [""] * (6 - len(authors))
    affiliations += [""] * (3 - len(affiliations))

    cursor.execute("""
        INSERT IGNORE INTO papers (
            scopus_id, doi, title, type, publication_name, date,
            author1, author2, author3, author4, author5, author6,
            affiliation1, affiliation2, affiliation3
        )
        VALUES (%s, %s, %s, %s, %s, %s,
                %s, %s, %s, %s, %s, %s,
                %s, %s, %s)
    """, (
        scopus_id, doi, title, pub_type, pub_name, date,
        *authors[:6], *affiliations[:3]
    ))

# ---------- MAIN ----------

def fetch_new_papers():
    clear_progress_log()
    log_progress("Starting Scopus fetch", 0)

    config = load_config()
    client = initialize_elsclient(config)

    conn = connect_to_database()
    cursor = conn.cursor()

    faculty_map = get_faculty_scopus_map(cursor)
    existing_papers = get_existing_papers(cursor)

    total_faculty = len(faculty_map)
    total_new_papers = 0

    for idx, (faculty_id, scopus_ids) in enumerate(faculty_map.items(), start=1):
        progress = idx / total_faculty
        log_progress(f"Faculty {faculty_id} ({idx}/{total_faculty})", progress)

        for scopus_id in scopus_ids:
            author = ElsAuthor(
                uri=f"https://api.elsevier.com/content/author/author_id/{scopus_id}"
            )

            if not author.read_docs(client):
                continue

            for doc in author.doc_list:
                doi = doc.get("prism:doi")
                if not doi:
                    continue

                key = (scopus_id, doi)
                if key in existing_papers:
                    continue

                title = doc.get("dc:title", "Unknown Title")
                pub_type = doc.get("prism:aggregationType", "Journal")
                pub_name = doc.get("prism:publicationName", "Unknown")
                date = doc.get("prism:coverDate")

                authors = [a.get("authname", "") for a in doc.get("author", [])[:6]]
                affiliations = [a.get("affilname", "") for a in doc.get("affiliation", [])[:3]]

                insert_paper(
                    cursor,
                    scopus_id,
                    doi,
                    title,
                    pub_type,
                    pub_name,
                    date,
                    authors,
                    affiliations
                )

                existing_papers.add(key)
                total_new_papers += 1

        conn.commit()

    log_progress(
        "Fetch complete",
        1,
        {"total_new_papers": total_new_papers}
    )

    cursor.close()
    conn.close()
    log_progress("DB closed", 1)

# ---------- ENTRY ----------
if __name__ == "__main__":
    fetch_new_papers()
