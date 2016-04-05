#
# Cookbook Name:: puppet_configure
# Recipe:: default
#
# Copyright 2015, Relevance Lab INC
#
# All rights reserved - Do Not Redistribute
#

default['puppet_configure']['user'] = "root"
default['puppet_configure']['group'] = "root"
default['puppet_configure']['cache_dir'] = "/var/chef/cache"
default['puppet_configure']['packages'] = ["unzip", "wget", "sshpass"]
default['puppet_configure']['ssh_rpm'] = "http://pkgs.repoforge.org/sshpass/sshpass-1.05-1.el6.rf.x86_64.rpm"

# Puppet Client Info
default['puppet_configure']['client']['user'] = "vagrant"
default['puppet_configure']['client']['pswd'] = "vagrant"
default['puppet_configure']['client']['ipaddress'] = "172.28.128.5"
default['puppet_configure']['client']['fqdn'] = "puppetclient-us-east-1.ec2.internal"
default['puppet_configure']['client']['ssh_pass_method'] = true
default['puppet_configure']['client']['pem_file'] = ""
default['puppet_configure']['client']['environment'] = "production"

# Puppet Master Info
default['puppet_configure']['puppet_master']['user'] = "vagrant"
default['puppet_configure']['puppet_master']['pswd'] = "vagrant"
default['puppet_configure']['puppet_master']['ipaddress'] = "172.28.128.5"
default['puppet_configure']['puppet_master']['fqdn'] = "puppetmaster-us-east-1.ec2.internal"
default['puppet_configure']['puppet_master']['ssh_pass_method'] = true
default['puppet_configure']['puppet_master']['pem_file'] = ""



# Puppet Repo Info
case node['platform']
	when "redhat", "centos"
		default['puppet_configure']['repo'] = "https://yum.puppetlabs.com/puppetlabs-release-el-#{node['platform_version'].to_i}.noarch.rpm"
	when "ubuntu"
		if node['platform_version'].to_f == 14.10
			default['puppet_configure']['repo'] = "https://apt.puppetlabs.com/puppetlabs-release-utopic.deb"
		elsif node['platform_version'].to_f == 12.04
			default['puppet_configure']['repo'] = "https://apt.puppetlabs.com/puppetlabs-release-precise.deb"
		elsif node['platform_version'].to_f == 14.04
			default['puppet_configure']['repo'] = "https://apt.puppetlabs.com/puppetlabs-release-trusty.deb"
		else
			default['puppet_configure']['repo'] = "https://apt.puppetlabs.com/puppetlabs-release-utopic.deb"
		end
end