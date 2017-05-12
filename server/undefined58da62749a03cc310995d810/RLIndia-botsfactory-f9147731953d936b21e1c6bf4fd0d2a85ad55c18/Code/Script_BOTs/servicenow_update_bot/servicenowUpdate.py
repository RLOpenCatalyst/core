import sys
import requests
from requests.auth import HTTPBasicAuth

def update_servicenowTicket(hostname, username, password, incidentId, short_description, comments, x_14768_catalyst_first_name,
     x_14768_catalyst_last_name, category, x_14768_catalyst_password, location, state):
    url = hostname + "/api/now/v1/table/incident/" + incidentId
    querystring = {"sysparm_exclude_ref_link":"true"}
    headers = {
                'content-type': "application/json"
            }
    payload = """{
                "short_description": "%s", "comments":"%s","x_14768_catalyst_first_name":"%s",
                "x_14768_catalyst_last_name":"%s","category": "%s",
                "x_14768_catalyst_password": "%s","location":'%s',"state":"%s"}"""%(short_description, comments, x_14768_catalyst_first_name,
     x_14768_catalyst_last_name, category, x_14768_catalyst_password, location, state)
    response = requests.request("PUT", url, data=payload, auth=HTTPBasicAuth(username, password), headers=headers, params=querystring)
    return response

def create_successful_response(status, result):
    jsonSuccessResponse = """{
                                "status": "%s",
                                "outputParameters": %s
                        }"""%(status, result)
    return jsonSuccessResponse

def create_error_response(status, description):
    jsonErrorResponse = """{
                                "status": "%s",
                                 "errorParameters": {
                                    "description":"%s"}  
                            }"""%(status, description)
    return jsonErrorResponse    

try:
    hostname = sys.argv[1]
    username = sys.argv[2]
    password = sys.argv[3]
    incidentId = sys.argv[4]
    short_description = sys.argv[5]
    comments = sys.argv[6]
    x_14768_catalyst_first_name = sys.argv[7]
    x_14768_catalyst_last_name = sys.argv[8]
    category = sys.argv[9]
    x_14768_catalyst_password = sys.argv[10]
    location = sys.argv[11]
    state = sys.argv[12]

    
    result = update_servicenowTicket(hostname, username, password, incidentId, short_description, comments, x_14768_catalyst_first_name,
         x_14768_catalyst_last_name, category, x_14768_catalyst_password, location, state)

    jsonSuccessResponse = create_successful_response(0, result.text)
    print jsonSuccessResponse
    exit(0)

except Exception as e:
    jsonErrorResponse = create_error_response(1, e)
    print >> sys.stderr, jsonErrorResponse
    exit(1) 
