# See https://docs.chef.io/config_rb_knife.html for more information on knife configuration options

current_dir = File.dirname(__FILE__)
log_level                :info
log_location             STDOUT
node_name                "pcjoshi9"
client_key               "#{current_dir}/pcjoshi9.pem"
validation_client_name   "cat1-validator"
validation_key           "#{current_dir}/cat1-validator.pem"
chef_server_url          "https://api.opscode.com/organizations/cat1"
cache_type               'BasicFile'
cache_options( :path => "#{ENV['HOME']}/.chef/checksums" )
cookbook_path            ["#{current_dir}/../cookbooks"]
