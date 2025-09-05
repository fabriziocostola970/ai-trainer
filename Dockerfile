FROM node:18-slim

# Minimal production environment
ENV NODE_ENV=production

WORKDIR /app

COPY package*.json ./

RUN npm install --omit=dev --no-package-lock

COPY . .

CMD ["node", "server.js"]
