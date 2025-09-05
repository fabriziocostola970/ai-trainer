FROM node:18

# Minimal production environment
ENV NODE_ENV=production

WORKDIR /app

COPY package*.json ./

RUN npm install --omit=dev --no-package-lock

COPY . .

CMD ["npm", "start"]
