import mysql.connector
from elsapy.elsclient import ElsClient
from elsapy.elsprofile import ElsAuthor
import json
import random
import time
from datetime import datetime

def load_config():
    try:
        with open("./config.json") as con_file:
            return json.load(con_file)
    except FileNotFoundError:
        print("Config file not found. Please ensure 'backend/config.json' exists.")
        exit(1)

def connect_to_database():
    try:
        conn = mysql.connector.connect(
            host="localhost",
            user="root",
            password="",
            database="scopus",
            port=3306
        )
        return conn
    except mysql.connector.Error as err:
        print(f"Database connection failed: {err}")
        exit(1)

def initialize_elsclient(config):
    try:
        return ElsClient(config['apikey'])
    except KeyError:
        print("API key not found in config file.")
        exit(1)

def get_existing_papers(cursor):
    cursor.execute("SELECT scopus_id, doi FROM papers;")
    results = cursor.fetchall()
    existing_papers = {}
    for row in results:
        paper_id, doi = row
        if paper_id not in existing_papers:
            existing_papers[paper_id] = set()
        if doi:  # Some papers might not have DOIs
            existing_papers[paper_id].add(doi)
    return existing_papers

def get_existing_authors(cursor):
    cursor.execute("SELECT scopus_id FROM users;")
    return {row[0] for row in cursor.fetchall()}

def insert_user(cursor, conn, scopus_id, name, docs_count):
    cursor.execute("""
        INSERT INTO users (scopus_id, name, docs_count, access) 
        VALUES (%s, %s, %s, 2) 
        ON DUPLICATE KEY UPDATE name = VALUES(name), docs_count = VALUES(docs_count)
    """, (scopus_id, name, docs_count))
    conn.commit()

def insert_paper(cursor, conn, scopus_id, doi, title, pub_type, pub_name, date, authors, affiliations):
    # Pad authors and affiliations arrays if needed
    authors += [""] * (6 - len(authors)) 
    affiliations += [""] * (3 - len(affiliations))
    
    cursor.execute("""
        INSERT INTO papers (scopus_id, doi, title, type, publication_name, date, 
                            author1, author2, author3, author4, author5, author6, 
                            affiliation1, affiliation2, affiliation3)
        VALUES (%s, %s, %s, %s, %s, %s, 
                %s, %s, %s, %s, %s, %s, 
                %s, %s, %s)
        ON DUPLICATE KEY UPDATE title = VALUES(title), type = VALUES(type), 
                                publication_name = VALUES(publication_name), date = VALUES(date)
    """, (scopus_id, doi if doi else None, title, pub_type, pub_name, date, 
          *authors[:6], *affiliations[:3]))
    conn.commit()




def fetch_new_papers():
    # Load configuration and initialize connections
    config = load_config()
    conn = connect_to_database()
    cursor = conn.cursor()
    client = initialize_elsclient(config)
    
    # Get existing data
    existing_papers = get_existing_papers(cursor)
    existing_authors = get_existing_authors(cursor)
    
    # Define list of Scopus IDs to check
    scopus_ids = [
        "35146619400", "57226266325", "57216474980", "36148240300", "26639006000", "26639841900", 
        "24776839900", "56962827900", "55445341200", "56635856200", "26326397200", "56901450600", 
        "57209822555", "35070109700", "57192177838", "57225400932", "57191663448", "57223054981", 
        "12767780000", "24605697100", "25626737800", "55787221000", "57193133229", 
        "57224691110", "55356546000", "57188588453", "57191840929", "57216770442", "57215845190", 
        "53866078700", "37077724000", "55441125500", "55315128400", "56437414100", "57216477082", 
        "57193068294", "57191962994", "57201993520", "16023990700", "57193082825", "55787336700", 
        "57217860062", "56728784600", "23985792700", "57191625915", "56002285900", 
        "57224737974", "57192392105", "57201879134", "55236532400", "57194773637", "57191223373", 
        "57215283908", "57119668200", "57194585718", "23569177000", "57216767092", "57216546834", 
        "57211389122", "57208852312", "57209062963", "57193094668", "57190127799", "57224941876", 
        "57202677096", "56034676900", "58167027800", "57197087263", "57211492056", "57216551952", 
        "57200795786", "57210193056", "57216656961", "57203312738", "57216786127", "57195978363", 
        "57208140416", "57192553778", "57213313655", "57222598188", "57044262600", "57685997700", 
        "57222423930", "57204053224", "57189062128", "55206524500", "56636159000", "56841346000", 
        "57057765800", "57211392718", "56009847600", "56492967600", "57191293517", "56041905600", 
        "56878749800", "56085804500", "57221083703", "57192676397", "57219652863", "57703224500", 
        "58525523100", "57328868900", "58617671800", "57463101900", "57772929400", "57394680400", 
        "58293015300", "58070643900", "56879094600", "57387771900", "57216463728", "57197032967", 
        "57263113200", "57191847013", "57189870674", "57192706302", "56006608600", "57765963700", 
        "57192696331", "57209472555", "57556518200", "57193692207", 
        "57214048538", "57209681241", "57221133130", "57213092807", "56419876900", "56047134300", 
        "58836164900", "57939576200", "57511431500", "57394680400", "57539488300", "57212285315", 
        "57193124489", "57214434805", "55314675700", "55603012200", "55314915400", 
        "57213057349", "57188703143", "56483236600", "57213699624", "57203866544", "35102012400", 
        "57203218678", "57219417857", "56373282800", "57877692100", "57214154317", 
        "57211668492", "56962879100", "56809436800", "57540810700", "56595132800", "57192095137", 
        "56695408500", "57197595490", "57212309621", "57238675600", "57192697670", "57759217900", 
        "56644902000", "36700328900", "57193997795", "57216789624", "57197311163", "57210766676", 
        "57217184428", "57192398597", "57211291356", "57212108129", "37077147900", "57211294691", 
        "57191952791", "57192654144", "57193490360", "58119097400", "57216799569", "57193603659", 
        "57189762692", "57170383600", "56734537800", "57203026440", "8608189700", "57204862284", 
        "57196074175", "57475640300", "57205416227", "57208861799", "39361573900", "57203196510", 
        "56891019000", "57192704832", "53981353000", "57222521426", "54788582100", "57215196082", 
        "57191960194", "6602875353", "57213089519", "57211160113", "56578438800", "57210343217", 
        "56911467900", "57214415472", "57222616675", "57204562624", "55436730800"
    ]
    
    # Track statistics
    total_new_papers = 0
    total_updated_authors = 0
    authors_with_new_papers = set()
    
    # Process each author
    for scopus_id in scopus_ids:
        my_auth = ElsAuthor(uri=f'https://api.elsevier.com/content/author/author_id/{scopus_id}')
        
        if my_auth.read(client):
            author_name = my_auth.full_name
            print(f"Processing Author: {author_name} ({scopus_id})")
            
            # Fetch total document count from author profile
            docs_count = int(my_auth.data.get('coredata', {}).get('document-count', 0))
            
            # Insert or update author information
            if scopus_id not in existing_authors:
                insert_user(cursor, conn, scopus_id, author_name, docs_count)
                total_updated_authors += 1
                print(f"Added new author: {author_name}")
            else:
                # Update author information
                insert_user(cursor, conn, scopus_id, author_name, docs_count)
            
            # Get author's papers
            new_papers_for_author = 0
            if my_auth.read_docs(client):
                for doc in my_auth.doc_list:
                    doi = doc.get("prism:doi")
                    
                    # Check if this paper is new (not in existing_papers for this author)
                    is_new_paper = (
                        scopus_id not in existing_papers or 
                        (doi and doi not in existing_papers.get(scopus_id, set()))
                    )
                    
                    if is_new_paper:
                        title = doc.get("dc:title", "Unknown Title")
                        pub_type = doc.get("prism:aggregationType", "journal").lower()
                        pub_name = doc.get("prism:publicationName", "Unknown Journal")
                        date = doc.get("prism:coverDate", "0000-00-00")
                        
                        authors = [author.get("authname", "Unknown Author") for author in doc.get("author", [])[:6]]
                        affiliations = [affil.get("affilname", "Unknown Affiliation") for affil in doc.get("affiliation", [])[:3]]
                        
                        # Insert the new paper
                        insert_paper(cursor, conn, scopus_id, doi, title, pub_type, pub_name, date, authors, affiliations)
                        
                        print(f"  Added new paper: {title}")
                        new_papers_for_author += 1
                        total_new_papers += 1
                
                # If we found new papers for this author, add them to our tracking set
                if new_papers_for_author > 0:
                    authors_with_new_papers.add(author_name)
            else:
                print(f"Failed to read documents for {scopus_id}.")
        else:
            print(f"Failed to read author data for {scopus_id}.")
    
    # Display summary with Easter egg if new papers were found
    if total_new_papers > 0:
        
        # Print summary
        print(f"\nUpdate Summary ({datetime.now().strftime('%Y-%m-%d %H:%M:%S')})")
        print(f"Total new papers added: {total_new_papers}")
        print(f"Authors with new publications: {len(authors_with_new_papers)}")
        print(f"Authors updated: {total_updated_authors}")
        
        # List authors who had new papers
        if authors_with_new_papers:
            print("\nNew papers from:")
            for idx, author in enumerate(sorted(authors_with_new_papers), 1):
                print(f"  {idx}. {author}")
    else:
        print("\nNo new papers found. Database is up to date!")
    
    # Clean up
    cursor.close()
    conn.close()
    print("\nDatabase connection closed.")

if __name__ == "__main__":
    # Check for secret konami code (this would work if you implement keyboard input)
    # check_konami_code()
    
    print("Starting Scopus paper update...")
    fetch_new_papers()