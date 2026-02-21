# 🔐 Google OAuth & Database Setup Guide

## Part 1: Setting Up Google OAuth

### Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a Project" → "New Project"
3. Enter project name (e.g., "GiftsFlow")
4. Click "Create"

### Step 2: Enable OAuth 2.0 Consent Screen

1. In Google Cloud Console, go to **APIs & Services**
2. Click **OAuth consent screen** (left sidebar)
3. Choose **External** user type
4. Click **Create**
5. Fill in the form:
   - **App name**: GiftsFlow
   - **User support email**: your-email@gmail.com
   - **Developer contact**: your-email@gmail.com
   - Click **Save and Continue**
6. For **Scopes**: Click **Save and Continue** (defaults are fine)
7. For **Test users**: Add your email address
8. Review and **Back to Dashboard**

### Step 3: Create OAuth 2.0 Credentials

1. Go to **Credentials** in left sidebar
2. Click **+ Create Credentials** → **OAuth client ID**
3. Choose **Web application**
4. Under "Authorized JavaScript origins", add:
   ```
   http://localhost:3000
   https://yourdomain.com (for production)
   ```
5. Under "Authorized redirect URIs", add:
   ```
   http://localhost:3000/api/auth/callback/google
   https://yourdomain.com/api/auth/callback/google
   ```
6. Click **Create**
7. Copy the **Client ID** and **Client Secret**

### Step 4: Add to Environment Variables

In `.env.local`:
```env
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
```

### Testing Google OAuth

1. Run: `npm run dev`
2. Go to `http://localhost:3000/auth/login`
3. Click "Sign In with Google"
4. You should see the Google login flow
5. After login, user is created in database automatically!

---

## Part 2: Database Connection & User Storage

### How the Database Works

GiftsFlow uses **MongoDB** with **Prisma** ORM to manage data.

#### Architecture:
```
┌─────────────────────────────────────────────┐
│        Your Next.js Application             │
└────────────────────┬────────────────────────┘
                     │
         ┌───────────▼────────────────┐
         │   Prisma ORM              │
         │   (Query Builder)         │
         └───────────┬────────────────┘
                     │
         ┌───────────▼────────────────┐
         │   MongoDB Database        │
         │   (Cloud or Local)        │
         └───────────────────────────┘
```

### Database Schema

When a user signs up or logs in with Google, here's what gets stored:

**User Table:**
```sql
CREATE TABLE "User" (
  id          String    PRIMARY KEY
  email       String    UNIQUE NOT NULL
  password    String?   -- NULL for Google users
  name        String    NOT NULL
  role        String    DEFAULT "CUSTOMER"  -- CUSTOMER, VENDOR, ADMIN
  createdAt   DateTime  DEFAULT now()
  updatedAt   DateTime  DEFAULT now()
)
```

**Account Table (for OAuth):**
```sql
CREATE TABLE "Account" (
  id                  String PRIMARY KEY
  userId              String FOREIGN KEY
  provider            String (google, credentials, etc)
  providerAccountId   String
  accessToken         String?
  expires_at          Int?
  -- Links OAuth provider to user
)
```

**Session Table:**
```sql
CREATE TABLE "Session" (
  id          String PRIMARY KEY
  userId      String FOREIGN KEY
  sessionToken String UNIQUE
  expires     DateTime
  -- Stores user sessions
)
```

### Step-by-Step: User Registration Flow

#### Email/Password Sign Up:
```
1. User fills form & clicks "Sign Up"
   ↓
2. POST /api/auth/signup with { email, password, name, role }
   ↓
3. Hash password with bcryptjs
   ↓
4. INSERT into User table
   ↓
5. User created with HASHED password (plain password never stored!)
   ↓
6. Redirect to login
```

#### Google OAuth Sign Up:
```
1. User clicks "Sign In with Google"
   ↓
2. Redirected to Google login
   ↓
3. Google authenticates user
   ↓
4. Google redirects back with authorization code
   ↓
5. NextAuth exchanges code for access token
   ↓
6. NextAuth fetches user profile from Google
   ↓
7. CHECK: Does user exist in database?
   ├─ YES: Log in existing user
   └─ NO: Create new user (automatic with PrismaAdapter)
        ├─ INSERT into User table (from Google profile)
        ├─ INSERT into Account table (link Google oauth)
        ├─ Set role = "CUSTOMER" (default)
        └─ CREATE Session
   ↓
8. User logged in, jwt token created
```

### Database File Location

```
GiftsFlow/
├── [MongoDB Atlas]  ← Your cloud database (MongoDB)
├── src/
├── prisma/
│   └── schema.prisma   ← Schema definition
└── node_modules/
```

**Important**: Collections are created automatically when you run:
```bash
npx prisma db push
```

### Viewing Your Database

#### Option 1: Prisma Studio (GUI)
```bash
npm run db:studio
```
Opens at `http://localhost:5555` - visually manage your database!

#### Option 2: MongoDB Tools
MongoDB can be accessed with:
- **MongoDB Atlas UI** (Web-based dashboard)
- **MongoDB Compass** (Desktop tool - free)
- **mongosh** (Command line): `mongosh "mongodb://localhost:27017/giftsflow"`

### Code Flow: How Users Are Stored

**1. User Signs In → JWT Created:**
```typescript
// src/lib/auth.ts
callbacks: {
  async jwt({ token, user }) {
    if (user) {
      token.id = user.id          // Store user ID in token
      token.role = user.role      // Store role
    }
    return token
  }
}
```

**2. Session Includes User Info:**
```typescript
// /api/auth/[...nextauth]/route.ts
async session({ session, token }) {
  session.user.id = token.id      // Add to session
  session.user.role = token.role  // Use throughout app
  return session
}
```

**3. Access User in Components:**
```typescript
// Any client component
import { useSession } from "next-auth/react";

export function MyComponent() {
  const { data: session } = useSession();
  
  console.log(session.user.id)      // User ID
  console.log(session.user.email)   // Email
  console.log(session.user.name)    // Name
  console.log(session.user.role)    // Role
}
```

**4. Access User in Server:**
```typescript
// src/app/api/some-endpoint/route.ts
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const userId = session.user.id
  const userRole = session.user.role
  // ... use userId/userRole
}
```

---

## Part 3: Working with User Data

### Add Custom Fields to User

To store additional user info (phone, address, etc):

1. **Update Prisma Schema:**
```prisma
// prisma/schema.prisma
model User {
  id        String     @id @default(cuid())
  email     String     @unique
  password  String?
  name      String
  phone     String?           // NEW
  address   String?           // NEW
  role      UserRole   @default(CUSTOMER)
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt
  
  accounts  Account[]
  sessions  Session[]
  
  @@index([email])
}
```

2. **Create Migration:**
```bash
npx prisma migrate dev --name add_phone_address
```

3. **Use in Code:**
```typescript
// Create user
const user = await prisma.user.create({
  data: {
    email: "user@example.com",
    name: "John Doe",
    phone: "+1-234-567-8900",    // NEW
    address: "123 Main St",        // NEW
    password: hashedPassword,
    role: "CUSTOMER"
  }
})

// Update user
await prisma.user.update({
  where: { id: userId },
  data: {
    phone: "+1-999-999-9999"
  }
})

// Read user data
const user = await prisma.user.findUnique({
  where: { id: userId }
})
console.log(user.phone)
```

### Query Examples

```typescript
import { prisma } from "@/lib/prisma";

// Find user by email
const user = await prisma.user.findUnique({
  where: { email: "user@example.com" }
});

// Find user by ID
const user = await prisma.user.findUnique({
  where: { id: "user-id" }
});

// Get all vendors
const vendors = await prisma.user.findMany({
  where: { role: "VENDOR" }
});

// Get all admins
const admins = await prisma.user.findMany({
  where: { role: "ADMIN" }
});

// Count users by role
const stats = await prisma.user.groupBy({
  by: ['role'],
  _count: true
});

// Delete user (careful!)
await prisma.user.delete({
  where: { id: userId }
});
```

---

## Part 4: Security Best Practices

### Password Hashing
✅ **GiftsFlow does this automatically**
```typescript
import bcryptjs from 'bcryptjs';

// When user signs up
const hashedPassword = await bcrypt.hash(password, 10);

// When user logs in
const isValid = await bcrypt.compare(plainPassword, hashedPassword);
```

### Token Security
- **JWT Tokens**: Signed with `NEXTAUTH_SECRET`
- **Session Expiry**: 30 days (configurable)
- **Secure Cookies**: Automatically set in production

### OAuth Security
✅ **NextAuth.js handles:**
- PKCE (Proof Key for Code Exchange)
- CSRF protection
- Secure state validation
- Token refresh

### Never Do This:
```typescript
// ❌ WRONG - Stores plain password!
await prisma.user.create({
  data: {
    email: user.email,
    password: user.password  // BAD!
  }
})

// ❌ WRONG - Exposes secrets!
console.log(process.env.GOOGLE_CLIENT_SECRET)

// ❌ WRONG - Stores token on client!
localStorage.setItem('token', jwtToken)
```

### Do This Instead:
```typescript
// ✅ RIGHT - Hash password
const hashedPassword = await bcrypt.hash(password, 10);
await prisma.user.create({
  data: {
    email: user.email,
    password: hashedPassword  // GOOD!
  }
})

// ✅ RIGHT - Use server-side sessions
// Session automatically managed by NextAuth

// ✅ RIGHT - Secrets in env variables only
// Access via: process.env.GOOGLE_CLIENT_SECRET
```

---

## Part 5: Testing Your Setup

### Test Email Signup:
1. Go to `/auth/signup`
2. Enter: email, password, name, role
3. Click "Sign Up with Email"
4. You get success message
5. Go to `/auth/login` with same email/password
6. Should log in successfully

### Test Google OAuth:
1. Go to `/auth/login` or `/auth/signup`
2. Click "Sign In with Google"
3. Login with your Google account
4. Should redirect to home page, logged in
5. Check header - your name should appear

### Check Database:
```bash
npm run db:studio
```
- Browse "User" table
- Should see your test records
- Email/password users have hashed password
- Google users have NULL password

### Verify Session:
Add to any page:
```typescript
'use client';
import { useSession } from 'next-auth/react';

export default function TestPage() {
  const { data: session } = useSession();
  
  return (
    <pre>{JSON.stringify(session, null, 2)}</pre>
  );
}
```

---

## Troubleshooting

### "Google login not working"
- Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env.local`
- Check redirect URIs match in Google Console
- Ensure app is on test users list in Google Cloud

### "User not being created"
- Run: `npx prisma db push` to migrate schema
- Check MongoDB connection string is valid
- Look at console for error messages

### "Session not persisting"
- Clear cookies in browser
- Make sure `NEXTAUTH_SECRET` is set
- Check if browser allows cookies

### "Forgot password or need to change role"
```bash
npm run db:studio
```
Then manually edit user record in table

---

## Production Deployment

### Before Deploying:

1. **Use MongoDB Atlas** (recommended for production)
   ```env
   # Use PostgreSQL instead
   DATABASE_URL="postgresql://user:password@host/db"
   ```

2. **Update Secrets**
   ```env
   NEXTAUTH_SECRET="generate-new-random-secret"
   NEXTAUTH_URL="https://yourdomain.com"
   GOOGLE_CLIENT_ID="prod-client-id"
   GOOGLE_CLIENT_SECRET="prod-client-secret"
   ```

3. **Add Redirect URIs to Google Console**
   ```
   https://yourdomain.com/api/auth/callback/google
   ```

4. **Run Migrations**
   ```bash
   npx prisma migrate deploy
   ```

---

## Summary

| Task | Command |
|------|---------|
| View database GUI | `npm run db:studio` |
| Apply schema changes | `npx prisma migrate dev` |
| Generate Prisma client | `npx prisma generate` |
| Reset database | `npx prisma migrate reset` |
| Check schema | `cat prisma/schema.prisma` |

Your users are now stored in MongoDB with Prisma, and you have both email/password AND Google OAuth working! 🎉
