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

# Expose port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:4000/health || exit 1

# Start the application
CMD ["npm", "start"]
