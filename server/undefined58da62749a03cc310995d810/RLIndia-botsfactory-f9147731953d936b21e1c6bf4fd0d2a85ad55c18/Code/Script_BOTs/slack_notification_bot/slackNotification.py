import requests
import sys


def slack_notification(hostname, channelName, msg, userName,icon,color):
    url = hostname 
    attachmentTemplates = """ [
                                {
                                  "color": "%s",
                                  "title": "%s",
                                  "footer": "RLCatalyst-Telemetry",
                                  "footer_icon": "https://platform.slack-edge.com/img/default_application_icon.png"
                                }
                              ]
                            """
    icon = '%s' 
    color = '%s'
    attachment = attachmentTemplates%(color,msg)
    payload = 'payload={"attachments": %s, "channel": "%s", "username": "%s", "iconEmoji": "%s"}'%(attachment, channelName, userName, icon)
    headers = {
        'content-type': "application/x-www-form-urlencoded"
        }
    response = requests.request("POST", url, data=payload, headers=headers)
    return response.text , response.status_code

def create_successful_response(status, result):
    jsonSuccessResponse = """{
                                "status": "%s",
                                "outputParameters": {
                                    "slackOutput":"%s"
                                }
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
    channelName = sys.argv[2]
    msg = sys.argv[3]
    userName = sys.argv[4]
    icon = sys.argv[5] 
    color = sys.argv[6]
    
    result = slack_notification(hostname, channelName, msg, userName, icon, color)
    jsonSuccessResponse = create_successful_response(0, result)
    print jsonSuccessResponse
    exit(0)
  
except Exception as e:
    jsonErrorResponse = create_error_response(1, e)
    print >> sys.stderr, jsonErrorResponse
    exit(1) 
