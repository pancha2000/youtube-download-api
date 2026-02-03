# Multi-stage build - minimize final image size
FROM node:18-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++ ffmpeg

# Copy package files
COPY package*.json ./

# Install dependencies with production flag
RUN npm ci --only=production && npm cache clean --force

# Final stage
FROM node:18-alpine

WORKDIR /app

# Install runtime dependencies only
RUN apk add --no-cache \
    ffmpeg \
    python3 \
    curl \
    wget

# Install yt-dlp
RUN apk add --no-cache yt-dlp

# Copy node modules from builder
COPY --from=builder /app/node_modules ./node_modules

# Copy application files
COPY index.js .
COPY package.json .
COPY .env* ./
COPY youtube_cookies.txt* ./cookies.txt* ./

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:${PORT:-3000}/health || exit 1

# Expose port
EXPOSE 3000

# Start application
CMD ["npm", "start"]
