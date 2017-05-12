#
# Cookbook Name:: sensu-client
# Recipe:: default
#
# Copyright 2015, Relevance labe
# Written by Manjunath contact support@Relevancelab.com
#
# All rights reserved - Do Not Redistribute
#

ruby_block 'instance-details' do
	block do
		node.default['sensu_install']['instance-id'] = %x[curl http://169.254.169.254/latest/meta-data/instance-id]
		node.default['sensu_install']['rabbitmq_host'] = %x[curl http://169.254.169.254/latest/meta-data/local-ipv4]
	end
end

case node['platform']

   when 'debian', 'ubuntu'

      remote_file '/tmp/sensu_pubkey.gpg' do
        source 'http://repos.sensuapp.org/apt/pubkey.gpg'
        action :create
        notifies :run, 'execute[add_sensu_gpg]', :immediately
      end


	    execute "add_sensu_gpg"  do
	       command 'cat /tmp/sensu_pubkey.gpg | apt-key add -'
	       user "root"
	       action :nothing
	    end

     execute "add_repo" do
		      command 'echo "deb     http://repos.sensuapp.org/apt sensu main" > /etc/apt/sources.list.d/sensu.list'
		      not_if do ::File.exists?('/etc/apt/sources.list.d/sensu.list') end
		      notifies :run, 'execute[repo_update]', :immediately
	   end

     execute "repo_update" do
	      command 'apt-get update'
	       action :nothing
     end

   when 'redhat', 'centos', 'fedora'
	    file '/etc/yum.repos.d/sensu.repo' do
		      content '[sensu]
name=sensu-main
baseurl=http://repos.sensuapp.org/yum/el/$releasever/$basearch/
gpgcheck=0
enabled=1
'
             action :create
             notifies :run, 'execute[yum_update]', :immediately
   end

    execute "yum_update" do
		    command "yum update"
		      action :nothing
	  end
end


package "Install Sensu client" do
 package_name 'sensu'
end

template '/etc/sensu/conf.d/rabbitmq.json' do
 source 'config.json.erb'
 mode '0755'
 variables(
	:rabbitmq_host => node['sensu_install']['rabbitmq_host'],
	:rabbitmq_port => node['sensu_install']['rabbitmq_port'],
	:rabbitmq_user => node['sensu_install']['rabbitmq_username'],
	:rabbitmq_password => node['sensu_install']['rabbitmq_password'],
	:rabbitmq_vhost => node['sensu_install']['rabbitmq_vhostname']
 )
end

template '/etc/sensu/conf.d/client.json' do
	source 'client.json.erb'
    mode '0755'
	variables(
		lazy{
			{:node_name => "#{node['fqdn']}",
				:node_ip => "#{node['ipaddress']}",
				:sensu_id => "#{node['sensu_install']['instance-id']}"}
		}
	)
  notifies :restart, 'service[sensu-client]', :immediately
end

service 'sensu-client' do
	action :nothing
	supports :status => true, :start => true, :stop => true, :restart => true
end
