// Script to check and approve properties in the database
const mongoose = require('mongoose');

// MongoDB connection string from .env.local
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://rohan:kankimagi@cluster0.ecwot4i.mongodb.net/reslestate?retryWrites=true&w=majority&appName=Cluster0';

// Property Schema (simplified)
const PropertySchema = new mongoose.Schema({
  title: String,
  location: String,
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'approved'
  },
  createdAt: Date
}, { collection: 'properties' });

const Property = mongoose.models.Property || mongoose.model('Property', PropertySchema);

async function checkAndApproveProperties() {
  try {
    console.log('🔌 Connecting to MongoDB...\n');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all properties
    const allProperties = await Property.find({}).select('_id title location status createdAt');
    console.log(`📊 Total properties in database: ${allProperties.length}\n`);

    if (allProperties.length === 0) {
      console.log('⚠️  No properties found in database!\n');
      await mongoose.disconnect();
      return;
    }

    // Count by status
    const statusCount = {
      approved: 0,
      pending: 0,
      rejected: 0,
      noStatus: 0
    };

    allProperties.forEach(prop => {
      if (!prop.status) {
        statusCount.noStatus++;
      } else {
        statusCount[prop.status]++;
      }
    });

    console.log('📈 Property Status Breakdown:');
    console.log(`   ✅ Approved: ${statusCount.approved}`);
    console.log(`   ⏳ Pending: ${statusCount.pending}`);
    console.log(`   ❌ Rejected: ${statusCount.rejected}`);
    console.log(`   ⚠️  No Status: ${statusCount.noStatus}\n`);

    // Show sample properties
    console.log('📝 Sample Properties:');
    allProperties.slice(0, 5).forEach((prop, index) => {
      console.log(`   ${index + 1}. ${prop.title?.substring(0, 50) || 'No title'}`);
      console.log(`      Status: ${prop.status || 'NO STATUS'}`);
      console.log(`      Location: ${prop.location || 'N/A'}`);
      console.log(`      ID: ${prop._id}\n`);
    });

    // Approve properties that need approval
    const needsApproval = allProperties.filter(p => p.status === 'pending' || !p.status);

    if (needsApproval.length > 0) {
      console.log(`\n🔄 Approving ${needsApproval.length} properties...\n`);

      const result = await Property.updateMany(
        {
          $or: [
            { status: 'pending' },
            { status: { $exists: false } },
            { status: null }
          ]
        },
        { $set: { status: 'approved' } }
      );

      console.log(`✅ Successfully approved ${result.modifiedCount} properties!\n`);
    } else {
      console.log('✅ All properties are already approved!\n');
    }

    // Verify final count
    const approvedCount = await Property.countDocuments({ status: 'approved' });
    console.log(`\n🎉 Final Count: ${approvedCount} approved properties`);
    console.log('   These will now appear in your sitemap!\n');

    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');

  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

checkAndApproveProperties();
