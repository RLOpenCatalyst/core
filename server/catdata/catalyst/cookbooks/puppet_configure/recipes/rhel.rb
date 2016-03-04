#
# Cookbook Name:: puppet_configure
# Recipe:: rhel
#
# Copyright 2015, Relevance Lab INC
#
# All rights reserved - Do Not Redistribute
#

pup_config = node['puppet_configure']
ssh_rpm = File.basename(pup_config['ssh_rpm'])
pup_repo_rpm = File.basename(pup_config['repo'])

directory pup_config['cache_dir'] do
	owner pup_config['user']
	group pup_config['group']
	recursive true
	mode 00755
	action :create
end

remote_file "#{pup_config['cache_dir']}/#{ssh_rpm}" do
	user pup_config['user']
	group pup_config['group']
	source pup_config['ssh_rpm']
	not_if { File.size? ("#{pup_config['cache_dir']}/#{ssh_rpm}") }
end

rpm_package "SSHPASS installation" do
	source "#{pup_config['cache_dir']}/#{ssh_rpm}"
	action :install
end

remote_file "#{pup_config['cache_dir']}/#{pup_repo_rpm}" do
	user pup_config['user']
	group pup_config['group']
	source pup_config['repo']
	not_if { File.size? ("#{pup_config['cache_dir']}/#{pup_repo_rpm}") }
end

rpm_package "Puppet Repo Install" do
	source "#{pup_config['cache_dir']}/#{pup_repo_rpm}"
	action :install
end