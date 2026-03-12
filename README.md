# basilio

> Generated with [SaaS Factory](https://github.com/saas-factory) 🏭

A full-featured SaaS application boilerplate with everything you need to launch your product.

## 🚀 Tech Stack

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS
- **State Management:** React Context + Hooks
- **Forms:** React Hook Form

### Backend
- **Framework:** Express.js
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Caching:** Redis

## 📦 Installed Modules

- 🔐 **Authentication** - Complete auth system with login, register, password reset, and OAuth support
- 📊 **Dashboard UI** - Pre-built dashboard components and layouts

## 🏁 Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL
- Redis (optional)

### Installation

```bash
# Clone and enter the project
cd basilio

# Copy environment variables
cp .env.example .env

# Install all dependencies
npm run install:all

# Start development servers
npm run dev
```

### Environment Setup

1. Copy `.env.example` to `.env`
2. Update the database connection string
3. Add your API keys (Stripe, OAuth providers, etc.)

## 📁 Project Structure

```
basilio/
├── frontend/                 # Next.js application
│   ├── app/                  # App router pages
│   ├── components/           # React components
│   └── lib/                  # Utilities
├── backend/                  # Express server
│   ├── routes/              # API routes
│   ├── middleware/          # Middleware
│   └── utils/               # Utilities
├── shared/                   # Shared modules
│   ├── utils/                # Common utilities
│   └── auth/
│   └── ui/
├── .env.example              # Environment template
└── package.json              # Root package.json
```

## 🛠️ Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start all development servers |
| `npm run dev:frontend` | Start frontend only |
| `npm run dev:backend` | Start backend only |
| `npm run build` | Build for production |
| `npm run lint` | Run linters |

## 🔧 Configuration

### Database

Update your database URL in `.env`:

```
DATABASE_URL=postgresql://user:password@localhost:5432/basilio_db
```

### Authentication

The auth module supports:
- Email/Password authentication
- **Email verification required** - Users must verify their email before logging in
- JWT tokens with refresh
- Password reset flow
- Session management

**Email Verification Setup:**
1. Configure your SMTP settings in `.env`
2. Users will receive a verification email after registration
3. They must click the link before they can log in


## 📄 License

MIT License - feel free to use this for any project!

---

Built with ❤️ using [SaaS Factory](https://github.com/saas-factory)
