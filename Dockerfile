# This file will define the Docker instructions 
# necessary for Docker Engine to build an image of the service

FROM node:20.10.0 

LABEL maintainer="Furqan Khurrum <furqan.khurrum99@gmail.com>"
LABEL description="Fragments node.js microservice"

# We default to use port 3000 in our service
ENV PORT=3000

# Reduce npm spam when installing within Docker
# https://docs.npmjs.com/cli/v8/using-npm/config#loglevel
ENV NPM_CONFIG_LOGLEVEL=warn

# Disable colour when run inside Docker
# https://docs.npmjs.com/cli/v8/using-npm/config#color
ENV NPM_CONFIG_COLOR=false

# Use /app as our working directory
WORKDIR /app

# Step 2: Copy package.json and package-lock.json
COPY package.json package-lock.json ./

# Step 3: Install dependencies
RUN npm install

# Copy src to /app/src/
COPY ./src ./src

# Copy our HTPASSWD file
COPY ./tests/.htpasswd ./tests/.htpasswd

# Start the container by running our server
CMD npm start
