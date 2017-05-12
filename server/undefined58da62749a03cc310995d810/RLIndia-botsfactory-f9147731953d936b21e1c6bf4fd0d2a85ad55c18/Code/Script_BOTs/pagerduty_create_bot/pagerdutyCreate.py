import sys
import requests
from requests.auth import HTTPBasicAuth

def create_pagerdutyIncident(service_key, event_type, description, client, client_url, details):
    
    url = "https://events.pagerduty.com/generic/2010-04-15/create_event.json"
    headers = {
                'content-type': "application/json"
            }
     
    payload = """
                    {    
                  "service_key": "%s",
                  "event_type": "%s",
                  "description": "%s",
                  "client": "%s",
                  "client_url": "%s",
                  "details": "%s",
                  "contexts":[ 
                    {
                      "type": "link",
                      "href": "http://telemetry.rlcatalyst.com/#/events",
                      "text": "View Events on Telemetry"
                    },{
                      "type": "link",
                      "href": "http://telemetry.rlcatalyst.com/#/sae/",
                      "text": "View SAE on Telemetry"
                    }
                  ]
                }
            """ %(service_key, event_type, description, client, client_url, details) 

    response = requests.request("POST", url, data=payload, headers=headers)
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
    service_key = sys.argv[1]
    event_type = sys.argv[2]
    description = sys.argv[3]
    client = sys.argv[4]
    client_url = sys.argv[5]
    details = sys.argv[6]

    result = create_pagerdutyIncident(service_key, event_type, description, client, client_url, details)
    if result.status_code not in [201,200]:
        jsonErrorResponse = create_error_response(1, result.text)
        print >> sys.stderr, jsonErrorResponse
        exit(1)

    jsonSuccessResponse = create_successful_response(0, result.text)
    print jsonSuccessResponse
    exit(0)

except Exception as e:
    jsonErrorResponse = create_error_response(1, e)
    print >> sys.stderr, jsonErrorResponse
    exit(1)  
