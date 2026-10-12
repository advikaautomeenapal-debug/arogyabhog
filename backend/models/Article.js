const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema({
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
  hindiTitle: { 
    type: String, 
    default: '', 
    trim: true 
  },
  summary: { 
    type: String, 
    required: true, 
    trim: true 
  },
  content: { 
    type: String, 
    required: true 
  },
  category: { 
    type: String, 
    default: 'Nutrition Insights', 
    trim: true 
  },
  readTime: { 
    type: String, 
    default: '3 min read', 
    trim: true 
  },
  featuredImage: { 
    type: String, 
    default: '' 
  },
  seoTitle: { 
    type: String, 
    default: '', 
    trim: true 
  },
  metaDescription: { 
    type: String, 
    default: '', 
    trim: true 
  },
  relatedProductSlug: { 
    type: String, 
    default: 'everyday-soft-multigrain-atta', 
    trim: true 
  },
  disclaimer: { 
    type: String, 
    default: '', 
    trim: true 
  },
  status: { 
    type: String, 
    enum: ['draft', 'published', 'archived'], 
    default: 'published' 
  },
  isPublished: { 
    type: Boolean, 
    default: true 
  },
  author: { 
    type: String, 
    default: 'Arogya Bhog Editorial', 
    trim: true 
  },
  keywords: {
    type: [String],
    default: []
  },
  displayOrder: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

// Ensure isPublished is synced with status
articleSchema.pre('save', function(next) {
  if (this.status === 'published') {
    this.isPublished = true;
  } else {
    this.isPublished = false;
  }
  next();
});

module.exports = mongoose.model('Article', articleSchema);
