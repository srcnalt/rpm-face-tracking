FROM node:lts-alpine3.19

WORKDIR /app

# Install dependencies
COPY tsconfig.json ./
COPY package*.json ./
RUN npm install

# Copy code
COPY public/ ./public
COPY src/ ./src

CMD ["npm", "start"]