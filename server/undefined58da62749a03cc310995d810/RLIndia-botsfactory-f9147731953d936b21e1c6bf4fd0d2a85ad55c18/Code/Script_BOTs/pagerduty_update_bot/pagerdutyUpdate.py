
import sys
import json
import requests
from requests.auth import HTTPBasicAuth

def get_pagerdutyIncident(apiToken, incidentKey):
	
	url = "https://api.pagerduty.com/incidents"
	
	headers = {
				"Authorization": "Token token="+ apiToken
			  }
	
	payload = {
				"incident_key": incidentKey
			  } 
	response = requests.request("GET", url, params=payload, headers=headers)
	return response

def update_pagerdutyIncident(apiToken, emailId, pagerDutyId, status):

	url = "https://api.pagerduty.com/incidents" + "/" + pagerDutyId
	
	headers = {
			  "Content-Type": "application/json",
			  "From": emailId,
			  "Authorization": "Token token="+ apiToken
			}

	payload = {
				  "incident": {
				    "type": "incident_reference",
				    "status": status
				}
			}

	response = requests.request("PUT", url, json=payload, headers=headers)
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
	apiToken = sys.argv[1]
	emailId = sys.argv[2]
	incidentKey = sys.argv[3]
	status = sys.argv[4]

	resultGet = get_pagerdutyIncident(apiToken, incidentKey)
	if resultGet.status_code not in [201,200]:
		jsonErrorResponse = create_error_response(1, resultGet.text)
		print >> sys.stderr, jsonErrorResponse
		exit(1)

	resultDictionary = json.loads(resultGet.text)
	pagerDutyId = resultDictionary['incidents'][0]['id']
	resultPut = update_pagerdutyIncident(apiToken, emailId, pagerDutyId, status)
	if resultPut.status_code not in [201,200]:
		jsonErrorResponse = create_error_response(1, resultPut.text)
		print >> sys.stderr, jsonErrorResponse
		exit(1)

	jsonSuccessResponse = create_successful_response(0, resultPut.text)
	print jsonSuccessResponse
	exit(0)

except Exception as e:
	jsonErrorResponse = create_error_response(1, e)
	print >> sys.stderr, jsonErrorResponse
	exit(1)  
