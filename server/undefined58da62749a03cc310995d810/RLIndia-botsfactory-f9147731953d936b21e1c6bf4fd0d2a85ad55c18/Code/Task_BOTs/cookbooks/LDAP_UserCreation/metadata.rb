name             'opendj_user_creation'
maintainer       'YOUR_COMPANY_NAME'
maintainer_email 'YOUR_EMAIL'
license          'All rights reserved'
description      'Installs/Configures opendj_user_creation'
long_description IO.read(File.join(File.dirname(__FILE__), 'README.md'))
version          '0.1.0'

attribute 'opendj_user_creation/firstname',
  :display_name => 'First Name',
  :description => 'First Name for OpenDJ'

attribute 'opendj_user_creation/lastname',
  :display_name => 'Last Name',
  :description => 'Last Name for OpenDJ'

attribute 'opendj_user_creation/domain',
  :display_name => 'Domain Name',
  :description => 'Domain Name in OpenDJ',
  :default => 'RLIndia'

attribute 'opendj_user_creation/group',
  :display_name => 'Group Name',
  :description => 'Specific the Group to add in OpenDJ',
  :default => 'people'

attribute 'opendj_user_creation/password',
  :display_name => 'New Passsword',
  :description => 'Passsword for the user',
  :default => 'password'

attribute 'opendj_user_creation/emailid',
  :display_name => 'Email ID',
  :description => 'Email ID for the user'

attribute 'opendj_user_creation/port',
  :display_name => 'Port Number',
  :description => 'Port Number of OpenDJ',
  :default => '389'

attribute 'opendj_user_creation/loginName',
  :display_name => 'Login Name',
  :description => 'Login Name for OpenDJ',
  :default => 'Directory Manager'

attribute 'opendj_user_creation/loginPassword',
  :display_name => 'Login Passsword',
  :description => 'Login Passsword for OpenDJ',
  :default => 'kaushik'

