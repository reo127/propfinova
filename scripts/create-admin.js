const dns = require('dns');
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// Read MONGODB_URI from .env.local if not in process.env
let mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
  const envPath = path.resolve(__dirname, '../.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/MONGODB_URI=["']?([^"'\r\n]+)["']?/);
    if (match) {
      mongoUri = match[1];
    }
  }
}

if (!mongoUri) {
  console.error('❌ MONGODB_URI not found in process.env or .env.local');
  process.exit(1);
}

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
    select: false,
  },
  role: {
    type: String,
    enum: ['user', 'builder', 'admin', 'agent'],
    default: 'user',
  },
  phone: {
    type: String,
    default: null,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  assignedLeadsCount: {
    type: Number,
    default: 0,
  },
  completedLeadsCount: {
    type: Number,
    default: 0,
  },
  lastActiveAt: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function createAdmin() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB successfully.');

    const adminEmail = process.argv[2] || 'admin@propfinova.com';
    const plainPassword = process.argv[3] || 'propfinova@123';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(plainPassword, salt);

    const existingUser = await User.findOne({ email: adminEmail });

    if (existingUser) {
      console.log(`ℹ️ User with email "${adminEmail}" already exists. Updating to admin role and updating password...`);
      existingUser.password = hashedPassword;
      existingUser.role = 'admin';
      existingUser.isActive = true;
      if (!existingUser.name) {
        existingUser.name = 'Admin';
      }
      await existingUser.save();
      console.log('✅ Existing user successfully updated to Admin!');
    } else {
      console.log(`Creating new Admin user with email "${adminEmail}"...`);
      const newAdmin = new User({
        name: 'Admin',
        email: adminEmail,
        password: hashedPassword,
        role: 'admin',
        isActive: true,
      });
      await newAdmin.save();
      console.log('✅ New Admin user created successfully!');
    }

    // Verify login
    const verifyUser = await User.findOne({ email: adminEmail }).select('+password');
    const isMatch = await bcrypt.compare(plainPassword, verifyUser.password);
    console.log(`🔍 Password verification test: ${isMatch ? 'PASSED ✅' : 'FAILED ❌'}`);
    console.log(`👤 User Details:`);
    console.log(`   - Name: ${verifyUser.name}`);
    console.log(`   - Email: ${verifyUser.email}`);
    console.log(`   - Role: ${verifyUser.role}`);
    console.log(`   - Active: ${verifyUser.isActive}`);

    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB.');
  } catch (error) {
    console.error('❌ Error creating/updating admin user:', error);
    process.exit(1);
  }
}

createAdmin();
