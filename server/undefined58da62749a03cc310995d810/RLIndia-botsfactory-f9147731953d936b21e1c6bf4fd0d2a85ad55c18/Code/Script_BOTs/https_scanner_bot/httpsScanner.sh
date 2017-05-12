#!/bin/bash
##### Checking for number of arguments
if [ "$#" -ne 1 ]; then
    echo "Illegal number of parameters"
    exit 1
fi
##### Installing nmap
sudo apt-get install nmap
##### to get the open port 
nmap -v -p443 -PN $1 | grep open | grep Discovered > /tmp/httpsReport.txt
####to filter out the IP from nmapreport
 sed -e 's/\<Discovered\>//g' /tmp/httpsReport.txt > test3
rm -rf test2
 sed -e 's/\<open\>//g' test3 > test4
rm -rf test3
 sed -e 's/\<port\>//g' test4 > test5
rm -rf test4
 sed -e 's/\<443\>//g' test5 > test6
rm -rf test5

## removin special chaaracter /#####
sed 's/\///' test6 > test7
rm -rf test6
 sed -e 's/\<tcp\>//g' test7 > test8
rm -rf test7
sed -e 's/\<on\>//g' test8 > test9
rm -rf test8
sed 's/[[:blank:]]//g' test9 > /tmp/httpsReport.txt
rm -rf test9
