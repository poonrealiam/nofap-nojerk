
import React, { useState, useMemo, useRef } from 'react';
import { Send, MessageSquare, Heart, Filter, Plus, Camera, X, Shield, Zap, Quote } from 'lucide-react';
import { Post, UserProfile, PostComment } from '../types';

interface NewsProps {
  profile: UserProfile;
  posts: Post[];
  setPosts: React.Dispatch<React.SetStateAction<Post[]>>;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
}

const CATEGORIES = ['all', 'grow', 'help', 'sports', 'music', 'meditation'] as const;
type Category = (typeof CATEGORIES)[number];

const News: React.FC<NewsProps> = ({ profile, posts, setPosts, setProfile }) => {
  const [activeCategory, setActiveCategory] = useState<Category>('all');
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [postCategory, setPostCategory] = useState<Exclude<Category, 'all'>>('grow');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [commentingId, setCommentingId] = useState<string | null>(null);
  const [commentContent, setCommentContent] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredPosts = useMemo(() => {
    // Update central command to Spoon Realiam in the display logic if needed, 
    // but better to rely on the data. We'll map them here for consistency.
    const mappedPosts = posts.map(p => ({
      ...p,
      author: p.author === 'central command' ? 'spoon realiam' : p.author
    }));

    if (activeCategory === 'all') return mappedPosts;
    return mappedPosts.filter(post => post.category === activeCategory);
  }, [posts, activeCategory]);

  const today = new Date().toDateString();
  const canPost = profile.lastPostDate !== today;

  const handlePost = () => {
    if (!newPostContent.trim() && !selectedImage) return;
    
    const newPost: Post = {
      id: Math.random().toString(36).substr(2, 9),
      author: profile.name.toLowerCase(),
      authorAvatar: profile.avatar,
      content: newPostContent.toLowerCase(),
      timestamp: new Date().toISOString(),
      likes: 0,
      comments: [],
      imageUrl: selectedImage || undefined,
      category: postCategory
    };

    setPosts(prev => [newPost, ...prev]);
    setProfile(prev => ({ ...prev, lastPostDate: today }));
    setNewPostContent('');
    setSelectedImage(null);
    setIsComposerOpen(false);
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'grow': return 'text-emerald-400 border-emerald-400/20 bg-emerald-400/5';
      case 'help': return 'text-sky-400 border-sky-400/20 bg-sky-400/5';
      case 'sports': return 'text-orange-400 border-orange-400/20 bg-orange-400/5';
      case 'music': return 'text-purple-400 border-purple-400/20 bg-purple-400/5';
      case 'meditation': return 'text-indigo-400 border-indigo-400/20 bg-indigo-400/5';
      default: return 'text-zinc-500 border-zinc-500/20 bg-zinc-500/5';
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      <header className="flex justify-between items-end border-b border-white/5 pb-2">
        <div>
          <p className="text-[9px] font-black lowercase tracking-[0.2em] text-zinc-600">sector 04: transmissions</p>
          <h1 className="text-3xl font-black tracking-tighter text-white lowercase">the plaza</h1>
        </div>
        <button 
          onClick={() => setIsComposerOpen(!isComposerOpen)}
          disabled={!canPost}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-[9px] font-black lowercase tracking-widest transition-all ${
            !canPost ? 'bg-zinc-900 text-zinc-700 cursor-not-allowed' : 'bg-white text-black hover:opacity-80 active:scale-95 shadow-lg shadow-white/5'
          }`}
        >
          {isComposerOpen ? <X size={14} /> : <Plus size={14} />}
          {isComposerOpen ? 'cancel' : 'new transmission'}
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Main Feed Column */}
        <div className="lg:col-span-8 space-y-6">
          {/* Posting Composer */}
          {isComposerOpen && (
            <div className="bg-[#111] border border-white/10 p-5 rounded-[1.5rem] shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="flex gap-4 mb-4">
                 <div className="flex-1 space-y-4">
                    <textarea
                      value={newPostContent}
                      onChange={(e) => setNewPostContent(e.target.value)}
                      placeholder="broadcast to the network..."
                      className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-[11px] font-medium text-white focus:outline-none focus:border-white/20 transition-all h-28 resize-none placeholder:text-zinc-800"
                    />
                    
                    {selectedImage && (
                      <div className="relative inline-block">
                        <img src={selectedImage} className="max-h-40 rounded-xl border border-white/10 shadow-2xl" />
                        <button 
                          onClick={() => setSelectedImage(null)} 
                          className="absolute -top-2 -right-2 p-1.5 bg-white text-black rounded-full shadow-xl hover:scale-110 transition-transform"
                        >
                          <X size={12}/>
                        </button>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[8px] font-black lowercase text-zinc-600 tracking-wider ml-1">select partition</label>
                        <div className="flex flex-wrap gap-2">
                          {CATEGORIES.filter(c => c !== 'all').map(cat => (
                            <button
                              key={cat}
                              onClick={() => setPostCategory(cat as any)}
                              className={`px-3 py-1 rounded-lg text-[8px] font-black lowercase tracking-wider border transition-all ${
                                postCategory === cat ? 'bg-white text-black border-white' : 'bg-black/40 text-zinc-500 border-white/5 hover:border-white/20'
                              }`}
                            >
                              {cat}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                 </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-white/5">
                <button 
                  onClick={() => fileInputRef.current?.click()} 
                  className="flex items-center gap-2 text-[9px] font-black lowercase tracking-widest text-zinc-500 hover:text-white transition-colors"
                >
                  <Camera size={16} /> attach visuals
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={(e) => {
                    const f = e.target.files?.[0]; 
                    if (f) { 
                      const r = new FileReader(); 
                      r.onload = () => setSelectedImage(r.result as string); 
                      r.readAsDataURL(f); 
                    }
                  }} 
                  accept="image/*" 
                  className="hidden" 
                />
                <button 
                  onClick={handlePost}
                  disabled={!newPostContent.trim() && !selectedImage}
                  className="bg-white text-black px-8 py-2.5 rounded-xl text-[10px] font-black lowercase tracking-[0.2em] hover:opacity-90 active:scale-95 transition-all shadow-xl shadow-white/5"
                >
                  publish transmission
                </button>
              </div>
            </div>
          )}

          {/* Partitions Filter Bar */}
          <div className="sticky top-16 md:top-20 z-30 flex flex-wrap gap-2 py-3 bg-[#0a0a0a]/90 backdrop-blur-md border-b border-white/5">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-[9px] font-black lowercase tracking-wider transition-all border ${
                  activeCategory === cat 
                  ? 'bg-white text-black border-white shadow-lg shadow-white/5' 
                  : 'bg-black/40 text-zinc-600 border-white/5 hover:border-white/20'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="space-y-6">
            {filteredPosts.length === 0 ? (
              <div className="py-24 text-center space-y-4">
                <div className="w-16 h-16 bg-zinc-900/50 rounded-full flex items-center justify-center mx-auto border border-white/5">
                  <Filter size={24} className="text-zinc-700" />
                </div>
                <p className="text-[10px] font-black lowercase tracking-[0.3em] text-zinc-800 italic">no data in this sector</p>
              </div>
            ) : (
              filteredPosts.map(post => (
                <article key={post.id} className="bg-[#111]/80 backdrop-blur-xl border border-white/5 rounded-[2rem] overflow-hidden shadow-2xl transition-all hover:border-white/10 group">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-5">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <img src={post.authorAvatar} className="w-9 h-9 rounded-full border border-white/10 bg-black object-cover" />
                          {(post.author === 'central command' || post.author === 'spoon realiam') && (
                            <div className="absolute -bottom-1 -right-1 bg-white text-black rounded-full p-0.5 border border-black">
                              <Shield size={8} />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-[11px] font-black lowercase text-white tracking-tight leading-none">{post.author}</h3>
                            {(post.author === 'central command' || post.author === 'spoon realiam') && (
                              <span className="bg-white/10 border border-white/20 px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-tighter text-zinc-400">auth_sig</span>
                            )}
                          </div>
                          <p className="text-[8px] font-black lowercase text-zinc-600 tracking-wider mt-1">{new Date(post.timestamp).toLocaleDateString()}</p>
                        </div>
                      </div>
                      {post.category && (
                        <span className={`px-2.5 py-1 rounded-lg border text-[8px] font-black uppercase tracking-widest ${getCategoryColor(post.category)}`}>
                          {post.category}
                        </span>
                      )}
                    </div>
                    
                    <p className="text-[12px] font-medium lowercase tracking-tight text-zinc-300 leading-relaxed mb-5 whitespace-pre-wrap">{post.content}</p>
                    
                    {post.imageUrl && (
                      <div className="mb-5 rounded-[1.5rem] overflow-hidden border border-white/5 bg-black/40">
                        <img src={post.imageUrl} className="w-full h-auto max-h-[500px] object-contain mx-auto" />
                      </div>
                    )}

                    <div className="flex gap-8 pt-2">
                      <button 
                        onClick={() => setPosts(prev => prev.map(p => p.id === post.id ? {...p, likes: p.likes+1} : p))} 
                        className="flex items-center gap-2 text-[10px] font-black lowercase text-zinc-500 hover:text-white transition-colors group/btn"
                      >
                        <Heart size={16} className={`transition-all ${post.likes > 0 ? 'text-red-500 fill-red-500 scale-110' : 'group-hover/btn:scale-110'}`} /> 
                        <span>{post.likes}</span>
                      </button>
                      <button 
                        onClick={() => setCommentingId(commentingId === post.id ? null : post.id)} 
                        className="flex items-center gap-2 text-[10px] font-black lowercase text-zinc-500 hover:text-white transition-colors group/btn"
                      >
                        <MessageSquare size={16} className="group-hover/btn:scale-110 transition-transform" /> 
                        <span>{post.comments.length}</span>
                      </button>
                    </div>
                  </div>

                  {commentingId === post.id && (
                    <div className="p-6 bg-black/40 border-t border-white/5 animate-in slide-in-from-top-2 duration-300">
                      <div className="flex gap-3 mb-6">
                        <input 
                          type="text" 
                          value={commentContent} 
                          onChange={(e) => setCommentContent(e.target.value)} 
                          placeholder="reply to transmission..." 
                          className="flex-1 bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-[10px] font-medium text-white focus:outline-none focus:border-white/30 transition-all placeholder:text-zinc-800" 
                        />
                        <button 
                          onClick={() => {
                            if (!commentContent.trim()) return;
                            const c: PostComment = { 
                              id: Math.random().toString(), 
                              author: profile.name.toLowerCase(), 
                              content: commentContent.toLowerCase(), 
                              timestamp: new Date().toISOString() 
                            };
                            setPosts(prev => prev.map(p => p.id === post.id ? {...p, comments: [...p.comments, c]} : p));
                            setCommentContent('');
                          }} 
                          className="bg-white text-black px-4 rounded-xl hover:opacity-80 active:scale-95 transition-all shadow-lg shadow-white/5"
                        >
                          <Send size={16} />
                        </button>
                      </div>
                      <div className="space-y-5">
                        {post.comments.length === 0 ? (
                          <p className="text-[8px] font-black lowercase tracking-[0.2em] text-zinc-800 text-center py-4">no responses logged</p>
                        ) : (
                          post.comments.map(c => (
                            <div key={c.id} className="flex gap-3 group/comment">
                              <div className="w-6 h-6 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center text-[8px] font-black lowercase text-zinc-500 shrink-0">
                                {c.author[0]}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="text-[9px] font-black text-white lowercase tracking-tight leading-none">{c.author}</p>
                                  <span className="text-[6px] text-zinc-800 font-black tracking-widest">{new Date(c.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                                </div>
                                <p className="text-[10px] font-medium text-zinc-500 leading-relaxed mt-1.5">{c.content}</p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </article>
              ))
            )}
          </div>
        </div>

        {/* Owner's Corner Column */}
        <div className="lg:col-span-4 sticky top-24 space-y-6">
          <div className="bg-[#111] border border-white/10 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
            <div className="absolute -top-4 -right-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Shield size={160} className="text-white" />
            </div>
            
            <div className="relative z-10 space-y-6 text-center">
              <div className="inline-block relative">
                <div className="w-24 h-24 rounded-full border-2 border-white/20 p-1 mb-4 mx-auto bg-gradient-to-tr from-zinc-800 to-zinc-950 overflow-hidden shadow-2xl">
                  <img src="https://api.dicebear.com/7.x/bottts/svg?seed=spoon" className="w-full h-full object-cover rounded-full" alt="Spoon Realiam" />
                </div>
                <div className="absolute -bottom-1 right-2 bg-white text-black rounded-full p-1 border-2 border-black">
                  <Shield size={12} />
                </div>
              </div>

              <div>
                <h2 className="logo-font text-2xl font-normal text-white lowercase leading-none tracking-tight">spoon realiam</h2>
                <p className="text-[8px] font-black uppercase tracking-[0.3em] text-zinc-600 mt-2">vanguard / founder</p>
              </div>

              <div className="relative pt-6 pb-2">
                <Quote size={24} className="absolute -top-2 -left-2 text-white/10" />
                <p className="text-base font-black italic lowercase tracking-tight text-zinc-300 leading-snug">
                  "the strongest steel is forged in the hottest fires. your discipline today is the architecture of your tomorrow."
                </p>
              </div>

              <div className="pt-4 flex items-center justify-center gap-2 text-emerald-500">
                <Zap size={10} />
                <span className="text-[8px] font-black uppercase tracking-widest">command verified</span>
              </div>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 p-5 rounded-[1.5rem] shadow-xl">
             <h3 className="text-[9px] font-black lowercase tracking-[0.2em] text-zinc-600 mb-3">sector status</h3>
             <div className="space-y-3">
                <div className="flex justify-between items-center bg-black/40 p-3 rounded-xl border border-white/5">
                   <span className="text-[10px] font-black text-zinc-500 lowercase">transmissions</span>
                   <span className="text-xs font-black text-white">{posts.length}</span>
                </div>
                <div className="flex justify-between items-center bg-black/40 p-3 rounded-xl border border-white/5">
                   <span className="text-[10px] font-black text-zinc-500 lowercase">network load</span>
                   <span className="text-xs font-black text-emerald-500">nominal</span>
                </div>
             </div>
          </div>
        </div>
      </div>
      
      {/* Footer system status */}
      <div className="flex items-center justify-center gap-2 opacity-20 py-10">
        <Zap size={10} className="text-white" />
        <span className="text-[7px] font-black lowercase tracking-[0.5em]">network stream optimized</span>
      </div>
    </div>
  );
};

export default News;
