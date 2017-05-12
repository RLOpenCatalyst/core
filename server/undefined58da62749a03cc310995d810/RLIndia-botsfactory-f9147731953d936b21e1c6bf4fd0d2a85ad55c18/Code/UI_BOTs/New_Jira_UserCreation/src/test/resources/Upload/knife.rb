# See https://docs.chef.io/config_rb_knife.html for more information on knife configuration options

current_dir = File.dirname(__FILE__)
log_level                :info
log_location             STDOUT
node_name                "mycatqa"
client_key               "#{current_dir}/mycatqa.pem"
validation_client_name   "cattest-validator"
validation_key           "#{current_dir}/cattest-validator.pem"
chef_server_url          "https://api.opscode.com/organizations/cattest"
cookbook_path            ["#{current_dir}/../cookbooks"]
