# Secure Billing System

A secure, full-stack commodity billing management system built with Next.js, MongoDB, and TypeScript.

## Features

- 🔐 **Secure Authentication** - JWT-based auth with role-based access control
- 📊 **Bill Management** - Create, track, and manage commodity bills
- 📦 **Bag Tracking** - Individual bag weight tracking and adjustments
- 💰 **Automated Calculations** - Automatic billing calculations with deductions
- 📝 **Audit Trail** - Complete audit logging of all operations
- 🎨 **Modern UI** - Built with React, Tailwind CSS, and shadcn/ui
- 🗄️ **MongoDB Backend** - Real database with Mongoose ODM

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **Backend**: Next.js API Routes, MongoDB, Mongoose
- **Authentication**: JWT (jose), bcrypt
- **UI**: Tailwind CSS, shadcn/ui, Radix UI
- **Validation**: Zod schemas
- **Forms**: React Hook Form

## Prerequisites

- Node.js 18+
- pnpm
- MongoDB (local or Atlas)

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd secure-billing-system
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env.local
   ```
   
   Update `.env.local` with your MongoDB connection string and JWT secrets.

4. **Start MongoDB** (if using local)
   ```bash
   # Ensure MongoDB service is running
   ```

5. **Run the application**
   ```bash
   pnpm dev
   ```

6. **Create first admin user**
   
   Visit the registration endpoint or use MongoDB to create your first admin user.

## Environment Variables

```env
MONGODB_URI=mongodb://localhost:27017/secure-billing-system
JWT_ACCESS_SECRET=<your-secret-min-32-chars>
JWT_REFRESH_SECRET=<your-secret-min-32-chars>
NODE_ENV=development
APP_URL=http://localhost:3000
```

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── api/               # API routes (backend)
│   ├── admin/             # Admin pages
│   ├── dashboard/         # User dashboard
│   └── login/             # Authentication pages
├── backend/               # Backend logic
│   ├── config/           # Database configuration
│   ├── models/           # Mongoose schemas
│   └── services/         # Business logic layer
├── components/            # React components
├── lib/                   # Utilities and helpers
└── public/               # Static assets
```

## Security Features

### Authentication & Authorization
- JWT authentication with access and refresh tokens
- Password hashing with bcrypt (cost factor 12)
- Role-based access control (Admin/Viewer)
- Multi-factor authentication (MFA) support
- Session management with device tracking

### Advanced Security
- ✅ **Device/IP tracking** - Track login devices and IP addresses
- ✅ **Brute-force protection** - Advanced protection against brute force attacks
- ✅ **Account lockout system** - Automatic account lockout after failed attempts
- ✅ **Rate limiting implementation** - Configurable rate limits per endpoint
- Security fingerprinting for device identification
- Failed login attempt monitoring and alerting

### Data Protection
- Input validation and sanitization
- Security headers (HSTS, CSP, X-Frame-Options, etc.)
- Comprehensive audit logging for all operations
- CORS configuration
- SQL/NoSQL injection prevention
- XSS and CSRF protection

## Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/register` - User registration
- `GET /api/auth/session` - Check session
- `POST /api/auth/refresh` - Refresh token

### Bills
- `GET /api/bills` - List bills
- `POST /api/bills` - Create bill
- `GET /api/bills/[id]` - Get bill
- `PUT /api/bills/[id]` - Update bill
- `DELETE /api/bills/[id]` - Delete bill

### Commodities
- `GET /api/commodities` - List commodities
- `POST /api/commodities` - Create commodity
- `GET /api/commodities/[id]` - Get commodity
- `PUT /api/commodities/[id]` - Update commodity
- `DELETE /api/commodities/[id]` - Delete commodity

### Users (Admin only)
- `GET /api/users` - List users
- `POST /api/users` - Create user
- `GET /api/users/[id]` - Get user
- `PUT /api/users/[id]` - Update user
- `DELETE /api/users/[id]` - Delete user

### Security & Monitoring
- `GET /api/security` - Security logs and monitoring
- `GET /api/system/health` - System health check
- `GET /api/notifications` - User notifications
- `GET /api/recycle-bin` - Manage deleted items
- `POST /api/recycle-bin` - Restore deleted items

### Backup & Recovery
- `GET /api/backups` - List system backups
- `POST /api/backups` - Create new backup
- `POST /api/backups/[id]/restore` - Restore from backup

### Other
- `GET /api/audit-logs` - View audit logs
- `GET /api/dashboard/stats` - Dashboard statistics
- `GET /api/settings` - Get settings
- `PUT /api/settings` - Update settings
- `GET /api/reports` - Generate reports
- `GET /api/search` - Global search

## Production Deployment

1. Set up production MongoDB (MongoDB Atlas recommended)
2. Configure environment variables with strong secrets
3. Build the application: `pnpm build`
4. Deploy to your hosting platform (Vercel, AWS, etc.)
5. Set up SSL/TLS certificate
6. Configure CORS for your domain

## License

Proprietary - All rights reserved

## Support

For issues and questions, please open an issue in the GitHub repository.
