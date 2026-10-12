import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Search, 
  Clock, 
  ArrowLeft, 
  ArrowRight, 
  Tag, 
  ShieldAlert, 
  ExternalLink, 
  Sparkles,
  Share2,
  Check
} from 'lucide-react';
import { api } from '../services/api';
import { 
  generateArticleJsonLd, 
  generateBreadcrumbJsonLd, 
  SITE_CANONICAL_DOMAIN 
} from '../utils/productSeoData';

const CATEGORIES = [
  'All',
  'Flour Basics',
  'Flour Comparison',
  'Nutrition Insights',
  'Consumer Awareness',
  'Product Guide',
  'Dietary Awareness'
];

export function BlogView({ onSelectProduct, initialSlug }) {
  const [articles, setArticles] = useState([]);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);

  // Helper to extract slug from path (/blog/:slug) or hash (#blog/:slug)
  const getPathOrHashSlug = () => {
    if (typeof window === 'undefined') return '';
    const pathMatch = window.location.pathname.match(/^\/blog\/([^/?#]+)/);
    if (pathMatch) return decodeURIComponent(pathMatch[1]);
    const hash = window.location.hash || '';
    const hashMatch = hash.match(/^#blog\/([^/?#]+)/);
    return hashMatch ? decodeURIComponent(hashMatch[1]) : '';
  };

  // Load articles
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const loadArticles = async () => {
      try {
        const res = await api.getArticles({
          category: selectedCategory === 'All' ? undefined : selectedCategory,
          search: searchQuery.trim() || undefined
        });

        if (isMounted && res && res.success) {
          setArticles(res.data || []);

          // Check if direct slug specified in prop, URL pathname, or URL hash
          const activeSlug = initialSlug || getPathOrHashSlug();
          if (activeSlug) {
            const found = (res.data || []).find(a => a.slug === activeSlug);
            if (found) {
              setSelectedArticle(found);
            } else {
              // Fetch by slug directly if not in list
              api.getArticleBySlug(activeSlug).then(slugRes => {
                if (isMounted && slugRes && slugRes.success) {
                  setSelectedArticle(slugRes.data);
                }
              }).catch(() => {});
            }
          }
        }
      } catch (err) {
        console.error('Failed to load articles:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadArticles();
    return () => { isMounted = false; };
  }, [selectedCategory, searchQuery, initialSlug]);

  // Dynamic Head metadata & Schema.org JSON-LD management
  useEffect(() => {
    const originalTitle = document.title;
    const metaDesc = document.querySelector('meta[name="description"]');
    const canonical = document.querySelector('link[rel="canonical"]');
    const originalDesc = metaDesc ? metaDesc.getAttribute('content') : '';
    const originalCanonical = canonical ? canonical.getAttribute('href') : '';

    const setMetaContent = (selector, content) => {
      const el = document.querySelector(selector);
      if (el) el.setAttribute('content', content);
    };

    if (selectedArticle) {
      const artTitle = `${selectedArticle.title} | Arogya Bhog Food Knowledge`;
      const artDesc = selectedArticle.summary || selectedArticle.content?.slice(0, 160) || 'Arogya Bhog health flour insights.';
      const artUrl = `${SITE_CANONICAL_DOMAIN}/blog/${selectedArticle.slug || selectedArticle.id}`;

      document.title = artTitle;
      if (metaDesc) metaDesc.setAttribute('content', artDesc);
      if (canonical) canonical.setAttribute('href', artUrl);

      setMetaContent('meta[property="og:title"]', artTitle);
      setMetaContent('meta[property="og:description"]', artDesc);
      setMetaContent('meta[property="og:url"]', artUrl);
      setMetaContent('meta[name="twitter:title"]', artTitle);
      setMetaContent('meta[name="twitter:description"]', artDesc);

      // Inject Article JSON-LD
      let scriptTag = document.getElementById('blog-article-jsonld');
      if (!scriptTag) {
        scriptTag = document.createElement('script');
        scriptTag.id = 'blog-article-jsonld';
        scriptTag.type = 'application/ld+json';
        document.head.appendChild(scriptTag);
      }

      const articleSchema = generateArticleJsonLd(selectedArticle);
      const breadcrumbs = generateBreadcrumbJsonLd([
        { name: 'Home', url: '/' },
        { name: 'Food Knowledge', url: '/blog' },
        { name: selectedArticle.title, url: `/blog/${selectedArticle.slug || selectedArticle.id}` }
      ]);

      scriptTag.textContent = JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': [articleSchema, breadcrumbs].filter(Boolean)
      });
    } else {
      const listTitle = 'Food & Health Knowledge Centre | Arogya Bhog';
      const listDesc = 'Explore authentic whole-grain guides, nutrition articles, plant protein comparisons, and stone-milled flour facts from Arogya Bhog.';
      const listUrl = `${SITE_CANONICAL_DOMAIN}/blog`;

      document.title = listTitle;
      if (metaDesc) metaDesc.setAttribute('content', listDesc);
      if (canonical) canonical.setAttribute('href', listUrl);

      setMetaContent('meta[property="og:title"]', listTitle);
      setMetaContent('meta[property="og:description"]', listDesc);
      setMetaContent('meta[property="og:url"]', listUrl);
    }

    return () => {
      document.title = 'Arogya Bhog';
      if (metaDesc && originalDesc) metaDesc.setAttribute('content', originalDesc);
      if (canonical && originalCanonical) canonical.setAttribute('href', originalCanonical);
      setMetaContent('meta[property="og:title"]', 'Arogya Bhog');
      setMetaContent('meta[property="og:url"]', `${SITE_CANONICAL_DOMAIN}/`);

      const scriptToRemove = document.getElementById('blog-article-jsonld');
      if (scriptToRemove) scriptToRemove.remove();
    };
  }, [selectedArticle]);

  const handleSelectArticle = (article) => {
    setSelectedArticle(article);
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', `/blog/${article.slug}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBackToList = () => {
    setSelectedArticle(null);
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', '/blog');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleShare = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  // ==========================================
  // ARTICLE DETAIL VIEW
  // ==========================================
  if (selectedArticle) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-8 animate-fadeIn text-gray-900 dark:text-gray-100">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-zinc-800 pb-4">
          <a
            href="/blog"
            onClick={(e) => { e.preventDefault(); handleBackToList(); }}
            className="inline-flex items-center space-x-2 text-sm font-semibold text-amber-700 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to All Articles</span>
          </a>

          <button
            onClick={handleShare}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'Link Copied!' : 'Share'}</span>
          </button>
        </div>

        {/* Article Header */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-xs font-semibold">
              {selectedArticle.category}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{selectedArticle.readTime || '3 min read'}</span>
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white leading-tight">
            {selectedArticle.title}
          </h1>

          {selectedArticle.hindiTitle && (
            <p className="text-base sm:text-lg text-amber-800 dark:text-amber-300/90 font-medium">
              {selectedArticle.hindiTitle}
            </p>
          )}

          {selectedArticle.summary && (
            <p className="text-base text-gray-600 dark:text-gray-300 leading-relaxed font-normal p-4 rounded-xl bg-amber-50/60 dark:bg-zinc-800/60 border-l-4 border-amber-600">
              {selectedArticle.summary}
            </p>
          )}
        </div>

        {/* Related Product Banner */}
        {selectedArticle.relatedProductSlug && onSelectProduct && (
          <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 flex items-center justify-between gap-4 shadow-sm">
            <div className="space-y-0.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                Featured Product Formulation
              </span>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                Learn about the flour blend formulated around these ingredients
              </p>
            </div>
            <a
              href={`/product/${selectedArticle.relatedProductSlug}`}
              onClick={(e) => {
                e.preventDefault();
                onSelectProduct(selectedArticle.relatedProductSlug);
              }}
              className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs whitespace-nowrap inline-flex items-center space-x-1.5 transition-colors shadow-sm"
            >
              <span>View Product</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        )}

        {/* Article Body */}
        <article className="prose dark:prose-invert max-w-none text-gray-800 dark:text-gray-200 leading-relaxed space-y-4 text-sm sm:text-base">
          {selectedArticle.content.split('\n\n').map((paragraph, i) => {
            if (paragraph.startsWith('•') || paragraph.startsWith('-')) {
              const items = paragraph.split('\n').filter(Boolean);
              return (
                <ul key={i} className="list-disc pl-5 space-y-1.5 my-3">
                  {items.map((it, idx) => (
                    <li key={idx} className="text-gray-700 dark:text-gray-300">
                      {it.replace(/^[•\-]\s*/, '')}
                    </li>
                  ))}
                </ul>
              );
            }
            if (/^\d+\.\s/.test(paragraph)) {
              const items = paragraph.split('\n').filter(Boolean);
              return (
                <ol key={i} className="list-decimal pl-5 space-y-1.5 my-3">
                  {items.map((it, idx) => (
                    <li key={idx} className="text-gray-700 dark:text-gray-300">
                      {it.replace(/^\d+\.\s*/, '')}
                    </li>
                  ))}
                </ol>
              );
            }
            return (
              <p key={i} className="leading-relaxed">
                {paragraph}
              </p>
            );
          })}
        </article>

        {/* Mandatory Educational & Medical Disclaimer */}
        <div className="p-4 rounded-xl bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 space-y-2 text-xs text-gray-600 dark:text-gray-400">
          <div className="flex items-center space-x-2 font-bold text-gray-900 dark:text-white">
            <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>Nutrition & Health Disclaimer</span>
          </div>
          <p className="leading-relaxed">
            {selectedArticle.disclaimer || 
              'The information presented in this article is published strictly for educational and dietary wellness awareness. Arogya Bhog products are wholesome food flours and ingredients, not medicines, medical treatments, or clinical cures. They are not intended to diagnose, treat, or replace professional healthcare counsel. Always consult certified medical practitioners or clinical dietitians regarding individual health conditions.'}
          </p>
        </div>

        {/* Bottom Back Button */}
        <div className="pt-4 text-center">
          <a
            href="/blog"
            onClick={(e) => {
              e.preventDefault();
              handleBackToList();
            }}
            className="inline-block px-6 py-2.5 rounded-xl border border-gray-300 dark:border-zinc-700 hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-800 dark:text-gray-200 font-semibold text-xs transition-colors"
          >
            ← Back to Food Knowledge Articles
          </a>
        </div>

      </div>
    );
  }

  // ==========================================
  // ARTICLES LIST VIEW
  // ==========================================
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8 text-gray-900 dark:text-gray-100">
      
      {/* Hero Header */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-xs font-semibold">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Nutrition & Grain Science</span>
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
          Food Knowledge & Healthy Living
        </h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
          Learn how ancient millets, slow-digesting pulses, and chemical-free cold stone milling power balanced family nourishment.
        </p>
      </div>

      {/* Search & Category Filter Controls */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative max-w-md mx-auto">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search articles, grains, benefits..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-gray-900 dark:text-white outline-none focus:border-amber-600 transition-colors shadow-sm"
          />
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center justify-start sm:justify-center overflow-x-auto gap-1.5 pb-2 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-zinc-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Articles Grid */}
      {loading ? (
        <div className="py-16 text-center text-sm text-gray-500 dark:text-gray-400">
          Loading informative articles...
        </div>
      ) : articles.length === 0 ? (
        <div className="py-16 text-center space-y-2">
          <p className="text-base font-semibold text-gray-700 dark:text-gray-300">
            No articles found matching "{searchQuery}"
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Try searching for "multigrain", "protein", "diabetes", or "fibre".
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {articles.map((article) => (
            <a
              key={article._id || article.slug}
              href={`/blog/${article.slug}`}
              onClick={(e) => {
                e.preventDefault();
                handleSelectArticle(article);
              }}
              className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 hover:border-amber-500 dark:hover:border-amber-500/60 transition-all cursor-pointer shadow-sm hover:shadow-md flex flex-col justify-between space-y-4 group block text-left"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span className="font-semibold text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60">
                    {article.category}
                  </span>
                  <span className="flex items-center space-x-1 font-medium">
                    <Clock className="w-3 h-3" />
                    <span>{article.readTime || '3 min read'}</span>
                  </span>
                </div>

                <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors leading-snug">
                  {article.title}
                </h2>

                {article.hindiTitle && (
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    {article.hindiTitle}
                  </p>
                )}

                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 line-clamp-3 leading-relaxed">
                  {article.summary}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-zinc-800 text-xs font-semibold text-amber-700 dark:text-amber-400">
                <span>Read Full Article</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </a>
          ))}
        </div>
      )}

      {/* Educational Notice Banner */}
      <div className="p-4 rounded-xl bg-gray-50 dark:bg-zinc-900/60 border border-gray-200 dark:border-zinc-800 text-center text-xs text-gray-500 dark:text-gray-400 leading-relaxed max-w-2xl mx-auto">
        Arogya Bhog Food Knowledge articles provide grain science and nutritional education. None of our content or products make curative or medical claims.
      </div>

    </div>
  );
}

export default BlogView;
