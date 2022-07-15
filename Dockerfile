FROM node:16.13

RUN apt-get update && apt-get upgrade -y \
    && apt-get install -y python3-pip \
    && pip3 install slither-analyzer

RUN ["npm", "install", "-g", "npm@8.4.1"]

RUN mkdir -p /home/node/.vscode-server \
  && chown -R node:node /home/node/.vscode-server

VOLUME /home/node/.vscode-server

WORKDIR /usr/src/app

RUN mkdir -p /usr/src/app/node_modules

COPY . .
RUN chown node:node /usr/src/app

VOLUME /usr/src/app/node_modules

RUN ["npm", "install"]

EXPOSE 8546

USER node
