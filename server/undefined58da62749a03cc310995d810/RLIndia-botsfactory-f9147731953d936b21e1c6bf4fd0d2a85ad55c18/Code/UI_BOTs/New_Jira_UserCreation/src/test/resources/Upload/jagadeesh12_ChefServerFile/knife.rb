# See https://docs.chef.io/config_rb_knife.html for more information on knife configuration options

current_dir = File.dirname(__FILE__)
log_level                :info
log_location             STDOUT
node_name                "jagadeesh12"
client_key               "#{current_dir}/jagadeesh12.pem"
validation_client_name   "jm012-validator"
validation_key           "#{current_dir}/jm012-validator.pem"
chef_server_url          "https://api.opscode.com/organizations/jm012"
cookbook_path            ["#{current_dir}/../cookbooks"]
