#!/usr/bin/python
#
# Check Expiration Date of SSL certificates
#
# Koen Van Impe
#
# Uses the file ceds.checks as input ; one entry per line, format <host>:<port>
#
#  ceds.checks :            www.google.com:443
#                           imap.mydomain.tld:993
#                       

from OpenSSL import SSL
import socket, datetime
import smtplib
from email.mime.text import MIMEText
import json
import sys

def ssl_check_expiration(host, port):
    response = ""    
    try:
        context = SSL.Context(SSL.SSLv23_METHOD)
        sock = SSL.Connection(context, socket.socket(socket.AF_INET, socket.SOCK_STREAM))

        try:
            sock.connect( (str(host) , int(port)) )
            sock.send("\x00")       # Send empty to trigger response
            get_peer_cert=sock.get_peer_certificate()
            sock.close()

            exp_date =  datetime.datetime.strptime(get_peer_cert.get_notAfter(),'%Y%m%d%H%M%SZ')        
            days_to_expire = int((exp_date - cur_date).days)
                        
            if days_to_expire < 0:
                response = response + "\n %s  EXPIRED" % (host)
            elif alert_days > days_to_expire:
                response = response + "\n %s  expires in %s days " % (host, days_to_expire)
                # print response
            
            return days_to_expire
        except:
            response = response + "\n Unable to connect to %s  " % (host)
            return None
    except SSL.Error,e:
        return None

def create_successful_response(status, totalNumberOfCertificates, result):
    jsonSuccessResponse = """{
                                "status": "%s",
                                "outputParameters": {
                                    "totalNumberOfCertificates":"%s",
                                    "machine":%s
                                }
                             }
                        """%(status, totalNumberOfCertificates, result)
    return jsonSuccessResponse

def create_error_response(status, description):
    jsonErrorResponse = """{
                                "status": "%s",
                                 "errorParameters": {
                                    "description":"%s"}  
                            }"""%(status, description)
    return jsonErrorResponse

try:
    servers_to_check = sys.argv[1]
    servers = open( servers_to_check, "r")
    cur_date = datetime.datetime.utcnow()
    cert_tested = 0 
    data = []

    for line in servers:
            host = line.strip()
            port = 443
            days_to_expire = ssl_check_expiration(host, port)
            cert_tested = cert_tested + 1

            dictionary = {}
            dictionary["hostname"] = host
            dictionary["daysRemaining"] = days_to_expire
            data.append(dictionary)

    jsonSuccessResponse = create_successful_response(0, cert_tested, json.dumps(data))
    print jsonSuccessResponse
    exit(0)
except Exception as e:
    jsonErrorResponse = create_error_response(1, "Error Obtaining Certificate Expiry Details")
    print >> sys.stderr, jsonErrorResponse
    exit(1)
