#
# Cookbook Name:: ad_user_creation
# Recipe:: default
#
# Copyright 2016, YOUR_COMPANY_NAME
#
# All rights reserved - Do Not Redistribute
#
puts "Printing out the attributes starts"
puts node[:ad_user_creation][:name]
puts node[:ad_user_creation][:surname]
puts node[:ad_user_creation][:domain_name]
puts node[:ad_user_creation][:password]
puts "Printing out the attributes ends"

name = "#{node[:ad_user_creation][:name]}"
samName = name[0,2] + "#{node[:ad_user_creation][:surname]}"
prinicipalName= samName + "@"+ "#{node[:ad_user_creation][:domain_name]}"

if name.empty? || samName.empty? || prinicipalName.empty? || node[:ad_user_creation][:password].empty?
    #Chef::Application.fatal!("Please Provide the Name, Surname, password & domain name",123)
    Chef::Log.info("Please Provide the Name, Surname, password & domain name")
else
powershell_script 'user' do
  code <<-EOH
  	New-ADUser -UserPrincipalName "#{prinicipalName}" -Name "#{node[:ad_user_creation][:name]}" -GivenName "#{node[:ad_user_creation][:name]}" -Surname "#{node[:ad_user_creation][:surname]}" -SamAccountName "#{samName}" -AccountPassword (ConvertTo-SecureString "#{node[:ad_user_creation][:password]}" -AsPlainText -force) -Enabled $True -PasswordNeverExpires $True -PassThru
  	EOH
end
end