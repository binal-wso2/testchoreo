# Use Node.js as base image
FROM node:18-slim

# Install nmap and sudo
RUN apt-get update && \
    apt-get install -y nmap sudo && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Install app dependencies
COPY package*.json ./
RUN npm install

# Bundle app source
COPY . .

# Create public directory if it doesn't exist
RUN mkdir -p public

# Copy the HTML file
COPY public/index.html public/

# Expose port
EXPOSE 3000

# This is required by Choreo to run the container as a non-root user.
RUN adduser \
    --disabled-password \
    --gecos "" \
    --home "/nonexistent" \
    --shell "/sbin/nologin" \
    --no-create-home \
    --uid 10014 \
    "choreo"

# Use the above created unprivileged user
USER 10014

# Modify app.js to use sudo with nmap
RUN sed -i 's|const command = `nmap -sS -p 22 ${ipAddress}`;|const command = `sudo nmap -sS -p 22 ${ipAddress}`;|g' app.js

# Set up sudo without password for nmap
RUN echo "ALL ALL=(ALL) NOPASSWD: /usr/bin/nmap" >> /etc/sudoers.d/nmap && \
    chmod 0440 /etc/sudoers.d/nmap

# Start the application
CMD ["npm", "start"]