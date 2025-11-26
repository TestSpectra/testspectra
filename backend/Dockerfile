# Multi-stage build for TestSpectra Backend (single service)
FROM rust:1.91.1 AS builder

WORKDIR /app

# Copy only dependency files first for better caching
COPY Cargo.toml ./
COPY user-service/Cargo.toml ./user-service/
COPY grpc-proxy/Cargo.toml ./grpc-proxy/
COPY user-service/build.rs ./user-service/
COPY grpc-proxy/build.rs ./grpc-proxy/
COPY user-service/proto ./user-service/proto

# Create dummy source files and build dependencies
# This layer will be cached unless Cargo.toml changes
RUN mkdir -p user-service/src grpc-proxy/src && \
    echo "fn main() {}" > user-service/src/main.rs && \
    echo "fn main() {}" > grpc-proxy/src/main.rs && \
    cargo build --release && \
    rm -rf target/release/.fingerprint/user-service-* target/release/.fingerprint/grpc-proxy-*

# Now copy actual source code
COPY user-service/src ./user-service/src
COPY grpc-proxy/src ./grpc-proxy/src

# Build actual application (fast, dependencies already cached)
RUN cargo build --release

# Runtime image
FROM debian:bookworm-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       ca-certificates \
       openssl \
       libssl-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy both binaries
COPY --from=builder /app/target/release/user-service ./user-service
COPY --from=builder /app/target/release/grpc-proxy ./grpc-proxy

# Create startup script to run both services
RUN echo '#!/bin/bash\n\
set -e\n\
\n\
echo "🚀 Starting TestSpectra Backend Services..."\n\
\n\
# Start user-service in background\n\
echo "📡 Starting User Service (gRPC) on $SERVER_ADDR..."\n\
./user-service &\n\
USER_SERVICE_PID=$!\n\
\n\
# Wait for user-service to be ready\n\
sleep 3\n\
\n\
# Start grpc-proxy in foreground\n\
echo "🌐 Starting gRPC Proxy (HTTP) on $PROXY_ADDR..."\n\
./grpc-proxy &\n\
PROXY_PID=$!\n\
\n\
# Function to handle shutdown\n\
cleanup() {\n\
    echo ""\n\
    echo "🛑 Shutting down services..."\n\
    kill $PROXY_PID 2>/dev/null || true\n\
    kill $USER_SERVICE_PID 2>/dev/null || true\n\
    exit 0\n\
}\n\
\n\
trap cleanup SIGTERM SIGINT\n\
\n\
echo "✅ All services started successfully!"\n\
echo "   - User Service (gRPC): $SERVER_ADDR"\n\
echo "   - HTTP Proxy: $PROXY_ADDR"\n\
\n\
# Wait for both processes\n\
wait' > /app/start.sh && chmod +x /app/start.sh

# Default environment variables
ENV DATABASE_URL=postgresql://testspectra:password@db:5432/testspectra \
    JWT_SECRET=super-secret-jwt-key-change-this \
    SERVER_ADDR=0.0.0.0:50051 \
    GRPC_SERVICE_URL=http://localhost:50051 \
    PROXY_ADDR=0.0.0.0:3000 \
    RUST_LOG=info \
    ADMIN_EMAIL=admin@testspectra.com \
    ADMIN_PASSWORD=Admin123! \
    ADMIN_NAME="Admin User"

EXPOSE 50051 3000

CMD ["/app/start.sh"]
