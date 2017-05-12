import os,sys
import json
from subprocess import *

def startService(startCommand):
    startFileObject = os.popen(startCommand)
    output = startFileObject.read()
    exitCode = startFileObject.close()
    return output, exitCode

def statusService(statusCommand):
   statusFileObject  = os.popen(statusCommand)
   output = statusFileObject.read()
   exitCode = statusFileObject.close()
   return output.strip(), exitCode
 
def create_successful_response(status, result):
    jsonSuccessResponse = """{
                                "status": "%s",
                                "outputParameters": 
                                    {
                                        "statusDescription":"%s"
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
    startCommand = 'sudo service nginx start'
    output, exitCode = startService(startCommand)
    
    if (exitCode) != None :
        jsonErrorResponse = create_error_response(1, "check command")
        print jsonErrorResponse
        exit(1)
       
    statusCommand = 'sudo service nginx status'
    output, exitCode = statusService(statusCommand)

    if (exitCode) != None :
        jsonErrorResponse = create_error_response(1, "check command")
        print jsonErrorResponse
        
    else :
        jsonSuccessResponse = create_successful_response(0, output)
        print jsonSuccessResponse
        
except Exception as e:
    jsonErrorResponse = create_error_response(1, e)
    print >>sys.stderr, jsonErrorResponse
    exit(1) 