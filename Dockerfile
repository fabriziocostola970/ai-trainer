FROM node:18-alpine

# Set environment variables for Puppeteer
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    CHROME_BIN=/usr/bin/chromium \
    NODE_ENV=production

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production

COPY . .

# Expose the port Railway expects
ENV PORT=4000
EXPOSE 4000

CMD ["npm", "start"]