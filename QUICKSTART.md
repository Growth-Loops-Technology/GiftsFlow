# 🚀 Quick Start Checklist

Follow these steps to get GiftsFlow running with authentication and Upstash:

## Step 1: Environment Setup ⚙️

```bash
# Create environment file
cp .env.local.example .env.local
```

Edit `.env.local` and add:
- `NEXTAUTH_SECRET` - Generate a random string: `openssl rand -base64 32`
- `UPSTASH_VECTOR_REST_URL` - From your Upstash dashboard
- `UPSTASH_VECTOR_REST_TOKEN` - From your Upstash dashboard
- `OPENAI_API_KEY` - From your OpenAI account
- `DATABASE_URL` - Configure your MongoDB connection string

## Step 2: Database Initialization 🗄️

```bash
# Generate Prisma client
npx prisma generate

# Push schema to MongoDB
npx prisma db push
```

## Step 3: Seed Products to Upstash 📦

```bash
# This moves all products from local JSON to Upstash Vector DB
npm run db:seed-products
```

**Wait for completion** - You should see:
```
🌱 Starting to seed products from local JSON to Upstash...
📦 Found X products to seed
✅ All products seeded successfully!
```

## Step 4: Start Development Server 🏃

```bash
npm run dev
```

Visit: **http://localhost:3000**

## Step 5: Test Authentication ✅

### Create a Test Customer Account
1. Click "Sign Up" button
2. Select "Customer" as account type
3. Fill in details and create account
4. You'll see a success message and redirect to login

### Login
1. Click "Sign In" with your new account
2. You should see your name in the header with a user menu

### Create a Vendor Account (to test upload)
1. Sign out
2. Sign up again as "Vendor" 
3. Login with vendor account
4. You should now see "For Vendors" link in header
5. Click it to access `/portal` upload page

## Step 6: Test Product Features 🎁

### Browse Products
- Go to `/cosmetics` to see all products from Upstash

### Search Products
- Use the search functionality to discover products via vector similarity

### AI Chat Recommendations
- Go to `/gifts` and chat with the AI
- Ask about products - it will recommend from Upstash database

### Upload as Vendor
- Login as vendor
- Go to `/portal`
- Download sample Excel file
- Upload to see products indexed in Upstash

## Troubleshooting 🔧

### Database Issues
```bash
# Reset database (careful - deletes your users!)
# For MongoDB, use: npx prisma migrate reset
npx prisma db push
```

### Prisma Studio (GUI for database)
```bash
npm run db:studio
```

### Build Errors
```bash
# Clean build
rm -rf .next
npm run build
```

### Products Not Showing
- Make sure you ran `npm run db:seed-products`
- Check Upstash dashboard to confirm vectors exist
- Verify `UPSTASH_VECTOR_REST_URL` and `UPSTASH_VECTOR_REST_TOKEN` are correct

## Key Files to Know

| File | Purpose |
|------|---------|
| `src/lib/auth.ts` | NextAuth configuration |
| `src/app/auth/` | Login/signup pages |
| `src/middleware.ts` | Route protection |
| `prisma/schema.prisma` | Database schema |
| `src/lib/vector/upstash.ts` | Product functions |
| `.env.local` | Your secrets (keep private!) |

## Commands Cheat Sheet

```bash
# Development
npm run dev              # Start dev server

# Database
npm run db:migrate       # Run migrations
npm run db:push         # Push schema to database  
npm run db:studio       # Open database GUI
npm run db:seed-products # Seed products to Upstash

# Building
npm run build           # Build for production
npm start              # Start production server

# Code Quality
npm run lint           # Run eslint
```

## 🎉 You're All Set!

Your GiftsFlow app now has:
- ✅ User authentication (3 role types)
- ✅ Secure login/signup
- ✅ Protected vendor portal
- ✅ Products from Upstash database
- ✅ AI recommendations from vector search
- ✅ Admin controls available to admins

## 📖 More Info

- Read `SETUP_GUIDE.md` for detailed setup
- Read `IMPLEMENTATION_SUMMARY.md` for what was added
- Check `README.md` for project overview

Happy coding! 🚀
