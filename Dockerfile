# In your Dockerfile.
FROM node:7.8.0
# The base node image sets a very verbose log level.
ENV NPM_CONFIG_LOGLEVEL warn
# Skip proxy
RUN npm config set strict-ssl false
# In your Dockerfile.
RUN npm install -D serve
# Run serve when the image is run.
CMD serve -s build
# Install all dependency
COPY package.json package.json
RUN npm install
# Let Docker know about the port that serve runs on.
EXPOSE 5000
# In your Dockerfile.
COPY . .
# In your Dockerfile.
RUN npm run build --production
# start app
CMD ["npm", "start"]