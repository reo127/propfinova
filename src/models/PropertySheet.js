import mongoose from 'mongoose';

const PropertySheetSchema = new mongoose.Schema({
  builderName: {
    type: String,
    required: true,
    trim: true
  },
  projectName: {
    type: String,
    required: true,
    trim: true
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  projectDetails: {
    type: String,
    trim: true
  },
  configuration: {
    type: String,
    trim: true
  },
  carpetArea: {
    type: String,
    trim: true
  },
  superbuiltArea: {
    type: String,
    trim: true
  },
  price: {
    type: String,
    trim: true
  },
  launchDate: {
    type: String,
    trim: true
  },
  possessionDate: {
    type: String,
    trim: true
  },
  amenities: {
    type: String,
    trim: true
  },
  uspsHighlights: {
    type: String,
    trim: true
  },
  locationAdvantage: {
    type: String,
    trim: true
  },
  offers: {
    type: String,
    trim: true
  },
  channelSalesContact: {
    type: String,
    trim: true
  },
  market: {
    type: String,
    trim: true
  },
  priceMin: {
    type: Number
  },
  priceMax: {
    type: Number
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster searches
PropertySheetSchema.index({ builderName: 1 });
PropertySheetSchema.index({ projectName: 1 });
PropertySheetSchema.index({ location: 1 });
PropertySheetSchema.index({ market: 1 });
PropertySheetSchema.index({ configuration: 1 });
PropertySheetSchema.index({ priceMin: 1, priceMax: 1 });

// Text index for full-text search
PropertySheetSchema.index({
  builderName: 'text',
  projectName: 'text',
  location: 'text',
  amenities: 'text',
  uspsHighlights: 'text',
  locationAdvantage: 'text'
});

const PropertySheet = mongoose.models.PropertySheet || mongoose.model('PropertySheet', PropertySheetSchema);

export default PropertySheet;
