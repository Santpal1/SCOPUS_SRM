from elsapy.elsclient import ElsClient
from elsapy.elsprofile import ElsAuthor, ElsAffil
from elsapy.elsdoc import FullDoc, AbsDoc
from elsapy.elssearch import ElsSearch
import json
    
## Load configuration
con_file = open("backend\config.json")
config = json.load(con_file)
con_file.close()

## Initialize client
client = ElsClient(config['apikey'])

## Author example
# Initialize author with uri
my_auth = ElsAuthor(
        uri = 'https://api.elsevier.com/content/author/author_id/35146619400')
# Read author data, then write to disk
if my_auth.read(client):
    print ("my_auth.full_name: ", my_auth.full_name)
    my_auth.write()
else:
    print ("Read author failed.")

# print(dir(my_auth))


# Affiliation example
# Initialize affiliation with ID as string
# my_aff = ElsAffil(affil_id = '60014340')
# if my_aff.read(client):
#     print ("my_aff.name: ", my_aff.name)
#     my_aff.write()
# else:
#     print ("Read affiliation failed.")


## Load list of documents from the API into affilation and author objects.
# Since a document list is retrieved for 25 entries at a time, this is
#  a potentially lenghty operation - hence the prompt.
print ("Load documents (Y/N)?")
s = input('--> ')

if (s == "y" or s == "Y"):

    ## Read all documents for example author, then write to disk
    if my_auth.read_docs(client):
        print ("my_auth.doc_list has " + str(len(my_auth.doc_list)) + " items.")
        my_auth.write_docs()
    else:
        print ("Read docs for author failed.")
    

## Initialize author search object and execute search
# auth_srch = ElsSearch('authlast(keuskamp)','author')
# auth_srch.execute(client)
# print ("auth_srch has", len(auth_srch.results), "results.")

# ## Initialize affiliation search object and execute search
# aff_srch = ElsSearch('affil(amsterdam)','affiliation')
# aff_srch.execute(client)
# print ("aff_srch has", len(aff_srch.results), "results.")

## Initialize doc search object using Scopus and execute search, retrieving 
#   all results
# doc_srch = ElsSearch("AFFIL(dartmouth) AND AUTHOR-NAME(lewis) AND PUBYEAR > 2011",'scopus')
# doc_srch.execute(client, get_all = True)
# print ("doc_srch has", len(doc_srch.results), "results.")

## Initialize doc search object using ScienceDirect and execute search, 
#   retrieving all results
# doc_srch = ElsSearch("star trek vs star wars",'sciencedirect')
# doc_srch.execute(client, get_all = False)
# print ("doc_srch has", len(doc_srch.results), "results.")