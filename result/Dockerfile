FROM node:18-slim

# add curl for healthcheck
RUN apt-get update && \
    apt-get install -y --no-install-recommends curl tini && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /usr/local/app

# have nodemon available for local dev use (file watching)
RUN npm install -g nodemon
RUN npm install dotenv --save
RUN npm install

COPY package*.json ./

RUN npm ci && \
 npm cache clean --force && \
 mv /usr/local/app/node_modules /node_modules

COPY . .

ENV PORT 80
EXPOSE 80

# Load environment variables from .env file
ENV ENV_FILE_PATH .env
ENV $(cat $ENV_FILE_PATH | xargs)

ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "server.js"]
