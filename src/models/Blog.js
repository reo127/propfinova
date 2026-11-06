import mongoose from 'mongoose';

const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  excerpt: {
    type: String,
    required: true,
    maxlength: 300
  },
  featuredImage: {
    type: String, // URL or file path
    default: null
  },
  categories: [{
    type: String,
    trim: true
  }],
  tags: [{
    type: String,
    trim: true
  }],
  // SEO Metadata
  seo: {
    metaTitle: {
      type: String,
      required: true,
      maxlength: 60
    },
    metaDescription: {
      type: String,
      required: true,
      maxlength: 160
    },
    keywords: [{
      type: String,
      trim: true
    }],
    canonicalUrl: String
  },
  // Publication status
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  publishedAt: {
    type: Date,
    default: null
  },
  // Author info
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Analytics
  views: {
    type: Number,
    default: 0
  },
  // Reading time estimation (in minutes)
  readingTime: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for better search performance
blogSchema.index({ title: 'text', content: 'text', 'seo.keywords': 'text' });
blogSchema.index({ status: 1, publishedAt: -1 });
blogSchema.index({ categories: 1 });
blogSchema.index({ tags: 1 });

// Pre-save middleware to calculate reading time
blogSchema.pre('save', function(next) {
  if (this.isModified('content')) {
    const wordsPerMinute = 200;
    const wordCount = this.content.split(/\s+/).length;
    this.readingTime = Math.ceil(wordCount / wordsPerMinute);
  }
  
  // Set publishedAt when status changes to published
  if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  
  next();
});

// Virtual for formatted published date
blogSchema.virtual('formattedPublishedDate').get(function() {
  if (this.publishedAt) {
    return this.publishedAt.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
  return null;
});

// Method to increment views
blogSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

// Static method to get published blogs
blogSchema.statics.getPublishedBlogs = function(limit = 10, skip = 0, category = null) {
  const query = { status: 'published' };
  if (category) {
    query.categories = { $in: [category] };
  }
  
  return this.find(query)
    .populate('author', 'name email')
    .sort({ publishedAt: -1 })
    .limit(limit)
    .skip(skip)
    .select('-content'); // Exclude full content for listing
};

// Static method to get related blogs
blogSchema.statics.getRelatedBlogs = function(blogId, categories, limit = 3) {
  return this.find({
    _id: { $ne: blogId },
    status: 'published',
    categories: { $in: categories }
  })
    .populate('author', 'name email')
    .sort({ publishedAt: -1 })
    .limit(limit)
    .select('title slug excerpt featuredImage publishedAt readingTime');
};

const Blog = mongoose.models.Blog || mongoose.model('Blog', blogSchema);

export default Blog;