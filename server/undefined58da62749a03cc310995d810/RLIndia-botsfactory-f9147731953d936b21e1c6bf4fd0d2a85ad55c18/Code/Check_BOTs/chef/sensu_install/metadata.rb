name             'sensu_install'
maintainer       'YOUR_COMPANY_NAME'
maintainer_email 'YOUR_EMAIL'
license          'All rights reserved'
description      'Installs/Configures sensu-client'
long_description IO.read(File.join(File.dirname(__FILE__), 'README.md'))
version          '0.1.0'

attribute 'sensu_install/rabbitmq_host',
	display_name: 'RabbitMQ host IP Address',
	description: "RabbitMQ host IP Address",
	default: 'sensu.relevancelab.com'

attribute 'sensu_install/rabbitmq_port',
	display_name: 'RabbitMQ Port Number',
	description: "RabbitMQ Port Number",
	default: 5672

attribute 'sensu_install/rabbitmq_username',
	display_name: 'RabbitMQ username',
	description: "RabbitMQ username",
	default: 'sensu'

attribute 'sensu_install/rabbitmq_password',
	display_name: 'RabbitMQ Password',
	description: "RabbitMQ Password",
	default: 'sensu'

attribute 'sensu_install/rabbitmq_vhost',
	display_name: 'RabbitMQ Vhost name',
	description: "RabbitMQ Vhost Name",
	default: '/sensu'

