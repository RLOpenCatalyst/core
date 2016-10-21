FROM node:4.6.0
RUN apt-get update -qq && apt-get install -y build-essential libpq-dev libkrb5-dev make g++ ruby libstdc++6

RUN npm install -g kerberos

##Client
RUN npm install -g grunt-cli
RUN npm install -g npm
RUN npm install forever --global
RUN gem install sass
RUN curl -L https://www.opscode.com/chef/install.sh |  bash

RUN mkdir -p /rlc/client
RUN mkdir -p /rlc/server

## Client
ADD ./client/cat3 /rlc/client/cat3
ADD ./client/htmls /rlc/client/htmls
WORKDIR /rlc/client/cat3
RUN npm install --production
RUN npm run-script build-prod 

WORKDIR /rlc/server


## Server
ADD ./server /rlc/server
RUN npm install

##messy solution to avoid cross-device link not permitted err
##must find better way
RUN rm -rf /rlc/server/node_modules/farmhash
RUN npm install farmhash

EXPOSE 3001

## Server App
# CMD forever start app.js
WORKDIR /rlc/server/app
CMD node app.js
