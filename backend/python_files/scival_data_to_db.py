import sys
import pandas as pd
import mysql.connector
import logging
import os

logging.basicConfig(level=logging.INFO, format="%(message)s")

if len(sys.argv) < 2:
    logging.error("❌ No Excel file provided.")
    sys.exit(1)

excel_file = sys.argv[1]

if not os.path.exists(excel_file):
    logging.error(f"❌ File not found: {excel_file}")
    sys.exit(1)

logging.info(f"📂 Processing file: {excel_file}")

# === Read Excel ===
try:
    df = pd.read_excel(excel_file)
except Exception as e:
    logging.error(f"❌ Failed to read Excel file: {e}")
    sys.exit(1)

# === Rename columns ===
df = df.rename(columns={
    'DOI': 'doi',
    'Scopus Author ID First Author': 'scopus_author_id_first',
    'Scopus Author ID Corresponding Author': 'scopus_author_id_corresponding',
    'Sustainable Development Goals (2023)': 'sustainable_development_goals',
    'Quacquarelli Symonds (QS) Subject code': 'qs_subject_code',
    'Quacquarelli Symonds (QS) Subject field name': 'qs_subject_field_name',
    'All Science Journal Classification (ASJC) code': 'asjc_code',
    'All Science Journal Classification (ASJC) field name': 'asjc_field_name',
    'Number of Countries/Regions': 'no_of_countries',
    'Country/Region': 'country_list',
    'Number of Institutions': 'no_of_institutions',
    'Scopus Affiliation names': 'institution_list',
    'Number of Authors': 'total_authors'
})

# === Select required columns and clean DOIs ===
df = df[[
    'doi', 'scopus_author_id_first', 'scopus_author_id_corresponding',
    'sustainable_development_goals', 'qs_subject_code', 'qs_subject_field_name',
    'asjc_code', 'asjc_field_name', 'no_of_countries', 'country_list',
    'no_of_institutions', 'institution_list', 'total_authors'
]]
df['doi'] = df['doi'].astype(str).str.strip()

# === DB Connection ===
conn = mysql.connector.connect(
    host='localhost',
    user='root',
    password='',
    database='scopus'
)
cursor = conn.cursor()

# === Fetch existing DOIs ===
cursor.execute("SELECT doi FROM papers")
valid_dois = set(str(row[0]).strip() for row in cursor.fetchall())

cursor.execute("SELECT doi FROM paper_insights")
already_inserted_dois = set(str(row[0]).strip() for row in cursor.fetchall())

# === Prepare Insert Query ===
insert_query = """
INSERT INTO paper_insights (
    doi, scopus_author_id_first, scopus_author_id_corresponding,
    sustainable_development_goals, qs_subject_code, qs_subject_field_name,
    asjc_code, asjc_field_name, no_of_countries, country_list,
    no_of_institutions, institution_list, total_authors
) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
"""

# === Insert filtered rows ===
inserted_count = 0
for _, row in df.iterrows():
    doi = str(row['doi']).strip()
    if doi in valid_dois and doi not in already_inserted_dois and doi not in ("-", ""):
        try:
            cursor.execute(insert_query, tuple(row.fillna('').values))
            inserted_count += 1
            logging.info(f"✅ Inserted DOI: {doi}")
        except mysql.connector.IntegrityError as e:
            if e.errno == 1062:
                logging.warning(f"⚠️ Duplicate DOI skipped: {doi}")
                continue
            else:
                logging.error(f"❌ DB Insert failed for {doi}: {e}")

# === Finish ===
conn.commit()
cursor.close()
conn.close()

logging.info(f"🎉 Done. Inserted {inserted_count} new entries.")
