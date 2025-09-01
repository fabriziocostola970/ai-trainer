# Use Node.js 18 Alpine for smaller image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Clean install without cache
RUN rm -rf node_modules package-lock.json .npm && \
    npm install --production --no-audit --no-fund --no-cache --no-optional --no-package-lock --no-save

# Copy application code
COPY . .

# Create a simple startup script
RUN echo '#!/bin/sh' > /start.sh && \
    echo 'set -e' >> /start.sh && \
    echo 'echo "=== AI-TRAINER STARTUP ==="' >> /start.sh && \
    echo 'echo "Node version: $(node --version)"' >> /start.sh && \
    echo 'echo "Working directory: $(pwd)"' >> /start.sh && \
    echo 'echo "Files in directory:"' >> /start.sh && \
    echo 'ls -la' >> /start.sh && \
    echo 'echo "=== CHECKING SERVER.JS ==="' >> /start.sh && \
    echo 'if [ ! -f "server.js" ]; then' >> /start.sh && \
    echo '  echo "ERROR: server.js not found!"' >> /start.sh && \
    echo '  exit 1' >> /start.sh && \
    echo 'fi' >> /start.sh && \
    echo 'echo "server.js found, starting application..."' >> /start.sh && \
    echo 'echo "=== STARTING NODE APPLICATION ==="' >> /start.sh && \
    echo 'exec node server.js' >> /start.sh && \
    chmod +x /start.sh

# Expose port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:4000/health || exit 1

# Start with the simple script
CMD ["sh", "-c", "echo '🚀 DIRECT STARTUP - AI-TRAINER 🚀' && echo 'Node: $(node --version)' && echo 'NPM: $(npm --version)' && echo 'PWD: $(pwd)' && ls -la server.js && echo '🎯 EXECUTING: node server.js' && node server.js"]or smaller image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Clean install without cache
RUN rm -rf node_modules package-lock.json .npm && \
    npm install --production --no-audit --no-fund --no-cache --no-optional --no-package-lock --no-save

# Copy application code
COPY . .

# Expose port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:4000/health || exit 1

# Start the application with maximum logging
CMD ["sh", "-c", "echo '� Starting AI-Trainer...' && echo '📊 Node version:' $(node --version) && echo '📊 NPM version:' $(npm --version) && echo '📊 Working dir:' $(pwd) && echo '📊 Files:' && ls -la && echo '🔍 Checking server.js...' && if [ -f server.js ]; then echo '✅ server.js found' && echo '🚀 Executing: node server.js' && exec node server.js; else echo '❌ server.js NOT found!' && echo '📁 Directory contents:' && ls -la && exit 1; fi"]
