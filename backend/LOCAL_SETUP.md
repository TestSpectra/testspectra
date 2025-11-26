# 🚀 Local Development Setup

Setup backend services di local tanpa Docker.

---

## 📋 Prerequisites

### 1. Install PostgreSQL

**macOS (Homebrew):**
```bash
brew install postgresql@18
brew services start postgresql@18
```

**Or use existing PostgreSQL container:**
```bash
docker run -d --name postgres-local \
  -e POSTGRES_USER=testspectra \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=testspectra \
  -p 5432:5432 \
  postgres:18
```

### 2. Install Rust

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
rustup update
```

### 3. Install Protobuf Compiler

```bash
# macOS
brew install protobuf

# Ubuntu/Debian
sudo apt-get install protobuf-compiler

# Verify
protoc --version
```

---

## ⚙️ Configuration

### 1. Create `.env` files

**user-service/.env:**
```bash
cat > user-service/.env << 'EOF'
DATABASE_URL=postgresql://testspectra:password@localhost:5432/testspectra
JWT_SECRET=super-secret-jwt-key-testspectra-2024
SERVER_ADDR=0.0.0.0:50051
ADMIN_EMAIL=admin@testspectra.com
ADMIN_PASSWORD=Admin123!
ADMIN_NAME=Admin User
RUST_LOG=info
EOF
```

**grpc-proxy/.env:**
```bash
cat > grpc-proxy/.env << 'EOF'
GRPC_SERVICE_URL=http://localhost:50051
PROXY_ADDR=0.0.0.0:3002
RUST_LOG=info
EOF
```

---

## 🔨 Build

```bash
cd backend

# Build both services
cargo build --release

# Binaries will be at:
# - target/release/user-service
# - target/release/grpc-proxy
```

---

## 🚀 Run Services

### Quick Start:

```bash
cd backend

# Start both services
./start-services.sh
```

### Manual:

```bash
# Terminal 1: Start user-service
cd backend/user-service
../target/release/user-service

# Terminal 2: Start grpc-proxy
cd backend/grpc-proxy
../target/release/grpc-proxy
```

---

## 🧪 Test

```bash
# Health check
curl http://localhost:3002/health

# Login
curl -X POST http://localhost:3002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@testspectra.com","password":"Admin123!"}'
```

---

## 🗄️ Database

### Check users:

```bash
psql -h localhost -p 5432 -U testspectra -d testspectra -c "SELECT name, email, role FROM users;"
```

### Or use helper script:

```bash
./db-queries.sh users
```

---

## 🛑 Stop Services

```bash
./stop-services.sh
```

---

## 🔧 Development Tips

### Auto-reload on code change:

```bash
# Install cargo-watch
cargo install cargo-watch

# Watch user-service
cd user-service
cargo watch -x run

# Watch grpc-proxy
cd grpc-proxy
cargo watch -x run
```

### Check logs:

```bash
# Services write to:
# - logs/user-service.log
# - logs/grpc-proxy.log

tail -f logs/*.log
```

---

## 🐛 Troubleshooting

### PostgreSQL not running:

```bash
# Check status
pg_isready -h localhost -p 5432

# Start if using Docker
docker start postgres-local

# Or Homebrew
brew services start postgresql@18
```

### Port already in use:

```bash
# Check what's using ports
lsof -i :50051
lsof -i :3002

# Kill if needed
pkill -f user-service
pkill -f grpc-proxy
```

### Database doesn't exist:

```bash
# Create database
psql -h localhost -p 5432 -U testspectra -c "CREATE DATABASE testspectra;"

# Or if using postgres user
createdb -h localhost -p 5432 -U postgres testspectra
```

---

## ✅ Summary

**Start:**
```bash
cd backend
./start-services.sh
```

**Test:**
```bash
curl http://localhost:3002/health
```

**Stop:**
```bash
./stop-services.sh
```

**Logs:**
```bash
tail -f logs/*.log
```
