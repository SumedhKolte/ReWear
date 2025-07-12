# ============================================================================
# Items Search API Dockerfile
# Multi-stage build for production optimization
# ============================================================================

# Build stage
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including dev dependencies for building)
RUN npm ci --only=production && npm cache clean --force

# Production stage
FROM node:18-alpine AS production

# Install system dependencies
RUN apk add --no-cache \
    postgresql-client \
    curl \
    && rm -rf /var/cache/apk/*

# Create app user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodeapp -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && \
    npm cache clean --force && \
    rm -rf /tmp/*

# Copy application code
COPY --chown=nodeapp:nodejs . .

# Create necessary directories
RUN mkdir -p logs && \
    chown -R nodeapp:nodejs logs

# Remove unnecessary files
RUN rm -rf tests/ docs/ scripts/ .git/ .github/ *.md

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Switch to non-root user
USER nodeapp

# Start the application
CMD ["node", "server.js"]

# Labels for metadata
LABEL maintainer="your.email@example.com"
LABEL version="1.0.0"
LABEL description="Items Search API with PostgreSQL and Redis"
LABEL org.opencontainers.image.source="https://github.com/yourusername/items-search-api"
