import sys
import requests
from requests.auth import HTTPBasicAuth

def create_servicenowTicket(hostname, username, password, short_description, comments, x_14768_catalyst_first_name,
     x_14768_catalyst_last_name, category, x_14768_catalyst_password, location):
    url = hostname + "/api/now/v1/table/incident"
    headers = {
                'content-type': "application/json"
            }
    payload = """{"short_description": '%s', "comments":'%s',"x_14768_catalyst_first_name":'%s',
              "x_14768_catalyst_last_name":'%s',"category": '%s',
              "x_14768_catalyst_password": "%s","location":'%s'}"""%(short_description, comments, x_14768_catalyst_first_name,
     x_14768_catalyst_last_name, category, x_14768_catalyst_password, location)
    response = requests.request("POST", url, data=payload,auth=HTTPBasicAuth(username, password), headers=headers)
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
    short_description = sys.argv[4]
    comments = sys.argv[5]
    x_14768_catalyst_first_name = sys.argv[6]
    x_14768_catalyst_last_name = sys.argv[7]
    category = sys.argv[8]
    x_14768_catalyst_password = sys.argv[9]
    location = sys.argv[10]

    result = create_servicenowTicket(hostname, username, password, short_description, comments, x_14768_catalyst_first_name,
         x_14768_catalyst_last_name, category, x_14768_catalyst_password, location)

    jsonSuccessResponse = create_successful_response(0, result.text)
    print jsonSuccessResponse
    exit(0)

except Exception as e:
    jsonErrorResponse = create_error_response(1, e)
    print >> sys.stderr, jsonErrorResponse
    exit(1)  
