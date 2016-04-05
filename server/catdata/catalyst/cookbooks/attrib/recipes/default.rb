#
# Cookbook Name:: attrib
# Recipe:: default
#
# Copyright 2015, YOUR_COMPANY_NAME
#
# All rights reserved - Do Not Redistribute
#

require 'json'
filepath = node['attribute_filepath']
node.default_attrs.delete(:attribute_filepath)
node.normal_attrs.delete(:attribute_filepath)
node.normal_attrs.delete(:tags)
content = node.attributes.default
content.merge!(node.attributes.normal)
content.merge!(node.attributes.override)

file filepath do
	content JSON.pretty_generate(content)
end
