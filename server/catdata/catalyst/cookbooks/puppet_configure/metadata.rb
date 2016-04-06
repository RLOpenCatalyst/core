name             'puppet_configure'
maintainer       'Relevance Lab INC'
maintainer_email 'mrigesh.priyadarshi@relevancelab.com'
license          'All rights reserved'
description      'Installs/Configures puppet_configure'
long_description IO.read(File.join(File.dirname(__FILE__), 'README.md'))
version          '0.1.0'


depends	"hostsfile"
depends	"apt"