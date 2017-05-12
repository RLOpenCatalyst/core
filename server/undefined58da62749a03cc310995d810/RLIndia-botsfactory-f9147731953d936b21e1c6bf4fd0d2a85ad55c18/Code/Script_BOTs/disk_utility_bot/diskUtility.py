#!/usr/bin/python
import os, sys
import json

def get_system_disk_info():
    used_Percentage = os.popen("df -h / | grep -v Filesystem | awk '{print $5}'").readline().strip()
    disk = os.statvfs("/")
    capacity = disk.f_bsize * disk.f_blocks
    available = disk.f_bsize * disk.f_bavail
    used = disk.f_bsize * (disk.f_blocks - disk.f_bavail)
    return (capacity, used, available, used_Percentage)    

def create_file_size_for_warning (capacity, used, warningPercent):
    warningFileSize = warningPercent * capacity
    creationFileSize = warningFileSize - used
    creationFileSizeKB = int(creationFileSize/1024)
    command = "fallocate -l %sK warningFile.log" % creationFileSizeKB
    os.system (command)
    return (creationFileSize,creationFileSizeKB)

def create_file_size_for_critical (capacity, used, criticalPercent):
    criticalFileSize = criticalPercent * capacity
    creationFileSize =  criticalFileSize - used
    creationFileSizeKB = int(creationFileSize/1024)
    command = "fallocate -l %sK criticalFile.log" % creationFileSizeKB
    os.system (command)
    return (creationFileSize,creationFileSizeKB)

def create_file_size_for_Complete_Volume(capacity, used, completePercent):
    completeVolumeFileSize = completePercent * capacity
    creationFileSize = completeVolumeFileSize - used
    creationFileSizeKB =int(creationFileSize/1024)
    command = "fallocate -l %sK completeVolumeFile.log" % creationFileSizeKB
    os.system (command)

def create_successful_response(status, completeVolumeSize, preUsedSpace, preAvailableSpace, preUsedPercent, postUsedSpace, postAvailableSpace, postUsedPercent):
    jsonSuccessResponse = """{
                                "status": "%s",
                                 "outputParameters": {
                                    "completeVolumeSize":"%s",
                                    "preUsedSpace":"%s",
                                    "preFreeSpace":"%s",
                                    "preUsedPercentage":"%s",
                                    "postUsedSpace":"%s",
                                    "postFreeSpace":"%s",
                                    "postUsedPercentage":"%s"
                                }  
                            }"""%(status, completeVolumeSize, preUsedSpace, preAvailableSpace, preUsedPercent, postUsedSpace, postAvailableSpace, postUsedPercent)
    return jsonSuccessResponse

def create_error_response(status, description):
    jsonErrorResponse = """{
                                "status": "%s",
                                 "errorParameters": {
                                    "description":"%s"}  
                            }"""%(status, description)
    return jsonErrorResponse    

try:
    
    warningPercent=0.88
    criticalPercent=0.96
    completePercent=0.99
    option=sys.argv[1]

    completeVolumeSize, preUsedSpace, preAvailableSpace, preUsedPercent = get_system_disk_info()

    if option =='warning': 
        create_file_size_for_warning (completeVolumeSize, preUsedSpace, warningPercent)
    elif option=='critical': 
        create_file_size_for_critical(completeVolumeSize, preUsedSpace, criticalPercent)
    else:
        create_file_size_for_Complete_Volume(completeVolumeSize, preUsedSpace, completePercent)

    completeVolumeSize, postUsedSpace, postAvailableSpace, postUsedPercent = get_system_disk_info()

    jsonSuccessResponse = create_successful_response(0, completeVolumeSize, preUsedSpace, preAvailableSpace, preUsedPercent, postUsedSpace, postAvailableSpace, postUsedPercent)
    print jsonSuccessResponse
    exit(0)

except Exception as e:
    jsonErrorResponse = create_error_response(1, e)
    print >> sys.stderr, jsonErrorResponse
    exit(1)    