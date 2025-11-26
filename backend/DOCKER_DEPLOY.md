# 🐳 TestSpectra Backend - Docker Deployment

Simple single-service deployment dengan Docker Compose.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────┐
│   testspectra-backend               │
│   (Single Container)                │
│                                     │
│   ┌──────────────────────┐         │
│   │  user-service        │         │
│   │  (gRPC: port 50051)  │         │
│   └──────────┬───────────┘         │
│              │                      │
│   ┌──────────▼───────────┐         │
│   │  grpc-proxy          │         │
│   │  (HTTP: port 3000)   │         │
│   └──────────────────────┘         │
│                                     │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│   testspectra-db                    │
│   (PostgreSQL 18)                   │
│   Port: 5432                        │
└─────────────────────────────────────┘
```

**Single Binary Deployment:**
- ✅ **1 Backend Container** - Runs both user-service (gRPC) dan grpc-proxy (HTTP)
- ✅ **1 Database Container** - PostgreSQL 18
- ✅ Build dari folder `backend` pakai `cargo build --release`

---

## 🚀 Quick Start

### Prerequisites:
- Docker & Docker Compose installed
- Port 3000, 5432, 50051 available

### Start Services:

```bash
cd backend

# Start dengan defaults
./docker-up.sh

# Atau manual
docker-compose up --build -d
```

### Stop Services:

```bash
./docker-down.sh

# Atau manual
docker-compose down

# Stop dan hapus database data
docker-compose down -v
```

---

## ⚙️ Configuration

### Environment Variables:

Create `.env` file dari template:

```bash
cp .env.example .env
```

Edit `.env`:

```env
# JWT Secret (CHANGE IN PRODUCTION!)
JWT_SECRET=your-super-secret-jwt-key

# Admin User Credentials
ADMIN_EMAIL=admin@testspectra.com
ADMIN_PASSWORD=YourSecurePassword123!
ADMIN_NAME=Admin User

# Logging Level (debug, info, warn, error)
RUST_LOG=info
```

### Default Values:

Jika tidak ada `.env`, akan pakai defaults:
- **Admin Email**: `admin@testspectra.com`
- **Admin Password**: `Admin123!`
- **JWT Secret**: `super-secret-jwt-key-change-this`
- **Database**: `testspectra` / `testspectra` / `password`

---

## 🧪 Testing

### Health Check:

```bash
curl http://localhost:3000/health
```

Expected: `{"status":"ok"}`

### Login Test:

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@testspectra.com",
    "password": "Admin123!"
  }'
```

Expected: JSON with `accessToken`, `refreshToken`, and `user` object.

---

## 📊 Monitoring & Logs

### View Logs:

```bash
# All services
docker-compose logs -f

# Backend only
docker-compose logs -f backend

# Last 50 lines
docker-compose logs --tail=50 backend

# Database only
docker-compose logs -f db
```

### Check Status:

```bash
docker-compose ps
```

### Container Stats:

```bash
docker stats testspectra-backend testspectra-db
```

---

## 🗄️ Database Access

### Via Docker Exec:

```bash
# Quick query
docker exec -it testspectra-db psql -U testspectra -d testspectra \
  -c "SELECT name, email, role FROM users;"

# Interactive session
docker exec -it testspectra-db psql -U testspectra -d testspectra
```

### Via External Client:

```
Host:     localhost
Port:     5432
Database: testspectra
User:     testspectra
Password: password
```

### Helper Script:

```bash
# List all users
./db-queries.sh users

# Show admin users
./db-queries.sh admin

# Interactive psql
./db-queries.sh interactive
```

---

## 🔧 Management Commands

### Restart Services:

```bash
# Restart backend only
docker-compose restart backend

# Restart all
docker-compose restart
```

### Rebuild After Code Changes:

```bash
# Rebuild and restart
docker-compose up --build -d

# Force rebuild (no cache)
docker-compose build --no-cache backend
docker-compose up -d
```

### View Service Info:

```bash
# Inspect backend container
docker inspect testspectra-backend

# Check exposed ports
docker port testspectra-backend

# Execute command in container
docker exec -it testspectra-backend /bin/bash
```

---

## 🐛 Troubleshooting

### Backend won't start:

```bash
# Check logs
docker-compose logs backend

# Common issues:
# 1. Database not ready - wait for healthcheck
# 2. Port already in use - stop conflicting services
# 3. Build errors - check Cargo.toml and Rust code
```

### Can't connect to database:

```bash
# Check if DB is healthy
docker-compose ps

# Restart DB
docker-compose restart db

# Check DB logs
docker-compose logs db
```

### Port conflicts:

```bash
# Check what's using ports
lsof -i :3000
lsof -i :5432
lsof -i :50051

# Kill conflicting processes
pkill -f "process-name"

# Or change ports in docker-compose.yml
```

### Reset everything:

```bash
# Stop and remove all
docker-compose down -v

# Remove images
docker rmi testspectra-backend testspectra-db

# Start fresh
./docker-up.sh
```

---

## 📦 Build Details

### Dockerfile Structure:

```dockerfile
# Stage 1: Builder (Rust 1.80)
FROM rust:1.80 AS builder
WORKDIR /app
COPY Cargo.toml ./
COPY user-service ./user-service
COPY grpc-proxy ./grpc-proxy
RUN cargo build --release

# Stage 2: Runtime (Debian Bookworm Slim)
FROM debian:bookworm-slim
# Install runtime deps (openssl, ca-certs)
# Copy binaries from builder
# Create startup script
# Expose ports 3000, 50051
```

### Build Time:

- **First build**: ~5-10 minutes (downloads deps, compiles)
- **Subsequent builds**: ~1-2 minutes (uses cache)

### Image Size:

- **Builder stage**: ~2-3 GB
- **Runtime image**: ~200-300 MB

---

## 🔐 Security Notes

### Production Deployment:

1. **Change default credentials:**
   ```bash
   # Set in .env
   JWT_SECRET=generate-a-strong-random-secret
   ADMIN_PASSWORD=UseAStrongPassword123!
   ```

2. **Don't expose DB port publicly:**
   ```yaml
   # In docker-compose.yml, remove:
   ports:
     - "5432:5432"
   ```

3. **Use secrets management:**
   - Docker secrets
   - Vault
   - Cloud provider secrets (AWS Secrets Manager, etc.)

4. **Enable TLS/HTTPS:**
   - Use reverse proxy (nginx, traefik)
   - Obtain SSL certificates (Let's Encrypt)

5. **Run as non-root:**
   - Already configured in Dockerfile
   - Backend runs as `root` user (consider adding non-root user)

---

## 📈 Performance Tuning

### Database:

```yaml
# Add to db service in docker-compose.yml
environment:
  POSTGRES_MAX_CONNECTIONS: 100
  POSTGRES_SHARED_BUFFERS: 256MB
  POSTGRES_EFFECTIVE_CACHE_SIZE: 1GB
```

### Backend:

```yaml
# Add to backend service
environment:
  RUST_LOG: warn  # Less verbose logging
  
# Limit resources
deploy:
  resources:
    limits:
      cpus: '2'
      memory: 1G
```

---

## 🚀 CI/CD Integration

### GitHub Actions Example:

```yaml
name: Build and Deploy

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build Docker Image
        run: |
          cd backend
          docker-compose build
      
      - name: Run Tests
        run: |
          docker-compose up -d db
          # Run integration tests
          
      - name: Push to Registry
        run: |
          docker tag testspectra-backend registry.example.com/testspectra:${{ github.sha }}
          docker push registry.example.com/testspectra:${{ github.sha }}
```

---

## 📚 Additional Resources

- **Main README**: `../README.md`
- **Backend Implementation**: `./IMPLEMENTATION_SUMMARY.md`
- **Database Queries**: `./db-queries.sh`
- **Local Development**: `./QUICKSTART.md`

---

**Summary**: Single-container deployment untuk easy deployment dan management. Build dari folder backend pakai cargo, run dengan docker-compose!

**Status**: ✅ Production Ready  
**Last Updated**: November 26, 2025
