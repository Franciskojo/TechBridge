import React, { useState, useEffect } from 'react';
import { KnowledgeArticle, TicketCategory } from '../../types';
import { fetchKnowledgeArticlesApi, fetchCategoriesApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Search, BookOpen, ThumbsUp, Eye, Tag, ArrowLeft } from 'lucide-react';

export const KnowledgeBaseHub: React.FC = () => {
  const { token } = useAuth();
  const [kbList, setKbList] = useState<KnowledgeArticle[]>([]);
  const [categoriesList, setCategoriesList] = useState<TicketCategory[]>([]);
  const [search, setSearch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeArticle, setActiveArticle] = useState<KnowledgeArticle | null>(null);

  useEffect(() => {
    fetchKnowledgeArticlesApi(token).then((data) => setKbList(data));
    fetchCategoriesApi().then((cats) => setCategoriesList(cats));
  }, [token]);

  const articles = kbList.filter((article) => {
    const matchesSearch =
      article.title.toLowerCase().includes(search.toLowerCase()) ||
      article.body.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCategory === 'all' || article.category?.name === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="max-w-2xl space-y-3">
          <h2 className="text-xl font-extrabold text-white flex items-center">
            <BookOpen className="w-5 h-5 mr-2.5 text-blue-400" /> IT Knowledge Base & Troubleshooting Guides
          </h2>
          <p className="text-xs text-slate-300">
            Search step-by-step resolution guides, password reset procedures, and network connection fixes.
          </p>

          <div className="relative pt-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
            <input
              type="text"
              placeholder="Search knowledge base..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
            selectedCategory === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          All Articles
        </button>
        {categoriesList.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.name)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
              selectedCategory === cat.name ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Article Detail View vs Grid */}
      {activeArticle ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
          <button
            onClick={() => setActiveArticle(null)}
            className="flex items-center text-xs font-bold text-blue-400 hover:text-blue-300"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Knowledge Base
          </button>

          <div>
            <span className="text-[10px] uppercase tracking-wider font-bold bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20">
              {activeArticle.category?.name}
            </span>
            <h2 className="text-xl font-bold text-white mt-2">{activeArticle.title}</h2>
            <p className="text-xs text-slate-400 mt-1">Author: {activeArticle.author?.name} • Published</p>
          </div>

          <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-5 text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
            {activeArticle.body}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {articles.map((article) => (
            <div
              key={article.id}
              onClick={() => setActiveArticle(article)}
              className="bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 hover:border-blue-500/50 rounded-xl p-4 transition cursor-pointer space-y-3 group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                  {article.category?.name || 'General'}
                </span>
                <div className="flex items-center space-x-3 text-[11px] text-slate-500">
                  <span className="flex items-center"><Eye className="w-3 h-3 mr-1" /> {article.views}</span>
                  <span className="flex items-center text-emerald-400 font-semibold"><ThumbsUp className="w-3 h-3 mr-1" /> {article.helpful_count}</span>
                </div>
              </div>

              <h3 className="text-sm font-bold text-white group-hover:text-blue-300 transition">{article.title}</h3>
              <p className="text-xs text-slate-400 line-clamp-3">{article.body.replace(/[#*]/g, '')}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
