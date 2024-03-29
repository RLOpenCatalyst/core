FROM node:16.8.0
RUN apt-get update -qq && apt-get install -y build-essential libpq-dev libkrb5-dev make g++ ruby libstdc++6 ruby-all-dev

RUN npm install --unsafe-perm -g kerberos

##Client
RUN npm install --unsafe-perm -g grunt-cli@1.2.0
##Its not needed as docker taking its role
##RUN npm install -g npm
##RUN npm install forever --global
RUN gem install sass
RUN curl -L https://www.opscode.com/chef/install.sh |  bash -s -- -v 14.1.12	
RUN /opt/chef/embedded/bin/gem install knife-windows -v 1.5.0

RUN mkdir -p /rlc/client
RUN mkdir -p /rlc/server
RUN mkdir /mongdb

## Client
ADD ./client/cat3 /rlc/client/cat3
ADD ./client/htmls /rlc/client/htmls
WORKDIR /rlc/client/cat3
# RUN npm install --production
RUN npm install --legacy-peer-deps
RUN npm run-script build-prod 

## Server
WORKDIR /rlc/server
ADD ./server /rlc/server
RUN node install.js
RUN node app/bin/postInstallscript.js

EXPOSE 3001

## Server App
# CMD forever start app.js
WORKDIR /rlc/server/app
CMD node app.js

