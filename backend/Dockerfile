# Multi-stage build for TestSpectra Backend
FROM rust:1.91.1-alpine AS builder

# Install build dependencies
RUN apk add --no-cache musl-dev openssl-dev openssl-libs-static pkgconfig

WORKDIR /app

# Copy only dependency files first for better caching
COPY Cargo.toml ./

# Create dummy source file and build dependencies
# This layer will be cached unless Cargo.toml changes
RUN mkdir -p src && \
    echo "fn main() {}" > src/main.rs && \
    cargo build --release && \
    rm -rf target/release/.fingerprint/testspectra-backend-*

# Now copy actual source code and migrations
COPY src ./src
COPY migrations ./migrations

# Build actual application (fast, dependencies already cached)
RUN cargo build --release && \
    strip target/release/testspectra-backend

# Runtime image - Alpine is much smaller!
FROM alpine:latest

RUN apk add --no-cache ca-certificates libgcc

WORKDIR /app

# Copy binary and migrations
COPY --from=builder /app/target/release/testspectra-backend ./testspectra-backend
COPY --from=builder /app/migrations ./migrations

# Default environment variables
ENV DATABASE_URL=postgresql://testspectra:password@db:5432/testspectra \
    JWT_SECRET=super-secret-jwt-key-change-this \
    SERVER_ADDR=0.0.0.0:3000 \
    RUST_LOG=info \
    ADMIN_EMAIL=admin@testspectra.com \
    ADMIN_PASSWORD=Admin123! \
    ADMIN_NAME="Admin User"

EXPOSE 3000

CMD ["./testspectra-backend"]
