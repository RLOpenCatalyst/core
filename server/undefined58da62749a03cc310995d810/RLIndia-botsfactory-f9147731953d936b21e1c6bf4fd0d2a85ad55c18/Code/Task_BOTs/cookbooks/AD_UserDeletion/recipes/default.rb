#
# Cookbook Name:: ad_user_deletion
# Recipe:: default
#
# Copyright 2016, YOUR_COMPANY_NAME
#
# All rights reserved - Do Not Redistribute
#
name = "#{node[:ad_user_deletion][:name]}"
samName = name[0,2] + "#{node[:ad_user_deletion][:surname]}"

if name.empty? || samName.empty?
    Chef::Log.info("Please provide Name & surname")
else
powershell_script 'password reset' do
  code <<-EOH
	Remove-ADUser -Identity #{samName} -Confirm:$false
  EOH
end
end