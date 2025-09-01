# Minimal test Dockerfile
FROM node:18-alpine

# Test if Node.js works at all
CMD ["sh", "-c", "echo '🧪 MINIMAL TEST STARTED' && node --version && echo '✅ Node.js working' && npm --version && echo '✅ NPM working' && echo '📁 Current dir:' && pwd && echo '📋 Files:' && ls -la && echo '🎯 Test completed successfully'"]or smaller image
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
