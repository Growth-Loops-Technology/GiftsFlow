# GiftsFlow - Setup & Authentication Guide

## 🆕 New Features Added

### Authentication & Authorization
- ✅ User registration and login
- ✅ Three user roles: Customer, Vendor, Admin
- ✅ Protected vendor portal (requires Vendor/Admin role)
- ✅ Admin access control
- ✅ Secure password hashing with bcryptjs
- ✅ JWT session management

### Database Migration
- ✅ All products fetched from Upstash Vector DB (no more local JSON)
- ✅ AI chatbot uses Upstash for product recommendations
- ✅ Vector similarity search for intelligent product discovery
- ✅ User authentication with Prisma & MongoDB

## 🚀 Quick Start

### 1. Environment Setup

Create a `.env.local` file with:

```env
# Database (MongoDB)
# Use MongoDB Atlas for cloud or local MongoDB
DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/giftsflow?retryWrites=true&w=majority"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-a-random-secret-key-here"

# Upstash Vector
UPSTASH_VECTOR_REST_URL=your_upstash_url
UPSTASH_VECTOR_REST_TOKEN=your_upstash_token

# OpenAI
OPENAI_API_KEY=your_openai_key
```

### 2. Initialize Database

```bash
# Generate Prisma client
npx prisma generate

# Push database schema to MongoDB
npx prisma db push
npx prisma db push
```

### 3. Seed Products to Upstash

Make sure your Upstash credentials are in `.env.local`, then:

```bash
npm run db:seed-products
```

This will migrate all products from the local JSON file to Upstash Vector DB.

### 4. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:3000`

## 📝 User Roles

### Customer/User
- Browse and search products
- Add items to cart
- Chat with AI assistant
- View product recommendations

### Vendor
- Access vendor portal at `/portal`
- Upload product catalogs via Excel files
- Manage shop products
- Have products indexed in Upstash for search

### Admin
- Access vendor portal
- Full administrative capabilities
- Can upload and manage vendor products

## 🔐 Authentication Flow

### Sign Up
1. Navigate to `/auth/signup`
2. Select account type (Customer/Vendor/Admin)
3. Enter email, password, name
4. Account created and saved to database

### Login
1. Navigate to `/auth/login`
2. Enter credentials
3. NextAuth creates JWT session
4. Redirected to dashboard or requested page

### Protected Routes
- `/portal` - Requires Vendor or Admin role
- `/admin` - Requires Admin role (can be added later)

## 📦 API Routes

### Authentication
- `POST /api/auth/signup` - Create new account
- `POST /api/auth/[...nextauth]` - NextAuth endpoints

### Products (Now using Upstash)
- `GET /api/cosmetics` - Get all products from Upstash
- `GET /api/product/[id]` - Get single product from Upstash
- `POST /api/search` - Vector search in Upstash
- `POST /api/chat` - AI chat with product recommendations from Upstash
- `POST /api/portal/upload` - Upload products (requires auth)

## 🛠️ Development Commands

```bash
# Start dev server
npm run dev

# Seed products to Upstash
npm run db:seed-products

# Open Prisma Studio (database GUI)
npm run db:studio

# Run migrations
npm run db:migrate

# Clear Upstash
npm run db:clear
```

## 🗄️ Database Schema

### User
```prisma
- id: String (unique identifier)
- email: String (unique)
- password: String (hashed with bcryptjs)
- name: String
- role: UserRole (CUSTOMER | VENDOR | ADMIN)
- createdAt: DateTime
- updatedAt: DateTime
```

### Products in Upstash
Products are now stored as vectors with metadata including:
- Product name, brand, category
- Price, rating, reviews
- Skin type, size, ingredients
- Image URL
- Full product description for AI context

## 🔄 Migration Notes

All local JSON data fetching has been removed from:
- ✅ `/api/cosmetics` - Now fetches from Upstash
- ✅ `/api/product/[id]` - Now fetches from Upstash
- ✅ `/api/search` - Now uses vector similarity
- ✅ `/api/chat` - Now recommendations from Upstash
- ✅ `/portal/upload` - Now requires authentication

## 🆘 Troubleshooting

### Database Issues
```bash
# Reset database (MongoDB)
npx prisma migrate reset
npx prisma db push
```

### Upstash Connection
- Verify `UPSTASH_VECTOR_REST_URL` and `UPSTASH_VECTOR_REST_TOKEN` are set
- Check Upstash dashboard for active index
- Run seeding script to populate products

### NextAuth Issues
- Ensure `NEXTAUTH_SECRET` is set (generate random string)
- Verify `NEXTAUTH_URL` matches your deployment URL
- Check `/api/auth/signin` and `/api/auth/callback` routes exist

## 📚 Key Files Modified

- `src/lib/auth.ts` - NextAuth configuration
- `src/app/api/auth/[...nextauth]/route.ts` - Auth endpoints
- `src/app/auth/login/page.tsx` - Login page
- `src/app/auth/signup/page.tsx` - Signup page
- `src/middleware.ts` - Protected routes
- `src/components/headers/topbar.tsx` - Auth UI in header
- `src/app/layout.tsx` - Added SessionProvider
- `src/lib/vector/upstash.ts` - Product functions
- All API routes - Updated to use Upstash

## 🎯 Next Steps

1. Set up environment variables
2. Initialize database with Prisma
3. Seed products to Upstash
4. Create a test account
5. Test vendor portal upload
6. Verify product search and recommendations work
