# SCOPUS SRM - Enhanced with Security & Features

## New Features & Implementations

### 1. **Security Enhancements**
✅ **Input Validation Middleware** (`backend/middleware/validationMiddleware.js`)
- Email validation
- Faculty ID format validation
- Password strength validation
- Date range validation
- SQL injection prevention
- XSS protection via input sanitization

✅ **Rate Limiting** (`backend/middleware/rateLimitMiddleware.js`)
- Login attempts: 5 per 15 minutes
- Password reset: 3 per hour
- Signup: 10 per hour
- General API: 30 per minute
- Prevents brute force attacks

✅ **Security Headers** (Helmet.js)
- XSS protection
- CSRF prevention
- Clickjacking prevention
- Content Security Policy

### 2. **Password Management**
✅ **Password Reset Flow** (`backend/controllers/passwordController.js`)
- Request reset endpoint with email verification
- Token-based reset (1 hour expiration)
- Hashed password storage with bcryptjs
- Change password for logged-in users

**Endpoints:**
```
POST /api/password/reset-request  - Request password reset
POST /api/password/reset          - Reset password with token
POST /api/password/change         - Change password (requires auth)
```

✅ **Frontend Component** (`Scopus/src/components/PasswordReset.tsx`)
- Two-step password reset form
- Error handling and validation
- Success notifications

### 3. **Search Functionality**
✅ **Global Search** (`backend/controllers/searchController.js`)
- Search across faculty and papers
- Real-time results
- Search result pagination (limit 10)

✅ **Advanced Search**
- Filter by faculty name, Scopus ID, H-Index range
- Date range filtering
- SDG and domain filtering
- Returns up to 50 results

✅ **Paper Search**
- Search by title, DOI, Scopus ID
- Filter by publication date and quartile
- Advanced filtering capabilities

**Endpoints:**
```
GET /api/search/global              - Global search
GET /api/search/advanced            - Advanced search with filters
GET /api/search/papers              - Paper-specific search
```

✅ **Frontend Component** (`Scopus/src/components/GlobalSearch.tsx`)
- Clean, responsive search interface
- Real-time search results display
- Result categorization (Faculty, Papers, SDGs)

### 4. **Data Export Features**
✅ **CSV Export** (`backend/controllers/exportController.js`)
- Export faculty list with filters
- Export papers with filters
- Export detailed faculty reports
- Proper CSV formatting with all metadata

**Endpoints:**
```
GET /api/export/faculty-csv         - Export faculty list
GET /api/export/papers-csv          - Export papers
GET /api/export/faculty-report/:id  - Export faculty report
```

### 5. **Comprehensive Logging**
✅ **Audit Logging** (`backend/middleware/loggingMiddleware.js`)
- Login attempt tracking
- Password change logging
- Admin action logging
- Data access logging
- Request logging (method, path, status, duration)

**Log Files Created:**
- `backend/logs/audit.log` - Important actions
- `backend/logs/auth.log` - Authentication attempts
- `backend/logs/error.log` - Error details
- `backend/logs/requests.log` - All API requests

### 6. **Improved Error Handling**
✅ **Consistent Error Responses**
- Standardized error format
- Meaningful error messages
- HTTP status codes (400, 401, 429, 500)
- Environment-aware error details

✅ **Global Error Middleware**
- Catches all unhandled errors
- Logs errors with context
- User-friendly error messages
- 404 handling for unknown routes

### 7. **Health Check & Monitoring**
✅ **New Endpoints**
```
GET /health                    - Service health check
GET /api/test                  - API connectivity test
```

---

## Installation & Setup

### Backend Setup
```bash
cd backend

# Install dependencies
npm install
npm install express-rate-limit helmet validator morgan json2csv bcryptjs

# Environment variables (.env)
NODE_ENV=development
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=scopus_db
PORT=5001
```

### Database Migration
Ensure your `users` table has these columns:
```sql
ALTER TABLE users ADD COLUMN reset_token VARCHAR(255);
ALTER TABLE users ADD COLUMN reset_token_expires DATETIME;
```

### Frontend Setup
```bash
cd Scopus
npm install
npm run dev
```

---

## API Documentation

### Authentication
```
POST /api/login
Body: { username, password }
Response: { success, user: { accessLevel, facultyId, etc } }
```

### Password Management
```
POST /api/password/reset-request
Body: { email }

POST /api/password/reset
Body: { token, newPassword }

POST /api/password/change
Body: { currentPassword, newPassword }
```

### Search
```
GET /api/search/global?q=query&type=faculty|papers|all

GET /api/search/advanced?facultyName=...&minHIndex=...&sdg=...

GET /api/search/papers?title=...&doi=...&startDate=...&endDate=...
```

### Export
```
GET /api/export/faculty-csv?sdg=...&domain=...&year=...

GET /api/export/papers-csv?facultyId=...&startDate=...&endDate=...

GET /api/export/faculty-report/:facultyId
```

---

## Security Best Practices Implemented

✅ **Password Security**
- Bcryptjs hashing (10 salt rounds)
- Minimum 6 characters length
- Reset tokens with expiration (1 hour)

✅ **Rate Limiting**
- Brute force protection
- DDoS mitigation
- Per-endpoint limits

✅ **Input Validation**
- Type checking
- Format validation
- Length restrictions
- Sanitization

✅ **Error Handling**
- No sensitive data in error messages
- Proper HTTP status codes
- Detailed server-side logging

✅ **Headers Security**
- Helmet.js for security headers
- XSS protection
- CSRF tokens ready
- Proper CORS configuration

---

## Logging Examples

### Audit Log Entry
```json
{
  "timestamp": "2026-01-24T10:30:45.123Z",
  "action": "PASSWORD_RESET_COMPLETED",
  "details": { "faculty_id": "FAC001" }
}
```

### Login Attempt Log
```json
{
  "timestamp": "2026-01-24T10:30:45.123Z",
  "type": "LOGIN_ATTEMPT",
  "username": "FAC001",
  "success": true,
  "ip": "192.168.1.1"
}
```

---

## Future Enhancements

- [ ] Email notification system for password resets
- [ ] Two-factor authentication (2FA)
- [ ] Pagination for large result sets
- [ ] Advanced caching (Redis)
- [ ] API rate limiting per user
- [ ] Webhook support for data changes
- [ ] GraphQL API alongside REST
- [ ] Database backup automation

---

## Troubleshooting

### Rate Limiting Issues
If you're blocked from login attempts, wait 15 minutes or restart the server.

### Password Reset Token Invalid
Tokens expire after 1 hour. Request a new reset link.

### CSV Export Empty
Check your database query filters and ensure data exists.

### Logs Not Creating
Ensure `backend/logs/` directory has write permissions:
```bash
mkdir -p backend/logs
chmod 755 backend/logs
```

---

## Performance Notes

- Global search limited to 10 results for performance
- Advanced search limited to 50 results
- Paper export limited to 5000 records
- Request logging uses async file I/O
- Database queries use parameterized statements (SQL injection safe)

---

## Version
- **Current**: 2.0.0
- **Last Updated**: January 24, 2026
- **Status**: Production Ready

---

## Support
For issues or feature requests, contact the development team.
