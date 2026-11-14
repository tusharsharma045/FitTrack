FROM node:22-alpine

WORKDIR /app

# Copy package descriptors first for Docker cache optimization
COPY package*.json ./

# Install production dependencies
RUN npm install

# Copy application source files
COPY . .

# Expose web port
EXPOSE 3000

# Start application server
CMD ["node", "server.js"]
