name             'opendj_user_deletion'
maintainer       'YOUR_COMPANY_NAME'
maintainer_email 'YOUR_EMAIL'
license          'All rights reserved'
description      'Installs/Configures opendj_user_deletion'
long_description IO.read(File.join(File.dirname(__FILE__), 'README.md'))
version          '0.1.0'

attribute 'opendj_user_deletion/email_id',
  :display_name => 'Email ID',
  :description => 'Email ID for the user'

attribute 'opendj_user_deletion/username',
  :display_name => 'Login Name',
  :description => 'Login Name for OpenDJ',
  :default => 'Directory Manager'

attribute 'opendj_user_deletion/password',
  :display_name => 'Login Passsword',
  :description => 'Login Passsword for OpenDJ',
  :default => 'kaushik'

attribute 'opendj_user_deletion/baseDN',
  :display_name => 'Domain Name',
  :description => 'Provide the baseDN',
  :default => 'dc=RLIndia,dc=com'

attribute 'opendj_user_deletion/port',
  :display_name => 'Port Number',
  :description => 'Port Number of OpenDJ',
  :default => '389'
