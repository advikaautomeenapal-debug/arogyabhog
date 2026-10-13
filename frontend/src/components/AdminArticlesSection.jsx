import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  FileText,
  Tag,
  ShieldAlert
} from 'lucide-react';
import { api } from '../services/api';

const CATEGORIES = [
  'Flour Basics',
  'Flour Comparison',
  'Nutrition Insights',
  'Consumer Awareness',
  'Product Guide',
  'Dietary Awareness'
];

export function AdminArticlesSection({ products = [] }) {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    title: '',
    slug: '',
    hindiTitle: '',
    category: 'Flour Basics',
    readTime: '3 min read',
    summary: '',
    content: '',
    relatedProductSlug: '',
    disclaimer: '',
    status: 'published'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const loadArticles = async () => {
    setLoading(true);
    try {
      const res = await api.getAdminArticles({
        status: statusFilter === 'all' ? undefined : statusFilter,
        search: searchQuery.trim() || undefined
      });
      if (res && res.success) {
        setArticles(res.data || []);
      }
    } catch (err) {
      console.error('Error loading admin articles:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadArticles();
  }, [statusFilter, searchQuery]);

  const handleOpenCreate = () => {
    setEditingId(null);
    setForm({
      title: '',
      slug: '',
      hindiTitle: '',
      category: 'Flour Basics',
      readTime: '3 min read',
      summary: '',
      content: '',
      relatedProductSlug: '',
      disclaimer: '',
      status: 'published'
    });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (article) => {
    setEditingId(article._id);
    setForm({
      title: article.title || '',
      slug: article.slug || '',
      hindiTitle: article.hindiTitle || '',
      category: article.category || 'Flour Basics',
      readTime: article.readTime || '3 min read',
      summary: article.summary || '',
      content: article.content || '',
      relatedProductSlug: article.relatedProductSlug || '',
      disclaimer: article.disclaimer || '',
      status: article.status || 'published'
    });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!form.title.trim()) {
      setErrorMsg('Article title is required.');
      return;
    }
    if (!form.content.trim()) {
      setErrorMsg('Article content is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      let res;
      if (editingId) {
        res = await api.updateArticle(editingId, form);
      } else {
        res = await api.createArticle(form);
      }

      if (res && res.success) {
        setSuccessMsg(editingId ? 'Article updated successfully.' : 'Article created successfully.');
        setIsModalOpen(false);
        loadArticles();
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setErrorMsg(res?.message || 'Failed to save article.');
      }
    } catch (err) {
      setErrorMsg('Error: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (article, newStatus) => {
    try {
      const res = await api.toggleArticleStatus(article._id, newStatus);
      if (res && res.success) {
        setSuccessMsg(`Article marked as "${newStatus}".`);
        loadArticles();
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err) {
      alert('Error updating status: ' + err.message);
    }
  };

  const handleDelete = async (article) => {
    if (!window.confirm(`Delete article "${article.title}"?`)) return;
    try {
      const res = await api.deleteArticle(article._id);
      if (res && res.success) {
        setSuccessMsg('Article deleted.');
        loadArticles();
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err) {
      alert('Error deleting article: ' + err.message);
    }
  };

  return (
    <div className="rounded-2xl bg-white dark:bg-[#181818] border border-gray-200 dark:border-[#2e2a20] p-4 md:p-6 space-y-5 shadow-sm">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 dark:border-[#2e2a20] pb-3.5 gap-2">
        <div>
          <h3 className="font-editorial text-sm md:text-base font-bold uppercase tracking-wider text-gray-900 dark:text-[#fdfbf7] flex items-center space-x-2">
            <BookOpen className="w-4 h-4 text-[#C9A227]" />
            <span>NUTRITION & FOOD KNOWLEDGE (ARTICLES)</span>
          </h3>
          <p className="text-[11px] text-gray-500 dark:text-[#8b826f]">
            Create and manage public educational articles on ancient grains, millstone hygiene, and dietary awareness.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="py-2 px-3.5 rounded-xl bg-[#C9A227] hover:bg-[#b8911f] text-white dark:text-[#121212] font-bold text-xs uppercase tracking-wider flex items-center space-x-1.5 shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Article</span>
        </button>
      </div>

      {/* Alerts */}
      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 text-xs flex items-center space-x-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search articles by title, summary, keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-gray-50 dark:bg-[#141414] border border-gray-200 dark:border-[#2e2a20] text-xs text-gray-900 dark:text-[#fdfbf7] outline-none focus:border-[#C9A227]"
          />
        </div>

        <div className="flex items-center space-x-1.5 text-xs">
          {['all', 'published', 'draft', 'archived'].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${
                statusFilter === st
                  ? 'bg-[#C9A227] text-white dark:text-[#121212]'
                  : 'bg-gray-100 dark:bg-[#201d16] text-gray-600 dark:text-[#8b826f] hover:bg-gray-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Articles Table / List */}
      {loading ? (
        <div className="py-12 text-center text-xs text-gray-500">
          Loading articles...
        </div>
      ) : articles.length === 0 ? (
        <div className="py-12 text-center text-xs text-gray-500">
          No articles found for this filter.
        </div>
      ) : (
        <div className="divide-y divide-gray-100 dark:divide-[#2e2a20] border border-gray-200 dark:border-[#2e2a20] rounded-xl overflow-hidden bg-white dark:bg-[#141414]">
          {articles.map((art) => (
            <div key={art._id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50/50 dark:hover:bg-[#191919] transition-colors">
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center space-x-2">
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                    art.status === 'published'
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                      : art.status === 'draft'
                      ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                      : 'bg-gray-200 dark:bg-zinc-800 text-gray-600 dark:text-gray-400'
                  }`}>
                    {art.status}
                  </span>
                  <span className="text-[10px] font-semibold text-gray-500">
                    {art.category} • {art.readTime || '3 min'}
                  </span>
                </div>

                <h4 className="font-bold text-sm text-gray-900 dark:text-[#fdfbf7] truncate">
                  {art.title}
                </h4>

                {art.hindiTitle && (
                  <p className="text-xs text-amber-800 dark:text-amber-300/80 truncate">
                    {art.hindiTitle}
                  </p>
                )}

                <p className="text-xs text-gray-500 dark:text-[#8b826f] line-clamp-2 max-w-2xl">
                  {art.summary}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2 flex-shrink-0">
                {art.status !== 'published' ? (
                  <button
                    onClick={() => handleToggleStatus(art, 'published')}
                    className="px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-200 text-xs font-bold uppercase transition-all"
                  >
                    Publish
                  </button>
                ) : (
                  <button
                    onClick={() => handleToggleStatus(art, 'draft')}
                    className="px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 hover:bg-amber-200 text-xs font-bold uppercase transition-all"
                  >
                    Unpublish
                  </button>
                )}

                <button
                  onClick={() => handleOpenEdit(art)}
                  className="p-1.5 rounded-lg border border-gray-200 dark:border-[#2e2a20] hover:border-[#C9A227] text-gray-600 dark:text-gray-300"
                  title="Edit Article"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => handleDelete(art)}
                  className="p-1.5 rounded-lg border border-gray-200 dark:border-[#2e2a20] hover:border-rose-400 text-gray-400 hover:text-rose-500"
                  title="Delete Article"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-[#181818] border-2 border-[#C9A227] p-5 md:p-6 space-y-4 shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-[#2e2a20] pb-3">
              <h3 className="font-editorial text-base font-bold text-gray-900 dark:text-[#fdfbf7]">
                {editingId ? 'Edit Article' : 'Create Nutrition Article'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-3.5 text-xs">
              <div>
                <label className="text-[10px] uppercase font-bold text-gray-600 dark:text-[#8b826f] block mb-1">
                  Article Title *
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Whole Wheat Atta vs Multigrain Atta"
                  className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-[#121212] border border-gray-300 dark:border-[#2e2a20] text-gray-900 dark:text-[#fdfbf7] font-semibold outline-none focus:border-[#C9A227]"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-600 dark:text-[#8b826f] block mb-1">
                    Hindi Subtitle (Optional)
                  </label>
                  <input
                    type="text"
                    value={form.hindiTitle}
                    onChange={(e) => setForm({ ...form, hindiTitle: e.target.value })}
                    placeholder="e.g. गेहूं का आटा बनाम मल्टीग्रेन आटा"
                    className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-[#121212] border border-gray-300 dark:border-[#2e2a20] text-gray-900 dark:text-[#fdfbf7] outline-none focus:border-[#C9A227]"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-600 dark:text-[#8b826f] block mb-1">
                    Category *
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-[#121212] border border-gray-300 dark:border-[#2e2a20] text-gray-900 dark:text-[#fdfbf7] outline-none focus:border-[#C9A227]"
                  >
                    {CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-600 dark:text-[#8b826f] block mb-1">
                    Read Time
                  </label>
                  <input
                    type="text"
                    value={form.readTime}
                    onChange={(e) => setForm({ ...form, readTime: e.target.value })}
                    placeholder="3 min read"
                    className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-[#121212] border border-gray-300 dark:border-[#2e2a20] text-gray-900 dark:text-[#fdfbf7] outline-none focus:border-[#C9A227]"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-600 dark:text-[#8b826f] block mb-1">
                    Status *
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-[#121212] border border-gray-300 dark:border-[#2e2a20] text-gray-900 dark:text-[#fdfbf7] outline-none focus:border-[#C9A227]"
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-600 dark:text-[#8b826f] block mb-1">
                    Related Product
                  </label>
                  <select
                    value={form.relatedProductSlug}
                    onChange={(e) => setForm({ ...form, relatedProductSlug: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-[#121212] border border-gray-300 dark:border-[#2e2a20] text-gray-900 dark:text-[#fdfbf7] outline-none focus:border-[#C9A227]"
                  >
                    <option value="">None</option>
                    {products.map(p => (
                      <option key={p.slug || p._id} value={p.slug}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-gray-600 dark:text-[#8b826f] block mb-1">
                  Summary / Excerpt (1-2 sentences) *
                </label>
                <textarea
                  rows="2"
                  value={form.summary}
                  onChange={(e) => setForm({ ...form, summary: e.target.value })}
                  placeholder="Short introductory summary for card preview"
                  className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-[#121212] border border-gray-300 dark:border-[#2e2a20] text-gray-900 dark:text-[#fdfbf7] outline-none focus:border-[#C9A227]"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-gray-600 dark:text-[#8b826f] block mb-1">
                  Full Article Content *
                </label>
                <textarea
                  rows="8"
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  placeholder="Detailed article paragraphs, bullets (•), or numbered points..."
                  className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-[#121212] border border-gray-300 dark:border-[#2e2a20] text-gray-900 dark:text-[#fdfbf7] outline-none focus:border-[#C9A227] font-sans leading-relaxed"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-gray-600 dark:text-[#8b826f] block mb-1">
                  Medical / Educational Disclaimer (Optional override)
                </label>
                <input
                  type="text"
                  value={form.disclaimer}
                  onChange={(e) => setForm({ ...form, disclaimer: e.target.value })}
                  placeholder="Defaults to standard Arogya Bhog dietary awareness disclaimer"
                  className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-[#121212] border border-gray-300 dark:border-[#2e2a20] text-gray-900 dark:text-[#fdfbf7] outline-none focus:border-[#C9A227]"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-gray-200 dark:border-[#2e2a20]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-gray-300 dark:border-[#383327] text-gray-700 dark:text-[#c4bcac] font-bold text-xs uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-[#C9A227] hover:bg-[#b8911f] disabled:opacity-50 text-white dark:text-[#121212] font-bold text-xs uppercase tracking-wider shadow-md transition-all"
                >
                  {isSubmitting ? 'Saving...' : (editingId ? 'Update Article' : 'Create Article')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default AdminArticlesSection;
