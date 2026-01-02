# GregKyrMaths - Mathematics Educational Platform

A modern educational platform for mathematics exercises, tutorials, Q&A, and e-commerce for math textbooks.

Built with Remix 2, React 18, Prisma, MongoDB, Tailwind CSS, and deployed on Vercel.

## Features

- **Exercises**: PDF-based math exercises with categories and search
- **Tutorials**: Video tutorials and educational content
- **Q&A System**: Stack Overflow-style questions and answers
- **E-commerce**: Purchase and download math textbooks via Stripe
- **Internationalization**: Full Greek and English support
- **Cloud Storage**: Cloudinary for file storage

## Requirements

- **Node.js 18+** (required for Remix 2)
- **npm 8+** or **yarn**
- **MongoDB** database
- **Supabase** account (for real-time features)

## Quick Start

### 1. Install Node.js 18+

Using nvm (recommended):

```bash
nvm install 18
nvm use 18
```

Or download from [nodejs.org](https://nodejs.org/).

### 2. Clone and Install Dependencies

```bash
git clone <repository-url>
cd maths-joy
npm install
```

### 3. Set Up Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="mongodb+srv://<user>:<password>@<cluster>.mongodb.net/<database>"

# Supabase (for real-time features)
SUPABASE_URL="https://<project>.supabase.co"
SUPABASE_ANON_KEY="your-anon-key"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_CALLBACK_URL="http://localhost:3000/auth/callback"

# Cloudinary (for file storage)
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# Stripe (for payments)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# App
APP_URL="http://localhost:3000"
NODE_ENV="development"
```

### 4. Generate Prisma Client

```bash
npm run prisma:generate
```

### 5. Push Database Schema

```bash
npm run prisma:push
```

### 6. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run typecheck` | Run TypeScript type checking |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Fix ESLint errors automatically |
| `npm run prisma:generate` | Generate Prisma client |
| `npm run prisma:push` | Push schema changes to database |
| `npm run prisma:studio` | Open Prisma Studio GUI |

## Project Structure

```
maths-joy/
├── app/
│   ├── routes/           # Remix routes (pages)
│   │   ├── api/          # API endpoints
│   │   ├── auth/         # Authentication routes
│   │   ├── books/        # E-commerce pages
│   │   ├── chat/         # Real-time chat
│   │   ├── download/     # File downloads
│   │   ├── exercises/    # Math exercises
│   │   ├── qa/           # Q&A system
│   │   └── ...
│   ├── utils/            # Server utilities
│   │   ├── auth.prisma.ts
│   │   ├── cloudinary.server.ts
│   │   ├── qa.server.ts
│   │   ├── stripe.server.ts
│   │   └── ...
│   ├── styles/           # CSS files
│   ├── entry.client.tsx  # Client entry point
│   ├── entry.server.tsx  # Server entry point
│   └── root.tsx          # Root component
├── components/           # Reusable React components
├── hooks/                # Custom React hooks
├── prisma/
│   └── schema.prisma     # Database schema
├── public/
│   └── locales/          # Translation files (en, el)
├── services/             # Shared services
├── .env                  # Environment variables (not committed)
├── package.json
├── tailwind.config.cjs
├── tsconfig.json
└── vite.config.ts
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the repository on [Vercel](https://vercel.com/new)
3. Configure environment variables in Vercel dashboard
4. Deploy

### Manual Deployment

```bash
npm run build
npm run start
```

## Setting Up External Services

### MongoDB Atlas

1. Create account at [mongodb.com](https://www.mongodb.com/atlas)
2. Create a cluster
3. Get connection string for `DATABASE_URL`

### Supabase

1. Create project at [supabase.com](https://supabase.com)
2. Get URL and anon key from Settings > API
3. Create `messages` and `users` tables for chat feature

### Cloudinary

1. Create account at [cloudinary.com](https://cloudinary.com)
2. Get credentials from Dashboard
3. Configure upload presets if needed

### Stripe

1. Create account at [stripe.com](https://stripe.com)
2. Get API keys from Developers section
3. Set up webhook endpoint: `https://your-domain.com/api/stripe-webhook`
4. Subscribe to events: `checkout.session.completed`, `checkout.session.expired`

### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create OAuth 2.0 credentials
3. Add authorized redirect URI: `http://localhost:3000/auth/callback`

## Troubleshooting

### "Cannot find module" errors in IDE

Run `npm install` to install all dependencies. The IDE will resolve imports after packages are installed.

### Prisma client errors

Regenerate the client:

```bash
npm run prisma:generate
```

### Database connection issues

1. Check `DATABASE_URL` is correct
2. Ensure IP is whitelisted in MongoDB Atlas
3. Run `npm run prisma:push` to sync schema

### Build errors

```bash
rm -rf node_modules .cache build
npm install
npm run build
```

## License

Private - All rights reserved.

## Support

For issues and questions, contact the administrator.
