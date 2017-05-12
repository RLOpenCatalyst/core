#! /bin/bash
# packer_Docker_script.sh release_number 'docker_account_username' 'docker_account_password' 'docker_account_registered_email'


#Initialization of script
rlno=$1
dcusername=$2
dcpassword=$3
dcemail=$4
#Packer Installation
#To get the Architure type
arch=`uname -m`
#Based on Arch download the packer script
if [ ""$arch"" == 'x86_64' ]
then
   download='https://releases.hashicorp.com/packer/0.12.0/packer_0.12.0_linux_amd64.zip'
else
   download='https://releases.hashicorp.com/packer/0.12.0/packer_0.12.0_linux_amd64.zip'
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
sudo cp packer /usr/bin/
#removing the packer and zip folder
rm -rf packer $filename


#Docker Installation
sudo apt-get update -y
sudo apt-get install -y apt-transport-https ca-certificates
#Adding new GPG key
sudo apt-key adv --keyserver hkp://ha.pool.sks-keyservers.net:80 --recv-keys 58118E89F3A912897C070ADBF76221572C52609D
#To check for the release ubuntu release number
lsbno=`lsb_release -rs`
case ""$lsbno"" in
   "12.04") download="deb https://apt.dockerproject.org/repo ubuntu-precise main"
   ;;
   "14.04") download="deb https://apt.dockerproject.org/repo ubuntu-trusty main"
   ;;
   "15.10") download="deb https://apt.dockerproject.org/repo ubuntu-wily main"
   ;;
   "16.04") download="deb https://apt.dockerproject.org/repo ubuntu-wily main"
   ;;
esac
echo $download | sudo tee /etc/apt/sources.list.d/docker.list
sudo apt-get update -y
sudo apt-get install -y linux-image-generic-lts-trusty
sudo apt-get install -y docker-engine

# To login to docker account
sudo docker login --username="$2" --password="$3" --email="$4"


# Cloning of the Repo
# Change of directory
sudo cd /opt/
# Installing git
sudo apt-get install -y git
# Doing a git clone of the catalyst packing repository
git clone https://catalyst-engg:catalyst_123@github.com/RLIndia/catalystpackaging.git
# Changing into the AWS AMI folder
cd catalystpackaging/DockerRLCatalyst
# Replacing to lastest release 
sed -i -e "s/3.4.0/$rlno/g" rlcatalyst.sh
# Replacing the tag Name 
sed -i -e "s/3.4.2/$rlno/g" rlcatalyst.json


# Running Packer 
# To build docker image using packer
sudo packer build rlcatalyst.json

# To upload image
sudo docker push relevancelab/rlcatalyst:$rlno


