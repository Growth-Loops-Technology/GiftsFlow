# MongoDB Setup Guide for GiftsFlow

## Overview
Your application has been configured to use MongoDB instead of SQLite. You have two options:

---

## Option 1: MongoDB Atlas (Recommended for Production)

### Step 1: Create MongoDB Atlas Account
1. Go to [mongodb.com/cloud/atlas](https://mongodb.com/cloud/atlas)
2. Sign up for a free account
3. Create a new project (e.g., "GiftsFlow")

### Step 2: Create a Cluster
1. Click "Build a Database"
2. Select "M0 Free" tier (Free forever)
3. Choose your cloud provider (AWS/Google Cloud/Azure) and region
4. Create cluster (takes 1-3 minutes)

### Step 3: Set Up Security
1. Go to "Database Access"
2. Click "Add New Database User"
3. Create username and password
   - Username: `giftsflow_user`
   - Password: Use a strong password
4. Grant role: "Atlas admin"
5. Click "Add User"

### Step 4: Allow Network Access
1. Go to "Network Access"
2. Click "Add IP Address"
3. Choose "Allow access from anywhere" (or specify your IP for security)
4. Confirm

### Step 5: Get Connection String
1. Go to "Databases"
2. Click "Connect" on your cluster
3. Select "Drivers"
4. Copy the connection string
5. Replace `<username>` and `<password>` with your credentials

Example:
```
mongodb+srv://giftsflow_user:YOUR_PASSWORD@cluster0.mongodb.net/giftsflow?retryWrites=true&w=majority
```

### Step 6: Update .env.local
```
DATABASE_URL="mongodb+srv://giftsflow_user:YOUR_PASSWORD@cluster0.mongodb.net/giftsflow?retryWrites=true&w=majority"
```

---

## Option 2: Local MongoDB (Development)

### On macOS:
```bash
# Install MongoDB using Homebrew
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB service
brew services start mongodb-community

# Verify it's running
mongosh  # Should connect to mongodb://localhost:27017
```

### On Windows:
1. Download MongoDB Community: [mongodb.com/try/download/community](https://mongodb.com/try/download/community)
2. Run the installer
3. MongoDB will start automatically as a service

### On Linux:
```bash
# Ubuntu/Debian
sudo apt-get install -y mongodb

# Start MongoDB
sudo systemctl start mongodb
sudo systemctl enable mongodb
```

### Update .env.local
```
DATABASE_URL="mongodb://localhost:27017/giftsflow"
```

---

## Step 3: Initialize Database Schema

After setting up your MongoDB connection:

```bash
# Generate Prisma client and run migrations
npm run db:migrate

# Or use this to create the schema
npx prisma db push
```

---

## Step 4: Verify Connection

Test your MongoDB connection:
```bash
# Open Prisma Studio
npm run db:studio

# You should see your User, Account, Session, and VerificationToken collections
```

---

## Troubleshooting

### Connection Refused Error
- **Local MongoDB**: Make sure MongoDB is running (`brew services start mongodb-community`)
- **MongoDB Atlas**: Check your IP whitelist in Network Access

### Authentication Failed Error
- Verify username and password are correct
- Check that special characters in password are URL encoded
  - Example: `@` becomes `%40`, `#` becomes `%23`

### Database Not Found
- The database will be created automatically when you first connect
- Make sure your connection string includes the database name (`/giftsflow`)

---

## Comparison: SQLite vs MongoDB

| Feature | SQLite | MongoDB |
|---------|--------|---------|
| **Setup** | ✅ Zero config | ⚠️ Requires external service |
| **Scale** | ❌ Single file | ✅ Horizontal scaling |
| **Cloud** | ❌ File-based | ✅ Managed cloud option |
| **Real-time** | ❌ No | ✅ Change streams |
| **Flexibility** | ❌ Fixed schema | ✅ Flexible schema |

---

## Next Steps

1. Choose setup option (Atlas or Local)
2. Set up your MongoDB instance
3. Update `DATABASE_URL` in `.env.local`
4. Run `npm run db:migrate`
5. Test with `npm run db:studio`
6. Start development: `npm run dev`

---

## API Changes
None! Your authentication APIs remain the same. Prisma handles the database differences automatically.

- `/api/auth/signup` - Creates users in MongoDB
- `/api/auth/login` - Queries MongoDB
- `/api/auth/[...nextauth]` - Sessions stored in MongoDB
