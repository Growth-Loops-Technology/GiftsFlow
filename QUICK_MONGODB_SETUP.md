# ⚡ Quick MongoDB Setup (Choose One)

## Option 1: MongoDB Atlas (Recommended - No Installation)

**Time: 5 minutes**
**Cost: FREE forever (M0 tier)**

### Steps:
1. Go to: https://www.mongodb.com/cloud/atlas
2. Sign up for free
3. Create a free cluster (M0)
4. Get connection string: `mongodb+srv://username:password@cluster.mongodb.net/giftsflow?retryWrites=true&w=majority`
5. Update `.env.local`:
   ```
   DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/giftsflow?retryWrites=true&w=majority"
   ```
6. Run:
   ```bash
   npx prisma db push
   npm run dev
   ```

**✅ This is the easiest option and works immediately**

---

## Option 2: Docker (Recommended - Local Development)

**Time: 2 minutes**
**Cost: FREE**

Make sure you have Docker installed, then:

```bash
# Start MongoDB in Docker
docker run -d --name giftsflow-mongodb -p 27017:27017 mongo:latest

# That's it! MongoDB is now running at mongodb://localhost:27017/giftsflow
```

Then:
```bash
npx prisma db push
npm run dev
```

To stop MongoDB:
```bash
docker stop giftsflow-mongodb
```

To start it again:
```bash
docker start giftsflow-mongodb
```

---

## Option 3: Manual Installation (Advanced)

### macOS:
```bash
# Install MongoDB
brew install mongodb-community@7.0

# Start service
brew services start mongodb-community@7.0

# Verify
mongosh
```

### Windows:
1. Download: https://www.mongodb.com/try/download/community
2. Run installer
3. MongoDB starts automatically

### Linux:
```bash
sudo apt-get update
sudo apt-get install -y mongodb
sudo systemctl start mongodb
```

---

## Verify Your Setup

Once MongoDB is running:

```bash
# Initialize database schema
npx prisma db push

# Open MongoDB UI
npm run db:studio

# You should see 4 collections:
# - User
# - Account
# - Session
# - VerificationToken
```

---

## Current Status

You have successfully:
✅ Switched from SQLite to MongoDB
✅ Updated Prisma schema  
✅ Generated Prisma client
✅ Ready for database initialization

**Next: Choose an option above and set up MongoDB, then run `.env.local` setup**

---

## Need Help?

- **MongoDB Atlas stuck?** Check: https://docs.mongodb.com/manual/administration/security-checklist/
- **Docker not working?** Ensure Docker Desktop is running
- **Connection refused?** MongoDB service isn't running - start it with the commands above
