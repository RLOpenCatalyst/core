#!/bin/bash
#./Cat_User_Creation.sh catalyst_url catalyst_login_user_name catalyst_login_user_pass new_catalyst_user_name_toCreate new_catalyst_user_email_toCreate new_catalyst_user_pass_toCreate new_catalyst_user_role_toCreate Slack_BOT_Name Slack_BOT_icon
#./Cat_User_Creation.sh https://neocatalyst.rlcatalyst.com superadmin superadmin@123 jonny jonny@gmail pass@123 Consumer Alert-BOT :bell:

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

# This to show that bot has started in slack

webhook_url=T0FJN09DZ/B0J0BQN6R/TkffVKJuSkATi7tyiPLLYZFI
channel_name="catalyst_alert"
msg="User Creation BOT for $cat_url has been started for a new user $new_user."

if [ "$8" == "" ]
then
        bot_name='Alert-BOT'
else
        bot_name=$8
fi

if [ "$9" == "" ]
then
        icon=':bell:'
else
        icon=$9
fi
# This Script that post the message in slack
curl -X POST --data-urlencode 'payload={"text": "'"$msg"'", "channel": "#'"$channel_name"'", "username": "'"$bot_name"'", "icon_emoji": "'"$icon"'"}' https://hooks.slack.com/services/$webhook_url

# To get the Catalyst login Auth-Token
token=`curl -i -X POST -H "Content-Type: application/json"  -H "Accept: application/json" $cat_url/auth/signin -d '{"username":"'"$cat_user_name"'","pass":"'"$cat_user_pass"'","authType":"token"}'| grep token | awk -F":" '{print $2}'|sed 's/\}//g'| sed 's/"//g'`

#echo $token

# User creation API
curl -i -X POST -H "Content-Type: application/json"  -H "Accept: application/json" -H "x-catalyst-auth: $token" $cat_url/d4dMasters/savemasterjsonrownew/7/null/all -d '{"loginname":"'"$new_user"'","email":"'"$new_user_email"'","password":"'"$new_user_pass"'","cnfPassword":"'"$new_user_pass"'","userrolename":"'"$new_user_role"'","userrolename_rowid":"'"$new_user_role_id"'","orgname":"","orgname_rowid":"","teamname":"RL_DEV","teamname_rowid":"7df4b243-2902-48db-a118-f07975331c56"}'
# Re-initiliaztion of slack bot
msg="User $new_user is created in $cat_url"

# This the command to post the slack message
curl -X POST --data-urlencode 'payload={"text": "'"$msg"'", "channel": "#'"$channel_name"'", "username": "'"$bot_name"'", "icon_emoji": "'"$icon"'"}' https://hooks.slack.com/services/$webhook_url
