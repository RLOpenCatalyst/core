#
# Cookbook Name:: puppet_configure
# Recipe:: default
#
# Copyright 2015, Relevance Lab INC
#
# All rights reserved - Do Not Redistribute
#

case node['os']
	when "linux"
		case node['platform']
			when "redhat", "centos"
				include_recipe "puppet_configure::rhel"
			when "ubuntu"
				include_recipe "puppet_configure::debian"
			else
				Chef::Log.info("Sorry, There is no recipe for #{node['platform']} yet!!!")
		end
         	else
                Chef::Log.info("Sorry, There is no recipe for #{node['os']} yet!!!")
end