#! /bin/bash

cd /tmp
curl -O https://bootstrap.pypa.io/get-pip.py
sudo python2.7 get-pip.py
sudo pip install awscli
sudo pip install awscli --ignore-installed six
sudo pip install --upgrade awscli
