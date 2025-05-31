import pandas as pd
import mysql.connector

df = pd.read_excel("scival.xlsx")

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

df = df[[
    'doi', 'scopus_author_id_first', 'scopus_author_id_corresponding',
    'sustainable_development_goals', 'qs_subject_code', 'qs_subject_field_name',
    'asjc_code', 'asjc_field_name', 'no_of_countries', 'country_list',
    'no_of_institutions', 'institution_list', 'total_authors'
]]

conn = mysql.connector.connect(
    host='localhost',
    user='root',
    password='',
    database='scopus'
)
cursor = conn.cursor()

cursor.execute("SELECT doi FROM papers")
existing_dois = set(str(row[0]).strip() for row in cursor.fetchall())

insert_query = """
INSERT INTO paper_insights (
    doi, scopus_author_id_first, scopus_author_id_corresponding,
    sustainable_development_goals, qs_subject_code, qs_subject_field_name,
    asjc_code, asjc_field_name, no_of_countries, country_list,
    no_of_institutions, institution_list, total_authors
) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
"""

for _, row in df.iterrows():
    doi = str(row['doi']).strip()
    if doi == '-' or doi == '' or pd.isna(row['doi']):
        continue 
    if doi not in existing_dois:
        continue

    try:
        print(f"Inserting {str(row['doi'])}")
        cursor.execute(insert_query, tuple(row.fillna('').values))
    except mysql.connector.IntegrityError as e:
        if e.errno == 1062:
            continue 
        else:
            raise

conn.commit()
cursor.close()
<<<<<<< HEAD
conn.close()
=======
conn.close()
>>>>>>> 7df1d0bda94d9910207082cd8e6f29ae7991f0e6
