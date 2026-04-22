import React, { useState, useContext, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Star, 
  MessageSquare, 
  ThumbsUp, 
  ThumbsDown, 
  CornerDownRight, 
  Send, 
  User, 
  Crown, 
  Trash2, 
  Clock,
  ShieldCheck,
  MoreVertical
} from 'lucide-react';
import { AppContext } from '../store/AppContext';
import toast from 'react-hot-toast';
import axios from 'axios';

interface Reply {
  id: string;
  username: string;
  text: string;
  timestamp: string;
  isOwner?: boolean;
}

interface Review {
  id: string;
  username: string;
  rating: number;
  comment: string;
  timestamp: string;
  likes: number;
  dislikes: number;
  replies: Reply[];
}

export default function CommunitySignalView() {
  const { currentUser, isOwner } = useContext(AppContext);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyTarget, setReplyTarget] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const fetchReviews = async () => {
    try {
      const res = await axios.get('/api/data');
      if (res.data.success) {
        setReviews(res.data.reviews || []);
      }
    } catch (e) {
      console.error("Gagal memuat ulasan", e);
    }
  };

  useEffect(() => {
    fetchReviews();
    const interval = setInterval(fetchReviews, 10000); // Polling every 10s
    return () => clearInterval(interval);
  }, []);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return toast.error("Silakan login untuk memberi ulasan");
    if (!comment.trim()) return toast.error("Komentar tidak boleh kosong");

    setIsSubmitting(true);
    try {
      const res = await axios.post('/api/reviews', {
        action: 'add',
        review: {
          username: currentUser.username,
          rating,
          comment: comment.trim()
        }
      });
      if (res.data.success) {
        setReviews(res.data.reviews);
        setComment('');
        setRating(5);
        toast.success("Ulasan berhasil dikirim!");
      }
    } catch (e) {
      toast.error("Gagal mengirim ulasan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVote = async (reviewId: string, voteType: 'like' | 'dislike') => {
    try {
      const res = await axios.post('/api/reviews', {
        action: 'vote',
        reviewId,
        voteType
      });
      if (res.data.success) {
        setReviews(res.data.reviews);
      }
    } catch (e) {
      toast.error("Gagal memberikan vote");
    }
  };

  const handleReply = async (reviewId: string) => {
    if (!replyText.trim()) return;
    try {
      const res = await axios.post('/api/reviews', {
        action: 'reply',
        reviewId,
        reply: {
          username: currentUser?.username || 'Guest',
          text: replyText.trim(),
          isOwner: isOwner
        }
      });
      if (res.data.success) {
        setReviews(res.data.reviews);
        setReplyText('');
        setReplyTarget(null);
        toast.success("Balasan dikirim!");
      }
    } catch (e) {
      toast.error("Gagal mengirim balasan");
    }
  };

  const handleDelete = async (reviewId: string) => {
    if (!confirm("Hapus ulasan ini?")) return;
    try {
      const res = await axios.post('/api/reviews', {
        action: 'delete',
        reviewId,
        isOwner: true
      });
      if (res.data.success) {
        setReviews(res.data.reviews);
        toast.success("Ulasan dihapus");
      }
    } catch (e) {
      toast.error("Gagal menghapus");
    }
  };

  const formatDate = (isoStr: string) => {
    const d = new Date(isoStr);
    return d.toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-24">
      {/* Header Section */}
      <div className="text-center space-y-2 pt-4">
        <motion.h2 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl md:text-4xl font-black text-white tracking-tighter flex items-center justify-center gap-3"
        >
          <MessageSquare className="text-primary animate-bounce" size={32} />
          COMMUNITY SIGNAL
        </motion.h2>
        <p className="text-slate-400 text-sm md:text-base font-medium">Ulasan & Testimoni Pengguna tools barzzx</p>
      </div>

      {/* Write Review Form */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[#0f172a]/80 backdrop-blur-xl border border-slate-800 p-6 rounded-3xl shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        
        <form onSubmit={handleSubmitReview} className="space-y-4 relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-300 uppercase tracking-widest">Beri Rating:</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="focus:outline-none transition-transform hover:scale-125"
                  >
                    <Star 
                      size={24} 
                      className={`${star <= rating ? 'text-amber-400 fill-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.5)]' : 'text-slate-600'}`} 
                    />
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
              <User size={14}/> {currentUser?.username || 'Belum Login'}
            </div>
          </div>

          <div className="relative">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Berikan ulasan Anda tentang fitur web ini..."
              className="w-full bg-slate-900/50 border border-slate-700 rounded-2xl p-4 text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none min-h-[100px] resize-none transition-all placeholder-slate-600"
            />
          </div>

          <button 
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary hover:bg-primary/90 text-white font-black py-3 rounded-xl shadow-lg shadow-primary/25 flex items-center justify-center gap-2 transition-all transform active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? 'MENGIRIM...' : <><Send size={18}/> PUBLIKASIKAN ULASAN</>}
          </button>
        </form>
      </motion.div>

      {/* Reviews List */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-lg font-bold text-slate-300 flex items-center gap-2">
            Terbaru ({reviews.length})
          </h3>
        </div>

        <AnimatePresence>
          {reviews.map((rev, idx) => (
            <motion.div
              key={rev.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="group relative"
            >
              <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-5 md:p-6 shadow-xl hover:border-primary/30 transition-all">
                {/* Review Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-primary font-bold shadow-inner">
                      {rev.username[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{rev.username}</span>
                        {rev.username === 'Owner' && <Crown size={14} className="text-amber-500 fill-amber-500"/>}
                      </div>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={12} className={i < rev.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-700'} />
                        ))}
                        <span className="text-[10px] text-slate-500 font-mono ml-2">{formatDate(rev.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                  {isOwner && (
                    <button onClick={() => handleDelete(rev.id)} className="text-slate-600 hover:text-rose-500 transition-colors">
                      <Trash2 size={18}/>
                    </button>
                  )}
                </div>

                {/* Review Content */}
                <p className="text-slate-300 text-sm md:text-base leading-relaxed mb-4">
                  {rev.comment}
                </p>

                {/* Interaction Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-800/50">
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => handleVote(rev.id, 'like')}
                      className="flex items-center gap-1.5 text-slate-500 hover:text-emerald-400 transition-colors group/vote"
                    >
                      <ThumbsUp size={16} className="group-active/vote:scale-125 transition-transform"/>
                      <span className="text-xs font-bold">{rev.likes}</span>
                    </button>
                    <button 
                      onClick={() => handleVote(rev.id, 'dislike')}
                      className="flex items-center gap-1.5 text-slate-500 hover:text-rose-400 transition-colors group/vote"
                    >
                      <ThumbsDown size={16} className="group-active/vote:scale-125 transition-transform"/>
                      <span className="text-xs font-bold">{rev.dislikes}</span>
                    </button>
                  </div>
                  <button 
                    onClick={() => setReplyTarget(replyTarget === rev.id ? null : rev.id)}
                    className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-primary transition-colors bg-slate-900/50 px-3 py-1.5 rounded-full border border-slate-800"
                  >
                    <MessageSquare size={14}/> {rev.replies.length} Balasan
                  </button>
                </div>

                {/* Replies Section */}
                <AnimatePresence>
                  {replyTarget === rev.id && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-4 space-y-3 pl-4 md:pl-8 border-l-2 border-slate-800">
                        {rev.replies.map(reply => (
                          <div key={reply.id} className="bg-slate-900/30 p-3 rounded-2xl border border-slate-800/50 relative">
                            <div className="flex justify-between items-center mb-1">
                              <span className={`text-[10px] font-bold uppercase tracking-tighter flex items-center gap-1 ${reply.isOwner ? 'text-amber-500' : 'text-primary'}`}>
                                {reply.isOwner && <ShieldCheck size={10}/>} {reply.username} {reply.isOwner && '(Owner)'}
                              </span>
                              <span className="text-[9px] text-slate-600 font-mono">{formatDate(reply.timestamp)}</span>
                            </div>
                            <p className="text-xs text-slate-400">{reply.text}</p>
                          </div>
                        ))}
                        
                        {/* Reply Input */}
                        <div className="flex gap-2 pt-2">
                          <input 
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleReply(rev.id)}
                            placeholder="Tulis balasan..."
                            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:ring-1 focus:ring-primary outline-none"
                          />
                          <button 
                            onClick={() => handleReply(rev.id)}
                            className="p-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all"
                          >
                            <Send size={14}/>
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {reviews.length === 0 && (
          <div className="text-center py-16 bg-[#0f172a]/30 border border-dashed border-slate-800 rounded-3xl">
             <MessageSquare size={48} className="mx-auto text-slate-700 mb-4 opacity-20" />
             <p className="text-slate-500 font-medium">Belum ada ulasan. Jadi yang pertama memberi sinyal!</p>
          </div>
        )}
      </div>
    </div>
  );
}
