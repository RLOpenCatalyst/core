#
# Cookbook Name:: opendj_user_deletion
# Recipe:: default
#
# Copyright 2016, YOUR_COMPANY_NAME
#
# All rights reserved - Do Not Redistribute
#
details = `/opt/opendj/bin/ldapsearch --port "#{node[:opendj_user_deletion][:port]}" --baseDN "#{node[:opendj_user_deletion][:baseDN]}" "(mail="#{node[:opendj_user_deletion][:email_id]}")"`

puts details
puts details.class

authID = details.split("\n")
uid = authID[0].split(":")
puts authID[0]
puts uid[1]

# puts "`/opt/opendj/bin/ldappasswordmodify --authzID '\"#{authID[0]}\"' --newPassword '#{node[:opendj_user_deletion][:newpassword]}' --port \"#{node[:opendj_user_deletion][:port]}\" --bindDN \"cn=\"#{node[:opendj_user_deletion][:username]}\"\" --bindPassword \"#{node[:opendj_user_deletion][:password]}\"`"

logs=`/opt/opendj/bin/ldapdelete --port "#{node[:opendj_user_deletion][:port]}" --bindDN 'cn=#{node[:opendj_user_deletion][:username]}' --bindPassword "#{node[:opendj_user_deletion][:password]}" --noPropertiesFile '#{uid[1]}'`

puts logs
