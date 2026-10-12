import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  PRODUCT_SEO_CATALOG,
  SEO_ARTICLES,
  generateProductJsonLd,
  generateArticleJsonLd,
  generateBreadcrumbJsonLd,
  SITE_CANONICAL_DOMAIN
} from '../src/utils/productSeoData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, '../dist');
const templatePath = path.join(distDir, 'index.html');

if (!fs.existsSync(templatePath)) {
  console.error('[SEO Prerender] dist/index.html not found. Run "vite build" first.');
  process.exit(1);
}

const baseHtml = fs.readFileSync(templatePath, 'utf8');

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Replace or inject meta tags in HTML
 */
function injectMeta(html, { title, description, canonicalUrl, ogImage, jsonLd, bodyHtml }) {
  let updated = html;

  // Replace <title>
  if (title) {
    updated = updated.replace(/<title>.*?<\/title>/i, `<title>${title}</title>`);
  }

  // Replace meta title & og:title & twitter:title
  if (title) {
    updated = updated.replace(/<meta name="title" content=".*?" \/>/i, `<meta name="title" content="${title}" />`);
    updated = updated.replace(/<meta property="og:title" content=".*?" \/>/i, `<meta property="og:title" content="${title}" />`);
    updated = updated.replace(/<meta name="twitter:title" content=".*?" \/>/i, `<meta name="twitter:title" content="${title}" />`);
  }

  // Replace meta description & og:description & twitter:description
  if (description) {
    updated = updated.replace(/<meta name="description" content=".*?" \/>/i, `<meta name="description" content="${description}" />`);
    updated = updated.replace(/<meta property="og:description" content=".*?" \/>/i, `<meta property="og:description" content="${description}" />`);
    updated = updated.replace(/<meta name="twitter:description" content=".*?" \/>/i, `<meta name="twitter:description" content="${description}" />`);
  }

  // Replace canonical URL & og:url
  if (canonicalUrl) {
    updated = updated.replace(/<link rel="canonical" href=".*?" \/>/i, `<link rel="canonical" href="${canonicalUrl}" />`);
    updated = updated.replace(/<meta property="og:url" content=".*?" \/>/i, `<meta property="og:url" content="${canonicalUrl}" />`);
  }

  // Replace og:image & twitter:image
  if (ogImage) {
    updated = updated.replace(/<meta property="og:image" content=".*?" \/>/i, `<meta property="og:image" content="${ogImage}" />`);
    updated = updated.replace(/<meta name="twitter:image" content=".*?" \/>/i, `<meta name="twitter:image" content="${ogImage}" />`);
  }

  // Inject specific page JSON-LD right before </head>
  if (jsonLd) {
    const jsonLdScript = `\n    <script type="application/ld+json" id="prerender-jsonld">\n    ${JSON.stringify(jsonLd, null, 2)}\n    </script>\n  `;
    updated = updated.replace('</head>', `${jsonLdScript}</head>`);
  }

  // Inject semantic fallback body into <div id="root">
  if (bodyHtml) {
    updated = updated.replace('<div id="root"></div>', `<div id="root">${bodyHtml}</div>`);
  }

  return updated;
}

console.log('[SEO Prerender] Starting static HTML generation for crawlers...');

// 1. Prerender Products
let productCount = 0;
for (const [slug, prod] of Object.entries(PRODUCT_SEO_CATALOG)) {
  const targetDir = path.join(distDir, 'product', slug);
  ensureDir(targetDir);

  const productSchema = generateProductJsonLd(slug);
  const breadcrumbSchema = generateBreadcrumbJsonLd([
    { name: 'Home', url: '/' },
    { name: 'Flour Studio', url: '/' },
    { name: prod.name, url: `/product/${slug}` }
  ]);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [productSchema, breadcrumbSchema].filter(Boolean)
  };

  const ingredientsListHtml = (prod.ingredients || []).map(ing => 
    `<li><strong>${ing.name}</strong> (${ing.percentage}%): ${ing.role}</li>`
  ).join('\n        ');

  const relatedLinksHtml = (prod.relatedSlugs || []).map(rSlug => {
    const rel = PRODUCT_SEO_CATALOG[rSlug];
    return rel ? `<li><a href="/product/${rSlug}">${rel.name} (₹${rel.sellingPrice}/kg)</a> - ${rel.tagline}</li>` : '';
  }).join('\n        ');

  const bodyHtml = `
    <header style="max-width:800px;margin:20px auto;padding:16px;font-family:sans-serif;">
      <nav aria-label="Breadcrumb">
        <a href="/">Home</a> &gt; <a href="/">Flour Studio</a> &gt; <span>${prod.name}</span>
      </nav>
      <h1 style="color:#111;font-size:28px;margin-top:12px;">${prod.name}</h1>
      <p style="font-weight:bold;color:#C9A227;">${prod.badge} • ₹${prod.sellingPrice}/kg (Available in 5 kg & 10 kg packs)</p>
      <p style="font-size:16px;line-height:1.6;color:#333;">${prod.longDescription}</p>
      
      <h2>Ingredients & Ratios</h2>
      <ul>
        ${ingredientsListHtml}
      </ul>

      <h2>Nutritional Values per 100g</h2>
      <ul>
        <li>Energy: ${prod.nutritionPer100g.energy}</li>
        <li>Protein: ${prod.nutritionPer100g.protein}</li>
        <li>Dietary Fibre: ${prod.nutritionPer100g.dietaryFibre}</li>
        <li>Carbohydrates: ${prod.nutritionPer100g.carbohydrates}</li>
        <li>Fat: ${prod.nutritionPer100g.fat}</li>
      </ul>

      ${prod.healthContext ? `<h2>Health & Nutrition Safeguards</h2><p>${prod.healthContext}</p>` : ''}
      
      ${prod.hindiContext ? `<h2>आटे की सामग्री और पोषण (Hindi Guide)</h2><h3>${prod.hindiContext.title}</h3><p>${prod.hindiContext.content}</p>` : ''}

      <h2>Other Arogya Bhog Health Flours</h2>
      <ul>
        ${relatedLinksHtml}
      </ul>
    </header>
  `;

  const html = injectMeta(baseHtml, {
    title: prod.seoTitle,
    description: prod.metaDescription,
    canonicalUrl: `${SITE_CANONICAL_DOMAIN}/product/${slug}`,
    ogImage: `${SITE_CANONICAL_DOMAIN}${prod.imageUrl}`,
    jsonLd,
    bodyHtml
  });

  fs.writeFileSync(path.join(targetDir, 'index.html'), html, 'utf8');
  productCount++;
}
console.log(`[SEO Prerender] Generated ${productCount} static product HTML pages.`);

// 2. Prerender Blog Articles
let articleCount = 0;
for (const art of SEO_ARTICLES) {
  const slug = art.slug || art.id;
  const targetDir = path.join(distDir, 'blog', slug);
  ensureDir(targetDir);

  const articleSchema = generateArticleJsonLd(art);
  const breadcrumbSchema = generateBreadcrumbJsonLd([
    { name: 'Home', url: '/' },
    { name: 'Food Knowledge', url: '/blog' },
    { name: art.title, url: `/blog/${slug}` }
  ]);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [articleSchema, breadcrumbSchema].filter(Boolean)
  };

  const paragraphsHtml = art.content.split('\n\n').map(p => `<p>${p}</p>`).join('\n      ');

  const bodyHtml = `
    <article style="max-width:800px;margin:20px auto;padding:16px;font-family:sans-serif;line-height:1.7;">
      <nav aria-label="Breadcrumb">
        <a href="/">Home</a> &gt; <a href="/blog">Food Knowledge</a> &gt; <span>${art.title}</span>
      </nav>
      <header>
        <p style="color:#C9A227;font-weight:bold;margin-top:12px;">${art.category} • ${art.readTime || '3 min read'}</p>
        <h1 style="color:#111;font-size:28px;">${art.title}</h1>
        ${art.hindiTitle ? `<p style="font-size:18px;color:#777;">${art.hindiTitle}</p>` : ''}
        ${art.summary ? `<p style="font-size:16px;font-style:italic;background:#fefbf2;padding:12px;border-left:4px solid #C9A227;">${art.summary}</p>` : ''}
      </header>
      
      <div>
        ${paragraphsHtml}
      </div>

      ${art.disclaimer ? `<aside style="background:#f5f5f5;padding:12px;margin-top:20px;border-radius:8px;"><strong>Medical Disclaimer:</strong> ${art.disclaimer}</aside>` : ''}

      ${art.relatedProductSlug ? `<p style="margin-top:20px;"><a href="/product/${art.relatedProductSlug}">Learn about our stone-milled flour blend formulated with these grains →</a></p>` : ''}
    </article>
  `;

  const html = injectMeta(baseHtml, {
    title: `${art.title} | Arogya Bhog Food Knowledge`,
    description: art.summary || art.content.slice(0, 160),
    canonicalUrl: `${SITE_CANONICAL_DOMAIN}/blog/${slug}`,
    ogImage: `${SITE_CANONICAL_DOMAIN}/arogyaBhog_logo.png`,
    jsonLd,
    bodyHtml
  });

  fs.writeFileSync(path.join(targetDir, 'index.html'), html, 'utf8');
  articleCount++;
}
console.log(`[SEO Prerender] Generated ${articleCount} static article HTML pages.`);

// 3. Prerender Blog Index (/blog)
{
  const targetDir = path.join(distDir, 'blog');
  ensureDir(targetDir);

  const articlesListHtml = SEO_ARTICLES.map(a => 
    `<li><h3><a href="/blog/${a.slug || a.id}">${a.title}</a></h3><p>${a.summary}</p></li>`
  ).join('\n        ');

  const bodyHtml = `
    <main style="max-width:800px;margin:20px auto;padding:16px;font-family:sans-serif;">
      <nav><a href="/">Home</a> &gt; <span>Food Knowledge</span></nav>
      <h1 style="font-size:28px;margin-top:12px;">Arogya Bhog Food & Health Knowledge Centre</h1>
      <p>Educational articles on multigrain atta, whole-grain benefits, plant protein, low glycemic index flours, and stone chakki milling.</p>
      <ul>
        ${articlesListHtml}
      </ul>
    </main>
  `;

  const html = injectMeta(baseHtml, {
    title: 'Food & Health Knowledge Centre | Arogya Bhog',
    description: 'Educational articles on multigrain atta, whole-grain benefits, plant protein, low glycemic index flours, and stone chakki milling from Arogya Bhog.',
    canonicalUrl: `${SITE_CANONICAL_DOMAIN}/blog`,
    ogImage: `${SITE_CANONICAL_DOMAIN}/arogyaBhog_logo.png`,
    bodyHtml
  });

  fs.writeFileSync(path.join(targetDir, 'index.html'), html, 'utf8');
  console.log('[SEO Prerender] Generated static /blog index HTML page.');
}

// 4. Prerender /custom-blend
{
  const targetDir = path.join(distDir, 'custom-blend');
  ensureDir(targetDir);

  const html = injectMeta(baseHtml, {
    title: 'Custom Multigrain Atta Blender | Arogya Bhog',
    description: 'Design your personalized multigrain flour blend from 18 verified whole grains and seeds. Exact 10 kg batch freshly stone milled per order with Cash on Delivery.',
    canonicalUrl: `${SITE_CANONICAL_DOMAIN}/custom-blend`,
    ogImage: `${SITE_CANONICAL_DOMAIN}/variants/my-choice-atta.jpg`
  });

  fs.writeFileSync(path.join(targetDir, 'index.html'), html, 'utf8');
  console.log('[SEO Prerender] Generated static /custom-blend HTML page.');
}

// 5. Prerender /ayurvedic-ai
{
  const targetDir = path.join(distDir, 'ayurvedic-ai');
  ensureDir(targetDir);

  const html = injectMeta(baseHtml, {
    title: 'Ayurvedic AI Atta Formulation Advisor | Arogya Bhog',
    description: 'Get doctor-calibrated grain formula recommendations based on your personal lifestyle, digestive profile, and wellness goals. Fresh stone milling in Kanpur.',
    canonicalUrl: `${SITE_CANONICAL_DOMAIN}/ayurvedic-ai`,
    ogImage: `${SITE_CANONICAL_DOMAIN}/arogyaBhog_logo.png`
  });

  fs.writeFileSync(path.join(targetDir, 'index.html'), html, 'utf8');
  console.log('[SEO Prerender] Generated static /ayurvedic-ai HTML page.');
}

console.log('[SEO Prerender] Static HTML prerendering complete for all public routes!');
