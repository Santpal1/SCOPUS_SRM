import time
import re
import requests
import pandas as pd
import mysql.connector
from mysql.connector import errorcode
from collections import defaultdict
import logging
from datetime import datetime

# ——— SETUP LOGGING ———
logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("faculty_quartile_summary.log", encoding='utf-8'),
        logging.StreamHandler()
    ]
)

# ——— CONFIG ———
DB_CONFIG = {
    'user':     'root',
    'password': '',
    'host':     'localhost',
    'database': 'scopus'
}

SJR_FILES = {
    2022: 'scimagojr2022.csv',
    2023: 'scimagojr2023.csv',
    2024: 'scimagojr2024.csv'
}

CROSSREF_BASE = "https://api.crossref.org/works/"

# ——— HELPERS ———
def clean_issn(raw):
    if pd.isna(raw): return None
    s = str(raw).replace('-', '').strip().upper()
    return s if len(s) in (7, 8) else None

def fetch_first_issn(doi):
    try:
        url = CROSSREF_BASE + doi
        r = requests.get(url, timeout=10)
        r.raise_for_status()
        issns = r.json().get('message', {}).get('ISSN', [])
        for i in issns:
            c = clean_issn(i)
            if c:
                return c
    except Exception as e:
        logging.warning(f"[CrossRef] Failed to fetch ISSN for DOI {doi}: {e}")
    return None

# ——— 1. Build year-wise ISSN→Quartile map ———
yearly_issn_quart = defaultdict(dict)

for year, filename in SJR_FILES.items():
    try:
        df = pd.read_csv(filename, delimiter=';', encoding='utf-8-sig')
        for raw_issns, q in zip(df['Issn'], df['SJR Best Quartile']):
            if pd.isna(raw_issns) or pd.isna(q): continue
            for part in re.split(r'[^0-9A-Za-z]+', str(raw_issns)):
                issn = clean_issn(part)
                if issn:
                    yearly_issn_quart[year][issn] = q
        logging.info(f"✅ Loaded {len(yearly_issn_quart[year])} ISSN→Quartile entries for {year}")
    except Exception as e:
        logging.error(f"❌ Failed to load {filename}: {e}")

# ——— 2. Connect to MySQL ———
try:
    cnx = mysql.connector.connect(**DB_CONFIG)
    logging.info("Connected to MySQL.")
except mysql.connector.Error as err:
    logging.critical(f"MySQL connection failed: {err}")
    exit(1)

cursor = cnx.cursor()

# ——— 3. Create summary table if not exists ———
cursor.execute("""
CREATE TABLE IF NOT EXISTS faculty_quartile_summary (
  id INT PRIMARY KEY AUTO_INCREMENT,
  scopus_id VARCHAR(50),
  year INT,
  q1_count INT DEFAULT 0,
  q2_count INT DEFAULT 0,
  q3_count INT DEFAULT 0,
  q4_count INT DEFAULT 0
);
""")
cnx.commit()

# ——— 4. Fetch relevant papers ———
cursor.execute("SELECT scopus_id, doi, date FROM papers WHERE doi IS NOT NULL;")
papers = cursor.fetchall()
logging.info(f"Fetched {len(papers)} papers with DOIs.")

# ——— 5. Process papers and aggregate counts ———
summary = defaultdict(lambda: defaultdict(int))  # summary[(scopus_id, year)][quartile] = count

for idx, (scopus_id, doi, date) in enumerate(papers, 1):
    if not doi or not date:
        continue
    year = date.year
    if year not in SJR_FILES:
        continue  # skip years we don't have data for

    issn = fetch_first_issn(doi)
    if not issn:
        logging.warning(f"[{idx}] No ISSN found for DOI {doi}")
        continue

    quart = yearly_issn_quart[year].get(issn)
    if not quart:
        logging.warning(f"[{idx}] No quartile for ISSN {issn} in year {year}")
        continue

    summary[(scopus_id, year)][quart] += 1
    logging.info(f"[{idx}] {scopus_id} ({year}) → {quart}")

    if idx % 50 == 0:
        time.sleep(1)  # polite CrossRef throttle

# ——— 6. Insert into summary table ———
cursor.execute("TRUNCATE TABLE faculty_quartile_summary")

insert_sql = """
INSERT INTO faculty_quartile_summary (scopus_id, year, q1_count, q2_count, q3_count, q4_count)
VALUES (%s, %s, %s, %s, %s, %s)
"""

for (scopus_id, year), counts in summary.items():
    q1 = counts.get("Q1", 0)
    q2 = counts.get("Q2", 0)
    q3 = counts.get("Q3", 0)
    q4 = counts.get("Q4", 0)
    cursor.execute(insert_sql, (scopus_id, year, q1, q2, q3, q4))

cnx.commit()
logging.info("✅ Summary table populated successfully.")

# ——— 7. Cleanup ———
cursor.close()
cnx.close()
logging.info("Closed MySQL connection.")