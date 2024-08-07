# Use the official Node.js 16 image as a parent image
FROM node:latest

# Install ping
RUN apt-get update && apt-get install -y iputils-ping && apt-get install -y nano

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of your application's code
COPY . .

# Expose the port the app runs on
EXPOSE 8080

# Command to run your app
CMD ["npm", "run", "dev"]
