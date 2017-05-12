name             'ad_user_deletion'
maintainer       'YOUR_COMPANY_NAME'
maintainer_email 'YOUR_EMAIL'
license          'All rights reserved'
description      'Installs/Configures ad_user_deletion'
long_description IO.read(File.join(File.dirname(__FILE__), 'README.md'))
version          '0.1.0'

attribute 'ad_user_deletion/name',
	display_name: 'First Name',
	description: "User's first name",
	default: nil

attribute 'ad_user_deletion/surname',
	display_name: 'Sur Name',
	description: "User's Sur name",
	default: nil
	