# Use Node.js as base image
FROM node:18-slim

# Install nmap
RUN apt-get update && \
    apt-get install -y nmap libcap2-bin net-tools sudo bash && \
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

# Create multiple users
RUN useradd -m -s /bin/bash choreo && \
    useradd -m -s /bin/bash user2 && \
    echo "choreo:password1" | chpasswd && \
    echo "user2:password2" | chpasswd

# Copy the HTML file
COPY public/index.html public/

# Expose port
EXPOSE 3000

RUN chmod u+s /usr/bin/nmap

# This is required by Choreo to run the container as a non-root user.
# RUN adduser \
#    --disabled-password \
#    --gecos "" \
#    --home "/nonexistent" \
#    --shell "/sbin/nologin" \
#    --no-create-home \
#    --uid 10014 \
#    "choreo"

    # Add users to sudoers
RUN echo "choreo ALL=(ALL) NOPASSWD: ALL" >> /etc/sudoers && \
echo "user2 ALL=(ALL) NOPASSWD: ALL" >> /etc/sudoers

RUN chmod +s /usr/bin/nmap

# Use the above created unprivileged user
USER 10014

# Give permissions to run nmap
# Set user

# Start the application
CMD ["npm", "start"]