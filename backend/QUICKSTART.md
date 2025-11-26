# Quick Start Guide - TestSpectra Backend

## Prerequisites Installation

### 1. Install Rust

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env
```

### 2. Install PostgreSQL

```bash
# macOS
brew install postgresql@14
brew services start postgresql@14

# Add to PATH
echo 'export PATH="/opt/homebrew/opt/postgresql@14/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

### 3. Install Protocol Buffers

```bash
brew install protobuf
```

## Database Setup

```bash
# Create database and user
psql postgres
```

```sql
CREATE DATABASE testspectra;
CREATE USER testspectra WITH PASSWORD 'password';
GRANT ALL PRIVILEGES ON DATABASE testspectra TO testspectra;
ALTER DATABASE testspectra OWNER TO testspectra;
\q
```

Test connection:
```bash
psql -U testspectra -d testspectra -c "SELECT 1"
```

## Backend Setup

### 1. Configure Environment Variables

```bash
cd backend/user-service
cp .env.example .env
```

Edit `.env` and set your admin password:
```env
ADMIN_PASSWORD=YourSecurePassword123!
```

```bash
cd ../grpc-proxy
cp .env.example .env
```

### 2. Build Services

```bash
cd ..  # back to backend/
cargo build --release
```

This will take a few minutes on first build.

### 3. Start Services

```bash
./start-services.sh
```

You should see:
```
✅ All services started successfully!

📊 Service Status:
  - User Service:  http://localhost:50051 (gRPC)
  - gRPC Proxy:    http://localhost:3000 (HTTP/REST)
```

### 4. Verify Services

```bash
# Check health
curl http://localhost:3000/health

# Should return: {"status":"ok"}
```

## Test Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@testspectra.com",
    "password": "YourSecurePassword123!"
  }'
```

You should get a response with `accessToken`, `refreshToken`, and `user` object.

## Stop Services

```bash
./stop-services.sh
```

## Troubleshooting

### PostgreSQL Connection Failed

```bash
# Check if PostgreSQL is running
brew services list | grep postgresql

# Start if not running
brew services start postgresql@14

# Check connection
psql -U testspectra -d testspectra -c "SELECT 1"
```

### Port Already in Use

```bash
# Check what's using port 50051
lsof -i :50051

# Check what's using port 3000
lsof -i :3000

# Kill process if needed
kill -9 <PID>
```

### Build Errors

```bash
# Clean and rebuild
cargo clean
cargo build --release
```

### View Logs

```bash
# User Service logs
tail -f logs/user-service.log

# gRPC Proxy logs
tail -f logs/grpc-proxy.log
```

## Next Steps

1. ✅ Backend services are running
2. 📱 Start the frontend: `cd .. && npm run dev`
3. 🔐 Login with admin credentials
4. 🎉 Start using TestSpectra!
