# Production Dockerfile for React frontend
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Build without VITE_API_URL so axios uses relative URLs (proxied by nginx)
RUN npm run build

# Production stage — nginx to serve static files and proxy /api
FROM nginx:1.25-alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.prod.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
