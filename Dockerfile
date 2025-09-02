FROM node:18-alpine

# Minimal production environment
ENV NODE_ENV=production

WORKDIR /app

COPY package*.json ./

RUN npm install --omit=dev --no-package-lock

COPY . .

EXPOSE 8080

CMD ["npm", "start"]