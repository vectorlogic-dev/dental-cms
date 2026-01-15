# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the server
RUN npm run build:server

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm install --only=production

# Copy built files from builder
COPY --from=builder /app/dist ./dist
# Copy client build if needed (though usually handled separately in dev)
# For this setup, we'll keep them separate or use a proxy

EXPOSE 5000

CMD ["npm", "start"]
