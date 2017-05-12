import os,sys
import json
# from subprocess import *
# from subprocess import Popen,PIPE,STDOUT,call

def delete(filepath):
	command = "rm " + filepath
	result = os.system(command)
	return result
	
def create_successful_response(status, filepath):
	jsonSuccessResponse = """{
								"status": "%s",
								"outputParameters": { 
									"cleanedUpFile":"%s"
								}
						}"""%(status, filepath)
	return jsonSuccessResponse

def create_error_response(status, description):
	jsonErrorResponse = """{
								"status": "%s",
								 "errorParameters": {
									"description":"%s"
									}  
							}"""%(status, description)
	return jsonErrorResponse

try:
	findOutput=os.popen('find / -name "*.log" -type f -size  +1c -exec du -b {} ";" | sort -rh | head -n1').readlines()
	filepath = None
	filesize = None
	for i in findOutput:
		temp = i.split("\t")
		filepath = temp[1]
		filesize = int(temp[0])

	result = None
	result = delete(filepath)

	if result == 0:
		response = create_successful_response(result, filepath)
	else :
		response = create_error_response(1, "Delete Operation Failed")
	print response
	exit(0)	
except Exception as e:
	print "Exception %s" %e
	jsonErrorResponse = create_error_response(1, e)
	print >>sys.stderr, jsonErrorResponse
	exit(1)
