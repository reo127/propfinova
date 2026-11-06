import mongoose from 'mongoose';

const bannerSchema = new mongoose.Schema({
  image: {
    type: String,
    required: true
  },
  title: {
    type: String,
    trim: true,
    default: ''
  },
  subtitle: {
    type: String,
    trim: true,
    default: ''
  },
  link: {
    type: String,
    trim: true,
    default: ''
  },
  alt: {
    type: String,
    trim: true,
    default: ''
  }
}, {
  timestamps: true
});

const Banner = mongoose.models.Banner || mongoose.model('Banner', bannerSchema);

export default Banner;
