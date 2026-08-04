# Use lightweight Node 20 base image
FROM node:20-alpine

# Set working directory inside container
WORKDIR /usr/src/app

# Copy package configuration files
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy application source code
COPY . .

# Expose backend port
EXPOSE 5002

# Command to start the server
CMD ["node", "server.js"]
