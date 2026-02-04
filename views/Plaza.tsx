
import React, { useState, useMemo, useRef } from 'react';
import { Send, MessageSquare, Heart, Plus, Camera, X, Shield, Zap, Quote, Radio, Flame, Lock, Clock } from 'lucide-react';
import { Post, UserProfile, PostComment } from '../types';
import { translations } from '../translations';
import { savePost, updatePostLikes, saveComment, getComments } from '../services/databaseService';

interface PlazaProps {
  profile: UserProfile;
  posts: Post[];
  setPosts: React.Dispatch<React.SetStateAction<Post[]>>;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
}

const CATEGORIES = ['all', 'grow', 'help', 'sports', 'music', 'meditation'] as const;
type Category = (typeof CATEGORIES)[number];

const Plaza: React.FC<PlazaProps> = ({ profile, posts, setPosts, setProfile }) => {
  const t = translations[profile.language || 'en'];
  const [activeCategory, setActiveCategory] = useState<Category>('all');
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [postCategory, setPostCategory] = useState<Exclude<Category, 'all'>>('grow');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [commentingId, setCommentingId] = useState<string | null>(null);
  const [commentContent, setCommentContent] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const today = new Date().toDateString();
  const canPost = profile.lastPostDate !== today;
  const canReply = profile.commentsTodayCount < 20;

  const filteredPosts = useMemo(() => {
    const mappedPosts = posts.map(p => ({ ...p, author: p.author === 'central command' ? 'spoon realiam' : p.author }));
    if (activeCategory === 'all') return mappedPosts;
    return mappedPosts.filter(post => post.category === activeCategory);
  }, [posts, activeCategory]);

  const handlePost = async () => {
    if (!canPost || !profile.authIdentifier) {
      alert("Broadcast quota exhausted. One transmission allowed per solar cycle.");
      return;
    }
    if (!newPostContent.trim() && !selectedImage) return;
    
    try {
      const savedPost = await savePost(profile.authIdentifier, {
        content: newPostContent.toLowerCase(),
        imageUrl: selectedImage || undefined,
        category: postCategory,
        timestamp: new Date().toISOString()
      });
      
      const newPost: Post = {
        id: savedPost.id,
        author: profile.preferences.stealthMode ? 'anonymous' : profile.name.toLowerCase(),
        authorAvatar: profile.preferences.stealthMode ? `https://api.dicebear.com/7.x/bottts/svg?seed=${Math.random()}` : profile.avatar,
        content: newPostContent.toLowerCase(), 
        timestamp: savedPost.created_at,
        likes: 0, 
        comments: [], 
        imageUrl: selectedImage || undefined, 
        category: postCategory,
        streak: savedPost.streak_at_time,
        season: savedPost.season_at_time
      };
      
      setPosts(prev => [newPost, ...prev]);
      setProfile(prev => ({ ...prev, lastPostDate: today }));
      setNewPostContent(''); setSelectedImage(null); setIsComposerOpen(false);
    } catch (error) {
      console.error('Failed to save post:', error);
      alert("Failed to broadcast. Please try again.");
    }
  };

  const handleSendComment = async (postId: string) => {
    if (!canReply || !profile.authIdentifier) {
      alert("Neural reply quota exhausted. 20 responses allowed per solar cycle.");
      return;
    }
    if (!commentContent.trim()) return;

    try {
      const savedComment = await saveComment(profile.authIdentifier, postId, {
        content: commentContent.toLowerCase()
      });
      
      const newComment: PostComment = {
        id: savedComment.id,
        author: profile.preferences.stealthMode ? 'anonymous' : profile.name.toLowerCase(),
        content: commentContent.toLowerCase(),
        timestamp: savedComment.created_at
      };

      setPosts(prev => prev.map(p => p.id === postId ? { ...p, comments: [...p.comments, newComment] } : p));
      setProfile(prev => ({ ...prev, commentsTodayCount: prev.commentsTodayCount + 1 }));
      setCommentContent('');
    } catch (error: any) {
      console.error('Failed to save comment:', error);
      if (error.message?.includes('quota')) {
        alert("Neural reply quota exhausted. 20 responses allowed per solar cycle.");
      } else {
        alert("Failed to send reply. Please try again.");
      }
    }
  };

  return (
    <div className="relative space-y-6 pt-20">
      {/* Background Icon Decoration */}
      <div className="absolute top-0 right-0 opacity-[0.03] text-white pointer-events-none transform translate-x-1/4 -translate-y-1/4">
        <Radio size={320} />
      </div>

      <header className="relative z-10 flex flex-col md:flex-row md:items-end justify-between border-b border-white/5 pb-4 gap-4">
        <div>
          <p className="text-[8px] font-black lowercase tracking-[0.3em] text-zinc-600 uppercase">{t.plaza.sector}</p>
          <h1 className="text-3xl font-black tracking-tighter text-white lowercase leading-none">{t.plaza.title}</h1>
        </div>
        <button onClick={() => setIsComposerOpen(!isComposerOpen)} disabled={!canPost}
          className={`flex items-center gap-3 px-6 py-2.5 rounded-xl text-[9px] font-black lowercase tracking-widest transition-all active:scale-[0.95] shadow-2xl ${ !canPost ? 'bg-white/[0.03] text-zinc-700 cursor-not-allowed border border-white/5' : 'bg-white text-black hover:bg-emerald-500 shadow-white/5' }`}>
          {isComposerOpen ? <X size={16} /> : canPost ? <Plus size={16} strokeWidth={3} /> : <Lock size={16} />}
          {!canPost ? 'Quota Full' : isComposerOpen ? 'cancel' : t.plaza.new_broadcast}
        </button>
      </header>

      {isComposerOpen && (
        <div className="relative z-10 bg-[#111] border border-white/10 p-6 rounded-2xl shadow-2xl space-y-6 animate-in slide-in-from-top-4 duration-300">
          <textarea value={newPostContent} onChange={(e) => setNewPostContent(e.target.value)} placeholder={t.plaza.share_intel}
            className="w-full bg-black border border-white/10 rounded-xl p-6 text-[13px] font-medium text-white focus:outline-none h-32 resize-none placeholder:text-zinc-800 shadow-inner" />
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-4 border-t border-white/5">
             <div className="flex items-center gap-6">
               <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 text-[9px] font-black lowercase tracking-widest text-zinc-500 hover:text-white transition-all active:scale-95">
                 <Camera size={18}/> visuals
               </button>
               <select value={postCategory} onChange={(e) => setPostCategory(e.target.value as any)} className="bg-transparent text-[10px] font-black text-emerald-500 lowercase focus:outline-none cursor-pointer">
                  {CATEGORIES.filter(c => c !== 'all').map(c => <option key={c} value={c} className="bg-[#111]">{c}</option>)}
               </select>
             </div>
             <button onClick={handlePost} className="w-full md:w-auto bg-white text-black px-8 py-3 rounded-xl text-[10px] font-black lowercase tracking-widest active:scale-[0.95] hover:bg-emerald-500 transition-all shadow-xl shadow-white/5">
               {t.plaza.broadcast_comms}
             </button>
          </div>
          <input type="file" ref={fileInputRef} onChange={(e) => {const f=e.target.files?.[0]; if(f){const r=new FileReader(); r.onload=()=>setSelectedImage(r.result as string); r.readAsDataURL(f);}}} accept="image/*" className="hidden" />
        </div>
      )}

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 space-y-6">
          <div className="flex gap-2 py-1 overflow-x-auto no-scrollbar">
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-4 py-1.5 rounded-full text-[9px] font-black lowercase tracking-widest border transition-all whitespace-nowrap active:scale-[0.9] ${activeCategory === cat ? 'bg-white text-black border-white shadow-lg shadow-white/5' : 'bg-white/[0.03] text-zinc-600 border-white/5 hover:text-white hover:bg-white/10'}`}>
                {cat}
              </button>
            ))}
          </div>

          <div className="space-y-6">
            {filteredPosts.map(post => (
              <article key={post.id} className="bg-[#111] border border-white/5 rounded-2xl overflow-hidden shadow-2xl transition-all hover:border-white/10 group">
                 <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                       <div className="flex items-center gap-3">
                         <div className="relative">
                           <img src={post.authorAvatar} className="w-10 h-10 rounded-full border border-white/10 bg-black object-cover" />
                           {post.author === 'spoon realiam' && <div className="absolute -bottom-1 -right-1 bg-white text-black rounded-full p-0.5 border border-[#111] shadow-xl"><Shield size={8} fill="currentColor" /></div>}
                         </div>
                         <div>
                           <div className="flex items-center gap-2">
                             <h3 className={`text-[11px] font-black lowercase leading-none tracking-tight ${post.author === 'spoon realiam' ? 'text-emerald-500' : 'text-white'}`}>{post.author}</h3>
                             {post.author !== 'spoon realiam' && post.author !== 'anonymous' && (
                               <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-2 py-0.5 rounded text-[7px] font-black uppercase tracking-tighter shadow-inner">
                                 <span className="text-emerald-500 flex items-center gap-0.5"><Flame size={7} fill="currentColor" /> {post.streak ?? 0}d</span>
                                 <span className="text-zinc-700">|</span>
                                 <span className="text-white">s{post.season ?? 1}</span>
                               </div>
                             )}
                           </div>
                           <div className="flex items-center gap-1.5 text-[7px] font-black text-zinc-600 lowercase mt-1">
                             <Clock size={8} />
                             <span>{new Date(post.timestamp).toLocaleDateString()} • {new Date(post.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                           </div>
                         </div>
                       </div>
                       <span className="px-2 py-1 bg-white/[0.03] border border-white/5 rounded text-[7px] font-black uppercase text-zinc-500">{post.category}</span>
                    </div>
                    {post.imageUrl && (
                      <div className="mb-4 rounded-xl overflow-hidden border border-white/5 bg-black/40">
                        <img src={post.imageUrl} className="w-full h-auto max-h-[500px] object-contain mx-auto" />
                      </div>
                    )}
                    <p className="text-[13px] font-medium text-zinc-300 leading-relaxed mb-4 whitespace-pre-wrap">{post.content}</p>
                    <div className="flex gap-8 pt-4 border-t border-white/5">
                       <button onClick={async () => {
                         try {
                           await updatePostLikes(post.id, 1);
                           setPosts(prev => prev.map(p => p.id === post.id ? {...p, likes: p.likes+1} : p));
                         } catch (error) {
                           console.error('Failed to update likes:', error);
                         }
                       }} className="flex items-center gap-2 text-[10px] font-black text-zinc-500 hover:text-white transition-all active:scale-95 group/like">
                          <Heart size={18} className={`transition-transform group-active/like:scale-125 ${post.likes > 0 ? 'text-red-500 fill-red-500' : ''}`} />
                          <span>{post.likes}</span>
                       </button>
                       <button onClick={() => setCommentingId(commentingId === post.id ? null : post.id)} className="flex items-center gap-2 text-[10px] font-black text-zinc-500 hover:text-white transition-all active:scale-95 group/comment">
                          <MessageSquare size={18} className="group-active/comment:scale-110 transition-transform" />
                          <span>{post.comments.length}</span>
                       </button>
                    </div>

                    {commentingId === post.id && (
                      <div className="mt-6 pt-6 border-t border-white/5 space-y-4 animate-in fade-in duration-300">
                        <div className="flex items-center justify-between px-1">
                          <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Neural Replies</span>
                          <span className={`text-[8px] font-black tracking-widest ${canReply ? 'text-emerald-500' : 'text-red-500'}`}>
                            {profile.commentsTodayCount}/20 Utilized
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            value={commentContent} 
                            onChange={(e) => setCommentContent(e.target.value)} 
                            placeholder={canReply ? "Transmit reply..." : "Daily reply quota reached."}
                            disabled={!canReply}
                            className="flex-1 bg-black border border-white/10 rounded-xl px-4 py-2 text-[11px] font-medium text-white focus:outline-none focus:border-white/30 transition-all placeholder:text-zinc-800" 
                          />
                          <button 
                            onClick={() => handleSendComment(post.id)}
                            disabled={!canReply || !commentContent.trim()}
                            className={`p-2 rounded-xl transition-all active:scale-95 ${canReply ? 'bg-white text-black hover:bg-emerald-500' : 'bg-zinc-900 text-zinc-700 cursor-not-allowed'}`}
                          >
                            <Send size={16} />
                          </button>
                        </div>
                        <div className="space-y-3">
                          {post.comments.map(comment => (
                            <div key={comment.id} className="bg-white/[0.02] border border-white/5 p-3 rounded-xl">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[9px] font-black text-zinc-400">{comment.author}</span>
                                <span className="text-[7px] text-zinc-600 uppercase font-black">{new Date(comment.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                              </div>
                              <p className="text-[11px] text-zinc-300">{comment.content}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                 </div>
              </article>
            ))}
          </div>
        </div>

        <div className="lg:col-span-4 sticky top-20 space-y-6">
          <div className="bg-[#111] border border-white/10 p-6 rounded-2xl text-center space-y-6 relative overflow-hidden group">
            <div className="relative z-10 space-y-4">
              <div className="w-20 h-20 rounded-full border-2 border-emerald-500/10 p-1 mx-auto bg-zinc-950 overflow-hidden">
                <img src="https://api.dicebear.com/7.x/bottts/svg?seed=spoon" className="w-full h-full object-cover rounded-full" />
              </div>
              <div>
                <h2 className="logo-font text-xl text-white tracking-tight leading-none">spoon realiam</h2>
                <p className="text-[8px] font-black uppercase tracking-widest text-zinc-600 mt-1">{t.plaza.vanguard_founder}</p>
              </div>
              <p className="text-[12px] font-black italic text-zinc-400 lowercase leading-snug">"discipline is the defensive fortress of your future self."</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Plaza;
