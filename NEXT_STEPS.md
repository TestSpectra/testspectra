# 🚀 Next Steps - TestSpectra User Management

## ✅ What's Been Completed

**Backend User Management System** telah selesai diimplementasikan dengan:
- ✅ Rust gRPC service untuk user management
- ✅ HTTP/REST proxy untuk frontend communication
- ✅ PostgreSQL schema dengan migrations
- ✅ JWT authentication system
- ✅ RBAC dengan 7 roles dan 12 permissions
- ✅ Admin user auto-seeding
- ✅ Complete documentation
- ✅ Build successful (no compilation errors)

---

## 📋 Immediate Next Steps

### Step 1: Install PostgreSQL (if not installed)

```bash
# Check if PostgreSQL is installed
which psql

# If not installed, install it
brew install postgresql@14
brew services start postgresql@14

# Add to PATH
echo 'export PATH="/opt/homebrew/opt/postgresql@14/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

### Step 2: Setup Database

```bash
# Connect to PostgreSQL
psql postgres
```

Run these SQL commands:
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

### Step 3: Configure Backend Services

```bash
cd backend/user-service
cp .env.example .env
```

Edit `backend/user-service/.env`:
```env
DATABASE_URL=postgresql://testspectra:password@localhost:5432/testspectra
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
SERVER_ADDR=0.0.0.0:50051
ADMIN_EMAIL=admin@testspectra.com
ADMIN_PASSWORD=Admin123!  # ⚠️ CHANGE THIS!
ADMIN_NAME=Admin User
RUST_LOG=info
```

```bash
cd ../grpc-proxy
cp .env.example .env
```

Edit `backend/grpc-proxy/.env`:
```env
GRPC_SERVICE_URL=http://localhost:50051
PROXY_ADDR=0.0.0.0:3000
RUST_LOG=info
```

### Step 4: Start Backend Services

```bash
cd ..  # back to backend/
./start-services.sh
```

You should see:
```
✅ All services started successfully!

📊 Service Status:
  - User Service:  http://localhost:50051 (gRPC)
  - gRPC Proxy:    http://localhost:3000 (HTTP/REST)
```

### Step 5: Test Backend

```bash
# Test health check
curl http://localhost:3000/health

# Test login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@testspectra.com",
    "password": "Admin123!"
  }'
```

You should get a response with `accessToken`, `refreshToken`, and `user` object.

---

## 🔄 Frontend Integration (Next Phase)

### Files to Update:

#### 1. Update `src/App.tsx`

Replace mock authentication dengan real API:

```typescript
import { authService } from './services/auth-service';

// Replace handleLogin function
const handleLogin = async (email: string, password: string) => {
  try {
    const response = await authService.login(email, password);
    setCurrentUser(response.user);
    setIsAuthenticated(true);
    setCurrentView('dashboard');
  } catch (error) {
    console.error('Login failed:', error);
    alert('Login failed. Please check your credentials.');
  }
};

// Replace handleLogout function
const handleLogout = () => {
  authService.logout();
  setIsAuthenticated(false);
  setCurrentUser(null);
  setCurrentView('login');
};

// Add token refresh logic
useEffect(() => {
  const checkAuth = async () => {
    if (authService.isAuthenticated()) {
      try {
        const user = authService.getCurrentUser();
        setCurrentUser(user);
        setIsAuthenticated(true);
      } catch (error) {
        authService.logout();
        setIsAuthenticated(false);
      }
    }
  };
  
  checkAuth();
}, []);
```

#### 2. Update `src/components/LoginPage.tsx`

```typescript
import { authService } from '../services/auth-service';

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);
  setError('');

  try {
    await onLogin(email, password);
  } catch (err) {
    setError('Invalid email or password');
  } finally {
    setIsLoading(false);
  }
};
```

#### 3. Update `src/components/UserManagement.tsx`

Replace mock data dengan real API calls using the services.

#### 4. Add Environment Variable

Create `.env` in project root:
```env
VITE_API_URL=http://localhost:3000/api
```

---

## 🧪 Testing Checklist

### Backend Tests:
- [ ] PostgreSQL is running
- [ ] Database `testspectra` exists
- [ ] User Service starts without errors
- [ ] gRPC Proxy starts without errors
- [ ] Health check returns `{"status":"ok"}`
- [ ] Login API works with admin credentials
- [ ] JWT tokens are generated correctly

### Frontend Tests:
- [ ] Frontend connects to backend
- [ ] Login page works with real API
- [ ] Admin user can login successfully
- [ ] Dashboard loads with real user data
- [ ] User Management page shows real users
- [ ] Logout works correctly
- [ ] Token refresh works (after 1 hour)

---

## 📊 Monitoring & Logs

### View Service Logs:

```bash
# User Service logs
tail -f backend/logs/user-service.log

# gRPC Proxy logs
tail -f backend/logs/grpc-proxy.log
```

### Stop Services:

```bash
cd backend
./stop-services.sh
```

---

## 🐛 Troubleshooting

### PostgreSQL Not Running
```bash
brew services list | grep postgresql
brew services start postgresql@14
```

### Port Already in Use
```bash
# Check port 50051
lsof -i :50051

# Check port 3000
lsof -i :3000

# Kill process if needed
kill -9 <PID>
```

### Database Connection Failed
```bash
# Test connection
psql -U testspectra -d testspectra -c "SELECT 1"

# Reset password if needed
psql postgres
ALTER USER testspectra WITH PASSWORD 'password';
\q
```

### Build Errors
```bash
cd backend
cargo clean
cargo build --release
```

---

## 📚 Documentation References

- **Backend README:** `backend/README.md`
- **Quick Start Guide:** `backend/QUICKSTART.md`
- **Implementation Summary:** `IMPLEMENTATION_SUMMARY.md`
- **API Documentation:** See `backend/README.md` - API Documentation section

---

## 🎯 Success Criteria

✅ **Backend is ready when:**
- PostgreSQL is running
- Both services start without errors
- Health check returns OK
- Login API returns valid JWT tokens
- Admin user can authenticate

✅ **Frontend integration is complete when:**
- Login page uses real API
- Admin can login and see dashboard
- User management shows real data
- Logout works correctly
- No mock data is used

---

## 💡 Tips

1. **Always check logs** if something doesn't work
2. **Use curl** to test API endpoints before frontend integration
3. **Keep services running** while developing frontend
4. **Use browser DevTools** to debug API calls
5. **Check CORS** if frontend can't connect to backend

---

## 🎉 You're Almost There!

Tinggal beberapa langkah lagi:
1. Install PostgreSQL ✓
2. Setup database ✓
3. Configure .env files ✓
4. Start services ✓
5. Test login ✓
6. Integrate frontend (next phase)

**Good luck! 🚀**
