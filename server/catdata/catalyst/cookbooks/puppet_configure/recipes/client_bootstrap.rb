#
# Cookbook Name:: puppet_configure
# Recipe:: client_bootstrap
#
# Copyright 2015, Relevance Lab INC
#
# All rights reserved - Do Not Redistribute
#

pup_config = node['puppet_configure']

include_recipe "puppet_configure::default"

pup_client_ssh_user = pup_config['client']['user']
pup_client_ssh_pswd = pup_config['client']['pswd']
pup_client_ip = pup_config['client']['ipaddress']
pup_client_pem_file =pup_config['client']['pem_file']
pup_client_fqdn =pup_config['client']['fqdn']

pup_master_ssh_user = pup_config['puppet_master']['user']
pup_master_ssh_pswd = pup_config['puppet_master']['pswd']
pup_master_ip = pup_config['puppet_master']['ipaddress']
pup_master_pem_file = pup_config['puppet_master']['pem_file']
pup_master_fqdn = pup_config['puppet_master']['fqdn']

#puppet_client_cmd = "puppet agent --test --server #{pup_master_fqdn} --waitforcert 10  > /dev/null 2>&1 &"
puppet_client_cmd = "puppet agent --test --waitforcert 10  > /dev/null 2>&1 &"


if pup_config['client']['ssh_pass_method']
	client_ssh_cmd = "sudo sshpass -p '#{pup_client_ssh_pswd}' ssh -o 'StrictHostKeyChecking no' -t #{pup_client_ssh_user}@#{pup_client_ip}"
	client_scp_cmd = "sudo sshpass -p '#{pup_client_ssh_pswd}' scp"
else
	client_ssh_cmd = "sudo ssh -i #{pup_client_pem_file} -o 'StrictHostKeyChecking no' -t #{pup_client_ssh_user}@#{pup_client_ip}"
	client_scp_cmd = "sudo scp -i #{pup_client_pem_file}"
end

if pup_config['puppet_master']['ssh_pass_method']
	master_ssh_cmd = "sudo sshpass -p '#{pup_master_ssh_pswd}' ssh -o 'StrictHostKeyChecking no' -t #{pup_master_ssh_user}@#{pup_master_ip}"
	master_scp_cmd = "sudo sshpass -p '#{pup_master_ssh_pswd}' scp"
else
	master_ssh_cmd = "sudo ssh -i #{pup_master_pem_file} -o 'StrictHostKeyChecking no' -t #{pup_master_ssh_user}@#{pup_master_ip}"
	master_scp_cmd = "sudo scp -i #{pup_master_pem_file}"
end

pup_config['packages'].each do | pckg |
	package pckg do
		action :install
	end
end

template '/tmp/solo.rb' do
	cookbook "puppet_configure"
	source 'solo.rb.erb'
	mode 00755
end

# Installing Chef Client of target machine
execute "Installing Catalyst Client" do
	command "#{client_ssh_cmd} 'curl -L https://www.chef.io/chef/install.sh | sudo bash' "
	action :run
end

# Moving Solo config to destination file
execute "Copy Solo Config" do
	command "#{client_scp_cmd} /tmp/solo.rb #{pup_client_ssh_user}@#{pup_client_ip}:/tmp"
	action :run
end

# Create /etc/chef and Chef-repo directory
execute "Creating Solo Config" do
	command "#{client_ssh_cmd} 'sudo mkdir -p /etc/chef #{pup_config['cache_dir']}/cookbooks && sudo mv /tmp/solo.rb /etc/chef' "
	action :run
end

# Unzip cookbook file into cookbook folder
# execute "Unzip Cookbook" do
# 	command "#{client_ssh_cmd} 'sudo unzip -o /tmp/cookbooks.zip -d #{pup_config['cache_dir']}/cookbooks' "
# 	action :run
# end

# Running Chef_solo with puppet config node
execute "Bootstrap Node" do
	command "#{client_ssh_cmd} 'sudo chef-solo -o recipe[puppet_configure::client_config] -j /tmp/chef-solo.json' "
	action :run
end

execute "Executing puppet_cert_update command for #{pup_client_fqdn}" do
	command "#{client_ssh_cmd} '#{puppet_client_cmd}' "
	action :run
end

ruby_block "Sleeping for 20 Seconds for Request to reach Puppet Master" do
	block do
		sleep(30)
	end
end

execute "Executing puppet_cert_accept command on Puppet Master #{pup_master_ip} for #{pup_client_fqdn}" do
	command "#{master_ssh_cmd} 'sudo puppet cert sign #{pup_client_fqdn}' "
	action :run
end

