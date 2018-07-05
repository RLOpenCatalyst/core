FROM node:6.10.2
RUN apt-get update -qq && apt-get install -y build-essential libpq-dev libkrb5-dev make g++ ruby libstdc++6 ruby-all-dev

RUN npm install -g kerberos

##Client
RUN npm install -g grunt-cli
##Its not needed as docker taking its role
##RUN npm install -g npm
##RUN npm install forever --global
RUN gem install sass
RUN curl -L https://www.opscode.com/chef/install.sh |  bash
RUN /opt/chef/embedded/bin/gem install knife-windows

RUN mkdir -p /rlc/client
RUN mkdir -p /rlc/server

## Client
ADD ./client/cat3 /rlc/client/cat3
ADD ./client/htmls /rlc/client/htmls
WORKDIR /rlc/client/cat3
RUN npm install --production
RUN npm run-script build-prod 

## Server
WORKDIR /rlc/server
ADD ./server /rlc/server
RUN node install.js

EXPOSE 3001

## Server App
# CMD forever start app.js
WORKDIR /rlc/server/app
CMD node app.js
