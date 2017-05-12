from __future__ import division
import sys
import math

def getResourceUsage(pCents, threshold):
	
	if ( threshold > 100 ) :
		print "Threshold value should be between 1 to 100"
		
	period = len(pCents)
	initialValue = int(pCents[0])
	presentValue = int(pCents[len(pCents) - 1])
	growthRate, usageLimit = growthPredictor(initialValue, presentValue, period, threshold)
	return growthRate, usageLimit


def growthPredictor(initialValue, presentValue, period, threshold):
	growthRate = math.pow((presentValue/initialValue), (1/period)) - 1.00
	usageLimit = math.log((threshold/initialValue), 10.00)/math.log((1 + growthRate), 10.00)
	return growthRate, round(usageLimit)


def extractdata(filepath):

	f = open(filepath, 'r')
	pCents = []
	for line in f:
	    k, v = line.strip().split(',')
	    pCents.append(v)
	f.close()
		
	return pCents

def create_successful_response(status, growthRate, threshold, timeUnit, expectedTime):
    jsonSuccessResponse = """{
                                "status": "%s",
                                 "outputParameters": {
                                    "growthRate":%s,
                                    "threshold":%s,
                                    "timeUnit":"%s",
                                    "expectedTime":%s
                                }  
                            }"""%(status, growthRate, threshold, timeUnit, expectedTime)
    return jsonSuccessResponse

def create_error_response(status, description):
    jsonErrorResponse = """{
                                "status": "%s",
                                 "errorParameters": {
                                    "description":"%s"}  
                            }"""%(status, description)
    return jsonErrorResponse    

try:
	
	filepath = sys.argv[1]
	threshold = int(sys.argv[2])
	timeUnit = sys.argv[3]
	pCents = extractdata(filepath)
	growthRate, usageLimit = getResourceUsage(pCents, threshold)
	jsonSuccessResponse = create_successful_response(0, growthRate, threshold, timeUnit, usageLimit)
 	print jsonSuccessResponse
   	exit(0)

except Exception as e:
    jsonErrorResponse = create_error_response(1, e)
    print >> sys.stderr, jsonErrorResponse
    exit(1)    