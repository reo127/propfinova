import mongoose from 'mongoose';

// Singleton document — only one hero image exists at a time.
const heroImageSchema = new mongoose.Schema({
  image: {
    type: String,
    required: true
  },
  alt: {
    type: String,
    trim: true,
    default: ''
  },
  statLabel: {
    type: String,
    trim: true,
    default: 'Across six cities, right now'
  },
  statValue: {
    type: String,
    trim: true,
    default: 'New listings added weekly'
  },
  topCities: {
    type: [String],
    default: ["Bangalore", "Mumbai", "Pune", "Hyderabad", "Chennai", "Delhi NCR"]
  },
  aboutImage: {
    type: String,
    trim: true,
    default: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1920&h=600&fit=crop&crop=center'
  },
  aboutTitle: {
    type: String,
    trim: true,
    default: 'About *PropFinova*'
  },
  aboutSubtitle: {
    type: String,
    trim: true,
    default: 'Your trusted partner in real estate excellence, connecting dreams with reality since our inception.'
  },
  popularLocalities: {
    type: [String],
    default: [
      "Whitefield, Bengaluru",
      "Baner, Pune",
      "Andheri, Mumbai",
      "Gachibowli, Hyderabad",
      "Noida Sector 150",
      "Velachery, Chennai"
    ]
  }
}, {
  timestamps: true
});

const HeroImage = mongoose.models.HeroImage || mongoose.model('HeroImage', heroImageSchema);

export default HeroImage;
