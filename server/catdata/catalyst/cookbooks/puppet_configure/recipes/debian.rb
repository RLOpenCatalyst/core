#
# Cookbook Name:: puppet_configure
# Recipe:: debian
#
# Copyright 2015, Relevance Lab INC
#
# All rights reserved - Do Not Redistribute
#

pup_config = node['puppet_configure']
pup_repo_deb = File.basename(pup_config['repo'])

directory pup_config['cache_dir'] do
	owner pup_config['user']
	group pup_config['group']
	recursive true
	mode 00755
	action :create
end

remote_file "#{pup_config['cache_dir']}/#{pup_repo_deb}" do
	user pup_config['user']
	group pup_config['group']
	source pup_config['repo']
	not_if { File.size? ("#{pup_config['cache_dir']}/#{pup_repo_deb}") }
end

dpkg_package "Puppet Repo Install" do
	source "#{pup_config['cache_dir']}/#{pup_repo_deb}"
	action :install
end

include_recipe "apt"