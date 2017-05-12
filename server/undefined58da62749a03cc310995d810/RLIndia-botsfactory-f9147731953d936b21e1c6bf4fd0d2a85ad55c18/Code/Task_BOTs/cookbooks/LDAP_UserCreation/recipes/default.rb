#
# Cookbook Name:: opendj_user_creation
# Recipe:: default
#
# Copyright 2016, YOUR_COMPANY_NAME
#
# All rights reserved - Do Not Redistribute
#
uname = 0
if node[:opendj_user_creation][:firstname].length > 3
	if node[:opendj_user_creation][:lastname].length > 3
		uname =  node[:opendj_user_creation][:firstname][0,3] + node[:opendj_user_creation][:lastname][0,3]
	else
		uname = node[:opendj_user_creation][:firstname][0,3] + node[:opendj_user_creation][:lastname]
	end
else
	if node[:opendj_user_creation][:lastname].length > 3
		uname = node[:opendj_user_creation][:firstname] + node[:opendj_user_creation][:lastname][0,3]
	else
		uname = node[:opendj_user_creation][:firstname] + node[:opendj_user_creation][:lastname]
	end
end

 # id = uname+'@'+node[:opendj_user_creation][:domain]+'.com'

template '/tmp/new.ldif' do
  source 'new.erb'
  mode '0777'
  variables(:firstname => node[:opendj_user_creation][:firstname], :lastname => node[:opendj_user_creation][:lastname], :group => node[:opendj_user_creation][:group], :domain => node[:opendj_user_creation][:domain],:password => node[:opendj_user_creation][:password], :unqiname => uname, :emailid => node[:opendj_user_creation][:emailid])
  #notifies :run, 'execute[slapadd]', :immediately
end

# execute 'slapadd' do
#   command " /tmp/run.log < /opt/opendj/bin/ldapmodify --hostname kaushik.com --port #{node[:opendj_user_creation][:port]} --bindDN 'cn=#{node[:opendj_user_creation][:loginName]}'  -w #{node[:opendj_user_creation][:loginPassword]} --defaultAdd --filename /tmp/new.ldif"
# end

ruby_block 'reload_client_config' do
  block do
   `/opt/opendj/bin/ldapmodify --port #{node[:opendj_user_creation][:port]} --bindDN 'cn=#{node[:opendj_user_creation][:loginName]}'  -w #{node[:opendj_user_creation][:loginPassword]} -f /tmp/new.ldif`
  end
  action :run
end