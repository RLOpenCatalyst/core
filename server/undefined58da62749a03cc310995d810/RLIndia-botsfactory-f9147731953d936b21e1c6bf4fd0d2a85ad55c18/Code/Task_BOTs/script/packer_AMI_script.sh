#! /bin/bash
# packer_AMI_script.sh release_number 'access_key_of_aws_account' 'secret_key_of_awsaccount'


# Intialization of parameters
rlno=$1
accesskey=$2
secretkey=$3
#echo $rlno
#echo $accesskey
#echo $secretkey


#Installation of packer
#To get the Architure type
arch=`uname -m`
#Based on Arch download the packer script
if [ ""$arch"" == 'x86_64' ] 
then
   download='https://releases.hashicorp.com/packer/0.12.0/packer_0.12.0_linux_amd64.zip'
else
   download='https://releases.hashicorp.com/packer/0.12.0/packer_0.12.0_linux_386.zip'
fi
#Downloading the packer zip file
wget $download
#Installing the unzip package
sudo apt-get install -y unzip
#Getting the package name
filename=`echo $download | sed 's#.*/##'`
echo $filename 
#Unzipping the packer download
unzip $filename
#Copying the packer runnable file to /usr/bin
cp packer /usr/bin/
#removing the packer and zip folder
rm -rf packer $filename


# Cloning of the repo
#changing the directory to root
cd /root/
#Installing git
sudo apt-get install -y git
#Doing a git clone of the catalyst packing repository
git clone https://catalyst-engg:catalyst_123@github.com/RLIndia/catalystpackaging.git
#Changing into the AWS AMI folder
cd catalystpackaging/RLCatalystImage
# Replacing to lastest release 
sed -i -e "s/3.1.0/$rlno/g" rlcatalyst.sh
# Replacing the access key to required access key
sed -i -e "0,/XXXXXXX/s/XXXXXXX/$2/" rlcatalyst.json
# Replacing the secret key to require secret key
sed -i -e "s/XXXXXXX/$3/g" rlcatalyst.json
# Replacing the AMI Name to AMI name with release number
sed -i -e "s/3.3.1/$rlno/g" rlcatalyst.json


# Running of packer
# To build the AMI from packer script
sudo packer build rlcatalyst.json
