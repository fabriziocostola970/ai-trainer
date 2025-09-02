FROM node:18-alpine

# Install system dependencies for puppeteer
RUN apk add --no-cache chromium

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

CMD ["npm", "start"]
