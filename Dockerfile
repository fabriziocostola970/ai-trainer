FROM node:18-slim

# Update system packages to fix vulnerabilities
RUN apt-get update && apt-get upgrade -y && apt-get clean

# Minimal production environment
ENV NODE_ENV=production

WORKDIR /app

COPY package*.json ./

RUN npm install --omit=dev --no-package-lock

COPY . .

EXPOSE 8080

CMD ["node", "server.js"]
