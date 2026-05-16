import mongoose from 'mongoose';
import path from 'path';
import dotenv from 'dotenv';
import dns from 'node:dns';

dotenv.config({ path: path.join(process.cwd(), 'backend', '.env') });

if (process.env.MONGODB_URI && process.env.MONGODB_URI.startsWith("mongodb+srv://")) {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
}
import User from './backend/src/models/User.js';

async function makeAdmin() {
  const email = process.argv[2];
  
  if (!email) {
    console.error('Please provide an email. Usage: node makeAdmin.js your@email.com');
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const result = await User.updateOne({ email: email.toLowerCase() }, { role: 'admin' });
    
    if (result.matchedCount === 0) {
      console.error(`No user found with email: ${email}`);
    } else {
      console.log(`Success! User ${email} is now an admin.`);
    }
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit();
  }
}

makeAdmin();
