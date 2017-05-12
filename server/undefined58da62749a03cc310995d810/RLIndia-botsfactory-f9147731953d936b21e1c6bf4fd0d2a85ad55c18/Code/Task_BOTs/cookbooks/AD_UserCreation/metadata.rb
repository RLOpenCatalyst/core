name             'ad_user_creation'
maintainer       'YOUR_COMPANY_NAME'
maintainer_email 'YOUR_EMAIL'
license          'All rights reserved'
description      'Installs/Configures ad_user_creation'
long_description IO.read(File.join(File.dirname(__FILE__), 'README.md'))
version          '0.1.0'

attribute 'ad_user_creation/name',
	display_name: 'First Name',
	description: "User's first name",
	default: nil

attribute 'ad_user_creation/surname',
	display_name: 'Sur Name',
	description: "User's first name",
	default: nil

attribute 'ad_user_creation/password',
	display_name: 'User Password',
	description: "Password which required one special character and one number",
	default: nil

attribute 'ad_user_creation/domain_name',
	display_name: 'Domain Name',
	description: "Domain Name",
	default: nil