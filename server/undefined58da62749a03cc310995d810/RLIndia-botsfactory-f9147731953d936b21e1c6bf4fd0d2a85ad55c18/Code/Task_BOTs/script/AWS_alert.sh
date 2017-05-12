#! /bin/bash
# AWS_alert.sh AWS_access_key AWS_secret_key email_id
ackey=$1
sckey=$2
mailid=$3

#Installation of AWS CLI
cd /tmp
curl -O https://bootstrap.pypa.io/get-pip.py
sudo python2.7 get-pip.py
sudo pip install awscli
sudo pip install awscli --ignore-installed six
sudo pip install --upgrade awscli
rm -rf get-pip.py

# Adding Creditionals for AWS CLI
mkdir ~/.aws
cd ~/.aws
echo "[default] 
aws_access_key_id=$ackey
aws_secret_access_key=$sckey" >> credentials
echo "[default] 
region=us-west-2 
output=text" >> config

# Adding the Mail Template
echo 'Hi,

PFA is running list of Non-Production instance in AWS Account.

Thanks,
Catalyst Bot' > /tmp/detail.txt

# List of region in AWS Account
region=('ap-south-1' 'eu-west-1' 'ap-northeast-2' 'ap-northeast-1' 'sa-east-1' 'ap-southeast-1' 'ap-southeast-2' 'eu-central-1' 'us-east-1' 'us-east-2' 'us-west-1' 'us-west-2' );

for i in "${region[@]}"
do
  aws ec2 describe-instances --region "$i" --filters "Name=instance-state-name,Values=running" --query 'Reservations[].Instances[].[Tags[?Key==`Environment` && Value!=`Production`].Value,PrivateIpAddress,InstanceId,Placement.AvailabilityZone]' --output text >> /tmp/instance.xlsx | sed -i '/Non-Production/d' /tmp/instance.xlsx | sed -i '/QA/d' /tmp/instance.xlsx
done

# Installation of ssmtp server
sudo apt-get update
sudo apt-get install ssmtp


# ssmtp template folder
sudo echo '# Config file for sSMTP sendmail

# The person who gets all mail for userids < 1000
# Make this empty to disable rewriting.
#root=postmaster
root=catalystservicebot@gmail.com

# The place where the mail goes. The actual machine name is required no
# MX records are consulted. Commonly mailhosts are named mail.domain.com
#mailhub=mail
mailhub=smtp.gmail.com:587

AuthUser=catalystservicebot@gmail.com
AuthPass=catalyst@1234
UseTLS=YES
UseSTARTTLS=YES

# Where will the mail seem to come from?
#rewriteDomain=
rewriteDomain=gmail.com

# The full hostname
#hostname=MyMediaServer.home
hostname=localhost

# Are users allowed to set their own From: address?
# YES - Allow the user to specify their own From: address
# NO - Use the system generated From: address
FromLineOverride=YES' > /etc/ssmtp/ssmtp.conf

sudo echo 'root:catalystservicebot@gmail.com:smtp.gmail.com:587' >> /etc/ssmtp/revaliases
sudo apt-get install mpack

# Sending of the email
mpack -s 'Active list of Non-Production instances' /tmp/instance.xlsx -d /tmp/detail.txt $mailid

# Deletion of the xlsx file
rm -rf /tmp/instance.xlsx
