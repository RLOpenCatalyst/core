#!/bin/bash
#./Cat_User_Creation.sh catalyst_url catalyst_login_user_name catalyst_login_user_pass new_catalyst_user_name_toCreate new_catalyst_user_email_toCreate new_catalyst_user_pass_toCreate new_catalyst_user_role_toCreate
#./Cat_User_Creation.sh https://neocatalyst.rlcatalyst.com superadmin superadmin@123 jonny jonny@gmail pass@123 Consumer

# Catalyst Initializations
cat_url=$1
cat_user_name=$2
cat_user_pass=$3

#echo $cat_url
#echo $cat_user_name
#echo $cat_user_pass

# New Catalyst User Initializations
new_user=$4
new_user_email=$5
new_user_pass=$6
new_user_role=$7

# Case condition to get role_id
case "$new_user_role" in
  "Admin") new_user_role_id="61"
  ;;
  "Designer") new_user_role_id="62"
  ;;
  "Consumer") new_user_role_id="63"
  ;;
esac
    
# To get the Catalyst login Auth-Token
token=`curl -i -X POST -H "Content-Type: application/json"  -H "Accept: application/json" $cat_url/auth/signin -d '{"username":"'"$cat_user_name"'","pass":"'"$cat_user_pass"'","authType":"token"}'| grep token | awk -F":" '{print $2}'|sed 's/\}//g'| sed 's/"//g'`

#echo $token

# User creation API
curl -i -X POST -H "Content-Type: application/json"  -H "Accept: application/json" -H "x-catalyst-auth: $token" $cat_url/d4dMasters/savemasterjsonrownew/7/null/all -d '{"loginname":"'"$new_user"'","email":"'"$new_user_email"'","password":"'"$new_user_pass"'","cnfPassword":"'"$new_user_pass"'","userrolename":"'"$new_user_role"'","userrolename_rowid":"'"$new_user_role_id"'","orgname":"","orgname_rowid":"","teamname":"RL_DEV","teamname_rowid":"7df4b243-2902-48db-a118-f07975331c56"}'
