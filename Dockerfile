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

# Create logs directory
RUN mkdir -p logs

# Add startup script for better debugging
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'echo "🚀 Starting AI-Trainer application..."' >> /app/start.sh && \
    echo 'echo "📊 Container Info:"' >> /app/start.sh && \
    echo 'echo "  - Node version: $(node --version)"' >> /app/start.sh && \
    echo 'echo "  - NPM version: $(npm --version)"' >> /app/start.sh && \
    echo 'echo "  - Working directory: $(pwd)"' >> /app/start.sh && \
    echo 'echo "  - Files in directory: $(ls -la)"' >> /app/start.sh && \
    echo 'echo "🔍 Checking if server.js exists..."' >> /app/start.sh && \
    echo 'if [ -f "server.js" ]; then' >> /app/start.sh && \
    echo '  echo "✅ server.js found"' >> /app/start.sh && \
    echo '  echo "🚀 Launching server..."' >> /app/start.sh && \
    echo '  exec node server.js' >> /app/start.sh && \
    echo 'else' >> /app/start.sh && \
    echo '  echo "❌ server.js not found!"' >> /app/start.sh && \
    echo '  ls -la' >> /app/start.sh && \
    echo '  exit 1' >> /app/start.sh && \
    echo 'fi' >> /app/start.sh && \
    chmod +x /app/start.sh

# Expose port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:4000/health || exit 1

# Start the application with debugging
CMD ["/app/start.sh"]
