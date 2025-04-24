# Use Node.js as base image
FROM node:18-slim

# Install nmap
RUN apt-get update && \
    apt-get install -y nmap && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Install app dependencies
COPY package*.json ./
RUN npm install

# Bundle app source
COPY . .

# Create public directory
RUN mkdir -p public

# Copy the HTML file
COPY public/index.html public/

# Expose port
EXPOSE 3000

# Set non-root user for better security
RUN groupadd -r nmapuser && useradd -r -g nmapuser nmapuser
# Give permissions to run nmap
RUN chmod +s /usr/bin/nmap
# Set user
USER nmapuser

# Start the application
CMD ["npm", "start"]