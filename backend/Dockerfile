# Development Dockerfile
FROM node:20-alpine AS development

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate
RUN npx playwright install chromium

# Expose port
EXPOSE 3000

# Start in development mode
CMD ["npm", "run", "start:dev"]
