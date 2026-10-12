const express = require('express');
const router = express.Router();
const Article = require('../models/Article');
const { protect, adminOnly, optionalAuth } = require('../middleware/authMiddleware');

// Initial seed articles from catalog
const DEFAULT_ARTICLES = [
  {
    title: 'What is Multigrain Atta? Health Benefits & Grain Composition',
    slug: 'what-is-multigrain-atta',
    hindiTitle: 'मल्टीग्रेन आटा क्या है? इसके फायदे और आवश्यक अनाज',
    category: 'Flour Basics',
    readTime: '3 min read',
    summary: 'A complete overview of how blending whole wheat with traditional millets, pulses, and seeds boosts daily dietary fibre, plant protein, and essential micronutrients.',
    content: `Multigrain atta is crafted by combining two or more distinct whole grains, ancient millets, and protein-dense pulses with traditional wheat. Unlike refined wheat flour which strips away the bran and germ, wholesome multigrain blends retain all three layers of the grain kernel: the fiber-rich outer bran, the nutrient-packed germ, and the starchy endosperm.\n\nWhen pulses like roasted Bengal gram (chana) and non-GMO soybean are blended with ancient millets such as Sorghum (jowar), Finger Millet (ragi), and Pearl Millet (bajra), the resulting flour provides a significantly broader spectrum of amino acids, minerals (iron, magnesium, zinc), and dietary fiber than single-grain flour alone.\n\nAt Arogya Bhog, every multigrain blend specifies the exact percentage of every grain on the packaging. Fresh stone milling without chemical bleaching or synthetic additives ensures that live grain oils, natural aroma, and natural enzymes are preserved in every batch.`,
    relatedProductSlug: 'everyday-soft-multigrain-atta',
    status: 'published',
    isPublished: true,
    keywords: ['मल्टीग्रेन आटा', 'मल्टीग्रेन आटा ऑनलाइन', 'Multigrain flour', 'Multigrain aata price']
  },
  {
    title: 'Whole Wheat Atta vs Multigrain Atta',
    slug: 'whole-wheat-vs-multigrain',
    hindiTitle: 'गेहूं का आटा बनाम मल्टीग्रेन आटा: कौन सा बेहतर है?',
    category: 'Flour Comparison',
    readTime: '4 min read',
    summary: 'Comparing single-grain whole wheat flour against scientifically balanced multigrain blends for daily digestion, roti texture, and metabolic energy.',
    content: `Single-grain whole wheat flour (such as MP Sharbati) has been the staple of North Indian households for generations because its natural gluten structure yields light, soft, and balloon-puffy rotis. However, single-grain wheat consists primarily of complex carbohydrates and modest fiber.\n\nMultigrain flour, by contrast, thoughtfully blends wheat with slow-digesting millets (jowar, ragi, bajra) and protein-rich legumes (chana, soybean). This changes the macronutrient profile: the glycemic response is moderated, total dietary fiber increases substantially (supporting healthy gut motility), and each roti delivers a denser spectrum of B-vitamins and bioavailable minerals.\n\nThe secret to an exceptional multigrain atta lies in recipe calibration. If too many dense millets are added without balance, rotis become dry and brittle. Arogya Bhog Everyday Soft Multigrain Atta is formulated with 75% Sharbati wheat and 25% nutrient-rich grains and seeds, giving you the elevated nutrition of 8 grains while maintaining the tender, soft rotis your family loves.`,
    relatedProductSlug: 'everyday-soft-multigrain-atta',
    status: 'published',
    isPublished: true,
    keywords: ['सबसे अच्छा आटा', 'अच्छा आटा कौन सा है', 'अच्छी क्वालिटी का आटा', 'देसी आटा']
  },
  {
    title: 'Understanding Protein and Fibre in Flour',
    slug: 'understanding-protein-and-fibre',
    hindiTitle: 'आटे में प्रोटीन और फाइबर की समझ',
    category: 'Nutrition Insights',
    readTime: '3 min read',
    summary: 'How plant-based pulses, roasted legumes, and whole grain brans contribute to daily muscle repair, sustained stamina, and digestive wellness.',
    content: `Proteins are the fundamental building blocks of human tissue, enzymes, and immune cells. For vegetarian and plant-focused diets, everyday rotis represent an ideal vehicle to fulfill daily protein requirements naturally without relying on artificial supplements.\n\nStandard commercial whole wheat contains approximately 10g to 11.5g of protein per 100g. By introducing 15% non-GMO roasted soybean and 12% roasted Bengal gram (chana) into the formulation, Arogya Bhog High Protein Atta elevates the protein concentration to an estimated 19.4g per 100g—an increase of over 70% in natural plant-based amino acids.\n\nSimultaneously, dietary fiber plays two critical roles: insoluble fiber from coarse bran stimulates natural peristalsis in the colon, while soluble beta-glucan fiber from barley and oats dissolves into a gel-like matrix that slows down carbohydrate absorption and feeds beneficial gut microflora.`,
    relatedProductSlug: 'high-protein-atta',
    status: 'published',
    isPublished: true,
    keywords: ['हाई प्रोटीन आटा', 'प्रोटीन वाला आटा', 'High protein atta', 'Protein-rich flour']
  },
  {
    title: 'How to Read an Atta Ingredient Label',
    slug: 'how-to-read-ingredient-label',
    hindiTitle: 'आटे के लेबल और सामग्री को कैसे समझें?',
    category: 'Consumer Awareness',
    readTime: '3 min read',
    summary: 'Essential guidelines for identifying genuine whole grain flours, avoiding hidden refined maida, and verifying chemical-free milling transparency.',
    content: `When purchasing packaged flour online or in stores, looking past promotional marketing claims to inspect the ingredient list is essential for health-conscious families:\n\n1. Look for Exact Percentages: Genuine artisanal millers disclose the exact percentage of every single grain in the blend (e.g., 50% Wheat, 15% Barley, 10% Chana). If a package lists "Multigrain" but does not declare the grain percentages, the millet or pulse content could be less than 2%.\n\n2. Check for Hidden Additives: Pure flour contains 100% whole grains and seeds. Look out for additives like Benzoyl Peroxide (chemical bleacher), Potassium Bromate, Potassium Iodate, or synthetic enzymes (fungal alpha-amylase) used to prolong shelf-life artificially.\n\n3. Milling Method & Freshness: Flours milled on high-speed industrial roller mills generate friction heat exceeding 70°C, which degrades delicate vitamin E and germ oils. Traditional low-RPM stone chakkis grind grains gently, preserving native nutrients.\n\nArogya Bhog stands for 100% label transparency: zero preservatives, zero chemical bleach, and complete recipe percentages published on every pack.`,
    relatedProductSlug: 'everyday-soft-multigrain-atta',
    status: 'published',
    isPublished: true,
    keywords: ['Atta ingredients', 'आटे की सामग्री और पोषण', 'Clean label atta', 'Zero maida atta']
  },
  {
    title: 'Understanding the Ingredients in Arogya Bhog Atta Blends',
    slug: 'understanding-arogyabhog-blends',
    hindiTitle: 'आरोग्य भोग आटा मिश्रणों की सामग्री और उनकी विशेषताएं',
    category: 'Product Guide',
    readTime: '4 min read',
    summary: 'A detailed breakdown of all verified formulations in the Arogya Bhog catalogue and how each is designed for specific dietary preferences.',
    content: `Arogya Bhog offers five doctor-calibrated formulations and one fully customizable bespoke grain blend, all stone-milled fresh against customer orders:\n\n• Everyday Soft Multigrain Atta: 75% Sharbati Wheat, 8% Chana, 5% Jau, 4% Soybean, 3% Jowar, 2% Ragi, 2% Bajra, 1% Alsi. Designed for soft rotis and daily family nourishment.\n• Sugar Care Atta: 50% Sharbati Wheat, 15% Barley (Jau), 10% Roasted Chana, 8% Jowar, 5% Soybean, 5% Ragi, 4% Bajra, 3% Alsi. A low-glycemic-index blend for sugar-conscious households.\n• Thyro Care Atta: 40% Amaranth (Rajgira), 25% Jowar, 15% Chana, 10% Ragi, 5% Chia Seeds, 5% Flax Seeds. A 100% wheat-free, mineral-dense formula.\n• High Protein Atta: 60% Sharbati Wheat, 15% Soybean, 12% Roasted Chana, 8% Jau, 3% Alsi, 2% Oats. Delivers ~19.4g natural plant protein per 100g.\n• Vitality Atta: 50% Wheat, 15% Chana, 10% Jau, 10% Ragi, 5% Oats, 3% Til, 3% Alsi, 2% Chia, 1% Methi, 1% Quinoa. A therapeutic 10-grain and seed wellness flour.\n• My Choice Atta: Custom formulation created by the customer from 18 grains, milled fresh in an exact 10 kg batch.`,
    relatedProductSlug: 'everyday-soft-multigrain-atta',
    status: 'published',
    isPublished: true,
    keywords: ['Arogya Bhog atta', 'Arogya Bhog products', 'Arogya Bhog multigrain atta']
  },
  {
    title: 'General Dietary Information for People Managing Thyroid Conditions',
    slug: 'thyroid-dietary-information',
    hindiTitle: 'थायराइड में सामान्य खानपान व आहार संबंधी जानकारी',
    category: 'Dietary Awareness',
    readTime: '4 min read',
    summary: 'A factual overview of trace minerals like selenium and zinc in ancient grains, dietary balance, and essential medical precautions.',
    content: `When managing thyroid conditions such as hypothyroidism, healthcare practitioners frequently recommend focusing on whole, unprocessed foods that supply essential micronutrients involved in metabolic energy.\n\nKey dietary considerations include:\n• Trace Minerals: Minerals such as selenium and zinc act as vital cofactors in human metabolic physiology. Whole grains like Amaranth (rajgira), pulses like Bengal gram, and seeds like Chia and Flaxseed naturally contain these trace elements in dietary forms.\n• Carbohydrate Quality: Sluggish metabolic rates often benefit from complex, unrefined carbohydrates and soluble fiber from Sorghum (jowar) and millets rather than refined flours.\n• Personalized Nutrition: Every individual's thyroid condition has distinct biological factors. Some individuals prefer reducing gluten, while others focus on overall dietary diversity.\n\nOur Thyro Care Atta is formulated with 40% Amaranth, 25% Jowar, 15% Chana, 10% Ragi, 5% Chia, and 5% Flax Seeds to provide a mineral-dense, wheat-free food option.`,
    disclaimer: 'Mandatory Medical Disclaimer: Arogya Bhog Thyro Care Atta is a nutritious dietary food ingredient. It is NOT a medicine, drug, cure, or clinical treatment for hypothyroidism, hyperthyroidism, Goiter, or any endocrine disorder. It does not replace prescribed thyroid hormone medications (such as levothyroxine). Always consult your endocrinologist or certified physician regarding your medical treatment and diet.',
    relatedProductSlug: 'thyro-care-atta',
    status: 'published',
    isPublished: true,
    keywords: ['Thyroid ke liye khana', 'Thyroid patients ke liye diet', 'थायराइड में क्या खाना चाहिए']
  },
  {
    title: 'General Dietary Information for People Managing Diabetes',
    slug: 'diabetes-dietary-information',
    hindiTitle: 'डायबिटीज में सामान्य खानपान व आहार संबंधी जानकारी',
    category: 'Dietary Awareness',
    readTime: '4 min read',
    summary: 'Understanding glycemic index, beta-glucan soluble fiber in barley, and how whole grain selection supports balanced post-meal energy.',
    content: `Managing diabetes and pre-diabetes requires mindful attention to carbohydrate digestion speed and overall meal composition. Fast-digesting refined carbohydrates lead to sharp spikes in postprandial blood glucose, followed by energy crashes.\n\nHelpful dietary strategies include:\n• Choosing Low-GI Grains: Whole barley (jau) and roasted Bengal gram (chana) possess a low Glycemic Index (GI). Barley is exceptionally rich in beta-glucan soluble fiber, which forms a viscous digestive matrix that slows glucose absorption in the small intestine.\n• Increasing Meal Fiber: Adding fiber-rich ancient millets (jowar, ragi) and flaxseeds creates greater satiety and provides slow, steady carbohydrate release.\n• Controlling Portion Sizes: Even with high-fiber flours, overall portion moderation and balanced meals containing vegetables, pulses, and healthy fats remain vital.\n\nArogya Bhog Sugar Care Atta incorporates 15% barley, 10% roasted chana, and slow millets to offer families a wholesome low-GI flour option for everyday rotis.`,
    disclaimer: 'Mandatory Medical Disclaimer: Arogya Bhog Sugar Care Atta is a whole-food flour blend. It does NOT cure, treat, reverse, or control diabetes. It does not replace insulin therapy or prescribed oral hypoglycemic medications. Individuals managing diabetes must monitor their blood sugar and consult their consulting diabetologist or clinical nutritionist.',
    relatedProductSlug: 'sugar-care-atta',
    status: 'published',
    isPublished: true,
    keywords: ['Sugar ke liye khana', 'डायबिटीज में क्या खाना चाहिए', 'शुगर केयर आटा']
  }
];

// Helper to auto-seed articles if database collection is empty
async function autoSeedArticles() {
  try {
    const count = await Article.countDocuments();
    if (count === 0) {
      await Article.insertMany(DEFAULT_ARTICLES);
      console.log('Seeded initial nutrition & food knowledge articles into database');
    }
  } catch (err) {
    console.error('Error auto-seeding articles:', err.message);
  }
}
autoSeedArticles();

// ==========================================
// PUBLIC ENDPOINTS
// ==========================================

// GET /api/articles (Public list of published articles)
router.get('/', async (req, res) => {
  try {
    const { category, search } = req.query;
    const filter = { status: 'published', isPublished: true };

    if (category && category !== 'All') {
      filter.category = category;
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { title: regex },
        { hindiTitle: regex },
        { summary: regex },
        { content: regex },
        { keywords: regex }
      ];
    }

    const articles = await Article.find(filter)
      .sort({ displayOrder: 1, createdAt: -1 })
      .select('title slug hindiTitle summary category readTime featuredImage relatedProductSlug disclaimer createdAt updatedAt author');

    res.json({ success: true, count: articles.length, data: articles });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/articles/:slug (Public single article view)
router.get('/:slug', optionalAuth, async (req, res) => {
  try {
    const { slug } = req.params;
    const article = await Article.findOne({ slug });

    if (!article) {
      return res.status(404).json({ success: false, message: 'Article not found' });
    }

    // If draft or archived, only allow if admin user
    if (article.status !== 'published' && (!req.user || req.user.role !== 'admin')) {
      return res.status(404).json({ success: false, message: 'Article is not published' });
    }

    res.json({ success: true, data: article });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// ADMIN ENDPOINTS
// ==========================================

// GET /api/articles/admin/all (Admin list with drafts & archive)
router.get('/admin/all', protect, adminOnly, async (req, res) => {
  try {
    const articles = await Article.find().sort({ createdAt: -1 });
    res.json({ success: true, count: articles.length, data: articles });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/articles (Create new article)
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const {
      title,
      slug,
      hindiTitle,
      summary,
      content,
      category,
      readTime,
      featuredImage,
      seoTitle,
      metaDescription,
      relatedProductSlug,
      disclaimer,
      status,
      author
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Article title is required' });
    }
    if (!summary || !summary.trim()) {
      return res.status(400).json({ success: false, message: 'Article summary is required' });
    }
    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Article content body is required' });
    }

    let cleanSlug = slug 
      ? slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      : title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const existing = await Article.findOne({ slug: cleanSlug });
    if (existing) {
      cleanSlug = `${cleanSlug}-${Date.now().toString().slice(-4)}`;
    }

    const article = await Article.create({
      title: title.trim(),
      slug: cleanSlug,
      hindiTitle: hindiTitle || '',
      summary: summary.trim(),
      content: content.trim(),
      category: category || 'Nutrition Insights',
      readTime: readTime || '3 min read',
      featuredImage: featuredImage || '',
      seoTitle: seoTitle || title.trim(),
      metaDescription: metaDescription || summary.trim().slice(0, 160),
      relatedProductSlug: relatedProductSlug || 'everyday-soft-multigrain-atta',
      disclaimer: disclaimer || '',
      status: status || 'published',
      isPublished: status === 'published',
      author: author || 'Arogya Bhog Editorial'
    });

    res.status(201).json({ success: true, data: article, message: `Article "${article.title}" created successfully` });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PUT /api/articles/:id (Update article)
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (updateData.status) {
      updateData.isPublished = updateData.status === 'published';
    }

    const article = await Article.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!article) {
      return res.status(404).json({ success: false, message: 'Article not found' });
    }

    res.json({ success: true, data: article, message: `Article "${article.title}" updated successfully` });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PATCH /api/articles/:id/status (Toggle publish / draft / archive)
router.patch('/:id/status', protect, adminOnly, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['draft', 'published', 'archived'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status. Must be draft, published, or archived' });
    }

    const article = await Article.findByIdAndUpdate(
      req.params.id,
      { $set: { status, isPublished: status === 'published' } },
      { new: true }
    );

    if (!article) {
      return res.status(404).json({ success: false, message: 'Article not found' });
    }

    res.json({ success: true, data: article, message: `Article status updated to ${status}` });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE /api/articles/:id (Archive / Soft-delete)
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const article = await Article.findByIdAndUpdate(
      req.params.id,
      { $set: { status: 'archived', isPublished: false } },
      { new: true }
    );

    if (!article) {
      return res.status(404).json({ success: false, message: 'Article not found' });
    }

    res.json({ success: true, message: `Article "${article.title}" archived successfully` });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;
