# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the client
RUN npm run build

# Production stage
FROM nginx:stable-alpine

# Copy built files to nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Add nginx config if needed for SPA
# COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
