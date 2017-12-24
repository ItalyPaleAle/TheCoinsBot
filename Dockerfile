# Using Node.js 8 LTS
FROM node:8-alpine

# Install git, required by some packages
RUN apk --no-cache add git

# Set workdir
WORKDIR /usr/src/app

# First, copy package.json and package-lock.json to run "npm install"
COPY ["package.json", "package-lock.json", "./"]
RUN npm install --production

# Copy the app
COPY . .

# Start the app
ENV NODE_ENV production
CMD npm run production
VOLUME /var/log/
EXPOSE 3000
