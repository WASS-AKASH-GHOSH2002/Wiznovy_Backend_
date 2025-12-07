FROM node:20

RUN apt-get update -y && \
    apt-get install -y openssh-client rsync
