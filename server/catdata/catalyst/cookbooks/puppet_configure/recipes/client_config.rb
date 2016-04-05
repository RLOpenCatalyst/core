#
# Cookbook Name:: puppet_configure
# Recipe:: client_config
#
# Copyright 2015, Relevance Lab INC
#
# All rights reserved - Do Not Redistribute
#

pup_config = node['puppet_configure']

include_recipe "puppet_configure::default"

package 'puppet' do
	action :install
end

hostsfile_entry pup_config['puppet_master']['ipaddress'] do
	hostname lazy { pup_config['puppet_master']['fqdn']}
	unique true
	comment 'Update by puppet_configure cookbook'
	action :append
end

hostsfile_entry node['ipaddress'] do
	hostname lazy { Chef::Config[:node_name]}
	unique true
	comment 'Update by puppet_configure cookbook'
	action :append
end

file "/etc/hostname" do
	owner pup_config['user']
	group pup_config['group']
	mode 00644
	content lazy { Chef::Config[:node_name]}
	action :create
end

execute "Setting hostname" do
	user pup_config['user']
	group pup_config['group']
	command "hostname -F /etc/hostname"
	action :run
end

directory "/etc/puppet" do
 	owner pup_config['user']
 	group pup_config['group']
 	recursive true
 	mode 00755
 	action :create
end

template '/etc/puppet/puppet.conf' do
	cookbook "puppet_configure"
	source 'puppet.conf.erb'
	mode 00755
	variables( lazy {{
		:server_fqdn => pup_config['puppet_master']['fqdn'],
		:client_env => pup_config['client']['environment']
	}})
end

template '/etc/default/puppet' do
	 cookbook "puppet_configure"
 	 source 'puppet.erb'
 	 mode 00755
end

service "puppet" do
	supports :status => true, :restart => true, :reload => true
	action [:start, :enable]
end
