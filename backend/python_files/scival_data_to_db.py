import pandas as pd
import mysql.connector
import glob
import os

# === CONFIG ===
excel_folder = "scival"  # Change this
excel_files = glob.glob(os.path.join(excel_folder, "*.xlsx"))

# === Read and merge all Excel files ===
combined_df = pd.concat([pd.read_excel(file) for file in excel_files], ignore_index=True)

# === Rename columns ===
combined_df = combined_df.rename(columns={
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
combined_df = combined_df[[
    'doi', 'scopus_author_id_first', 'scopus_author_id_corresponding',
    'sustainable_development_goals', 'qs_subject_code', 'qs_subject_field_name',
    'asjc_code', 'asjc_field_name', 'no_of_countries', 'country_list',
    'no_of_institutions', 'institution_list', 'total_authors'
]]
combined_df['doi'] = combined_df['doi'].astype(str).str.strip()

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
for _, row in combined_df.iterrows():
    doi = str(row['doi']).strip()
    if doi in valid_dois and doi not in already_inserted_dois and doi != '-' and doi != '':
        try:
            cursor.execute(insert_query, tuple(row.fillna('').values))
            inserted_count += 1
        except mysql.connector.IntegrityError as e:
            if e.errno == 1062:
                continue  # Duplicate key, skip
            else:
                raise

# === Finish ===
conn.commit()
cursor.close()
conn.close()

print(f"Inserted {inserted_count} new entries.")
