import React, { useState, useEffect } from 'react';
import { Button, Card, SectionTitle } from '../components/UI';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  doc, 
  updateDoc, 
  increment,
  onSnapshot,
  serverTimestamp,
  setDoc,
  deleteDoc
} from 'firebase/firestore';
import { 
  MessageSquare, 
  Heart, 
  Plus, 
  User as UserIcon, 
  Clock, 
  ChevronRight,
  Loader2,
  Trash2,
  Edit2,
  X,
  Calendar,
  ShieldAlert
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';

interface Post {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  title: string;
  likesCount: number;
  isAnonymous: boolean;
  createdAt: any;
  userLiked?: boolean;
}

interface ResilienceStory {
  name: string;
  handle: string;
  photo: string;
  shortStory: string;
  fullStory: string;
  date: string;
  category: 'Depression' | 'Anxiety' | 'Sadness' | 'Loneliness';
}

interface Story {
  id: string;
  name: string;
  handle: string;
  photo: string;
  content: string;
  category: string;
  likesCount: number;
}

const resilienceStories: ResilienceStory[] = [
  {
    name: "Ghanshyam Jha",
    handle: "@ghanshyam_jha",
    photo: "https://i.pravatar.cc/150?u=ghanshyam",
    shortStory: "I spent years in the shadows of depression, feeling like the world was moving on without me. It wasn't until I found my voice that I started healing...",
    fullStory: "I spent years in the shadows of depression, feeling like the world was moving on without me. Every morning felt like an insurmountable mountain. It wasn't until I joined this community and started sharing my small daily achievements that I realized the power of human connection. The support I received here, even from strangers, gave me the strength to seek professional help. Today, I'm not just surviving; I'm thriving and helping others find their way back to the light. Healing isn't linear, but it's possible.",
    date: "May 1, 2024",
    category: 'Depression'
  },
  {
    name: "Priya Sharma",
    handle: "@priya_sharma",
    photo: "https://i.pravatar.cc/150?u=priya",
    shortStory: "Anxiety used to paralyze me. Simple tasks felt like life-or-death situations. Through mindfulness and the Zen Zone games, I found my ground...",
    fullStory: "Anxiety used to be a constant noise in my head, making even the simplest social interactions feel like a battle. I was trapped in a cycle of overthinking and panic. The tools on this platform, especially the breathing exercises and the community's empathetic responses to my 'venting', taught me how to center myself. I learned that my anxiety doesn't define me. Now, I use my experience to help others recognize their triggers and find their own calming techniques.",
    date: "April 28, 2024",
    category: 'Anxiety'
  },
  {
    name: "Alex Rivera",
    handle: "@alex_rivera",
    photo: "https://i.pravatar.cc/150?u=alex",
    shortStory: "After losing my sister, sadness became my only reality. Sharing my grief journey here helped me turn my pain into a tribute to her memory...",
    fullStory: "After the sudden loss of my sister, deep sadness became my only reality. I felt hollow and disconnected from life. This community provided a safe space to mourn without judgment. Reading others' stories of loss and resilience helped me process my grief. I started writing as a form of therapy, and the encouragement I received was overwhelming. I've turned my pain into a mission to support siblings going through similar losses, proving that love persists even in absence.",
    date: "April 20, 2024",
    category: 'Sadness'
  },
  {
    name: "Jordan Smith",
    handle: "@jordan_smith",
    photo: "https://i.pravatar.cc/150?u=jordan",
    shortStory: "Loneliness in a big city is a heavy burden. I felt like a ghost until I found this Circle. Now, I have a family of people who truly understand...",
    fullStory: "Loneliness in a big city is a heavy burden that few talk about. I felt like a ghost wandering through crowds, invisible to everyone. I thought I was the only one feeling this way until I found this Circle. Hearing others describe the exact same feeling was like a breath of fresh air. We formed a small support group, and for the first time in years, I feel seen. Connection is the ultimate cure for loneliness, and it starts with the courage to say, 'I'm feeling alone.'",
    date: "April 15, 2024",
    category: 'Loneliness'
  }
];

interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: any;
}

const Community: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [userLikes, setUserLikes] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});

  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [isAnon, setIsAnon] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editIsAnon, setEditIsAnon] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [resilienceStories, setResilienceStories] = useState<Story[]>([]);
  const [loadingResilience, setLoadingResilience] = useState(true);
  const [storyLikes, setStoryLikes] = useState<Record<string, boolean>>({});
  const [expandedStoryComments, setExpandedStoryComments] = useState<Record<string, boolean>>({});

  // Seed resilience stories if none exist
  useEffect(() => {
    if (loadingResilience) return;
    
    if (resilienceStories.length === 0) {
      const initialStories = [
        {
          name: "Sarah Jenkins",
          handle: "@sarahj_wins",
          photo: "https://i.pravatar.cc/150?u=sarahj",
          content: "After losing my job, I fell into a deep depression. Focusing on small daily wins and regular mental check-ins helped me find my light again at my own pace.",
          likesCount: 12,
          category: "Depression",
          createdAt: serverTimestamp()
        },
        {
          name: "Michael Chen",
          handle: "@mchen_zen",
          photo: "https://i.pravatar.cc/150?u=michaelc",
          content: "Anxiety used to keep me indoors for weeks. The mindfulness tools and games here gave me a safe space to practice grounding until I could face the world again.",
          likesCount: 8,
          category: "Anxiety",
          createdAt: serverTimestamp()
        },
        {
          name: "Emma Wilson",
          handle: "@emma_glow",
          photo: "https://i.pravatar.cc/150?u=emma",
          content: "I didn't realize how much the digital noise was affecting my mind. Taking a step back and setting boundaries for my mental health changed everything.",
          likesCount: 24,
          category: "Mindfulness",
          createdAt: serverTimestamp()
        }
      ];
      initialStories.forEach(s => addDoc(collection(db, 'resilienceStories'), s));
    }
  }, [loadingResilience, resilienceStories.length]);

  useEffect(() => {
    if (!user) return;

    const path = 'resilienceStories';
    const q = query(collection(db, path), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const s = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any as Story));
      setResilienceStories(s);
      setLoadingResilience(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, path);
      setLoadingResilience(false);
    });
    return () => unsubscribe();
  }, [user]);

  // Track story likes
  useEffect(() => {
    if (!user || resilienceStories.length === 0) return;
    const unsubscribes = resilienceStories.map(story => {
      return onSnapshot(doc(db, 'resilienceStories', story.id, 'likes', user.uid), (snapshot) => {
        setStoryLikes(prev => ({
          ...prev,
          [story.id]: snapshot.exists()
        }));
      });
    });
    return () => unsubscribes.forEach(unsub => unsub());
  }, [user, resilienceStories.length]);

  const handleLikeStory = async (storyId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!user) return;
    try {
      const storyRef = doc(db, 'resilienceStories', storyId);
      const likeRef = doc(db, 'resilienceStories', storyId, 'likes', user.uid);
      const isLiked = storyLikes[storyId];
      if (isLiked) {
        await deleteDoc(likeRef);
        await updateDoc(storyRef, { likesCount: increment(-1) });
      } else {
        await setDoc(likeRef, { likedAt: serverTimestamp() });
        await updateDoc(storyRef, { likesCount: increment(1) });
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (authLoading || !user) return;

    const path = 'communityPosts';
    const q = query(collection(db, path), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const p = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
      setPosts(p);
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, path);
    });
    return () => unsubscribe();
  }, [user, authLoading]);

  // Track user likes
  useEffect(() => {
    if (!user || posts.length === 0) return;

    const likesMap: Record<string, boolean> = {};
    const unsubscribes = posts.map(post => {
      return onSnapshot(doc(db, 'communityPosts', post.id, 'likes', user.uid), (snapshot) => {
        setUserLikes(prev => ({
          ...prev,
          [post.id]: snapshot.exists()
        }));
      });
    });

    return () => unsubscribes.forEach(unsub => unsub());
  }, [user, posts.length]); // Re-attach when posts change (e.g. new ones added)

  const toggleStoryComments = (storyId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandedStoryComments(prev => ({
      ...prev,
      [storyId]: !prev[storyId]
    }));
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newContent.trim()) return;

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'communityPosts'), {
        authorId: user.uid,
        authorName: user.displayName || 'User',
        title: newTitle,
        content: newContent,
        isAnonymous: isAnon,
        likesCount: 0,
        createdAt: serverTimestamp()
      });
      setNewTitle('');
      setNewContent('');
      setShowForm(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async (postId: string) => {
    if (!user) return;
    try {
      const postRef = doc(db, 'communityPosts', postId);
      const likeRef = doc(db, 'communityPosts', postId, 'likes', user.uid);
      const isLiked = userLikes[postId];

      if (isLiked) {
        // Unlike
        await deleteDoc(likeRef);
        await updateDoc(postRef, {
          likesCount: increment(-1)
        });
      } else {
        // Like
        await setDoc(likeRef, { likedAt: serverTimestamp() });
        await updateDoc(postRef, {
          likesCount: increment(1)
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm('Are you sure you want to delete this story? This action cannot be undone.')) return;
    
    try {
      await deleteDoc(doc(db, 'communityPosts', postId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `communityPosts/${postId}`);
    }
  };

  const startEditing = (post: Post) => {
    setEditingPostId(post.id);
    setEditTitle(post.title);
    setEditContent(post.content);
    setEditIsAnon(post.isAnonymous);
  };

  const handleUpdatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !editingPostId || !editContent.trim()) return;

    setUpdating(true);
    try {
      await updateDoc(doc(db, 'communityPosts', editingPostId), {
        title: editTitle,
        content: editContent,
        isAnonymous: editIsAnon,
        updatedAt: serverTimestamp()
      });
      setEditingPostId(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `communityPosts/${editingPostId}`);
    } finally {
      setUpdating(false);
    }
  };

  const toggleComments = (postId: string) => {
    setExpandedComments(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  const getDate = (date: any) => {
    if (!date) return new Date();
    if (date.toDate) return date.toDate();
    return new Date(date);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
        <SectionTitle 
          title="Community Circle" 
          subtitle="Connect with others, share your journey, and find support in a safe space."
        />
        <Button 
          onClick={() => {
            if (user && !user.emailVerified && user.providerData?.[0]?.providerId === 'password') {
              window.scrollTo({ top: 0, behavior: 'smooth' });
              return;
            }
            setShowForm(!showForm);
          }} 
          className={`rounded-2xl shrink-0 ${user && !user.emailVerified && user.providerData?.[0]?.providerId === 'password' ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : ''}`}
        >
          {user && !user.emailVerified && user.providerData?.[0]?.providerId === 'password' ? (
            <><ShieldAlert className="w-5 h-5 mr-2" /> Verification Required</>
          ) : showForm ? 'Cancel' : (
            <><Plus className="w-5 h-5 mr-2" /> Share your story</>
          )}
        </Button>
      </div>

      {/* Resilience Stories Section */}
      <section className="mb-16">
        <div className="flex items-center gap-3 mb-8">
          <Heart className="w-6 h-6 text-rose-500 fill-rose-500" />
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Voices of Resilience</h2>
        </div>
        
        {loadingResilience ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {resilienceStories.map((story) => (
              <Card 
                key={story.id} 
                className="p-8 border-none bg-gray-50/50 hover:bg-white transition-all shadow-sm hover:shadow-xl group"
              >
                <div className="flex items-start gap-4 mb-6">
                  <img src={story.photo} alt={story.name} className="w-14 h-14 rounded-2xl object-cover shadow-sm border-2 border-white" />
                  <div className="flex-1">
                    <h4 className="font-black text-gray-900 text-lg group-hover:text-primary transition-colors">{story.name}</h4>
                    <p className="text-sm font-bold text-primary">{story.handle}</p>
                    <div className="mt-2 inline-block bg-white px-2 py-1 rounded-lg text-[8px] font-black uppercase text-gray-400 tracking-tighter border">
                      {story.category}
                    </div>
                  </div>
                </div>
                
                <p className="text-gray-600 font-medium leading-relaxed italic text-lg mb-8">
                  "{story.content.length > 150 ? story.content.substring(0, 150) + '...' : story.content}"
                </p>

                <div className="flex items-center gap-4 pt-6 border-t font-sans">
                  <button 
                    onClick={(e) => handleLikeStory(story.id, e)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all shadow-sm ${
                      storyLikes[story.id] 
                        ? 'bg-rose-500 text-white' 
                        : 'bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${storyLikes[story.id] ? 'fill-current' : 'fill-none'}`} />
                    {story.likesCount || 0}
                  </button>
                  <button 
                    onClick={(e) => toggleStoryComments(story.id, e)}
                    className={`flex items-center gap-2 px-4 py-2 border rounded-xl font-bold transition-all ${
                      expandedStoryComments[story.id]
                        ? 'text-primary border-primary bg-primary/5'
                        : 'text-gray-400 hover:text-primary hover:border-primary'
                    }`}
                  >
                    <MessageSquare className="w-4 h-4" />
                    Reply
                  </button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setSelectedStory(story)}
                    className="ml-auto text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-primary p-0 flex items-center gap-1"
                  >
                    Read Full Story <ChevronRight className="w-3 h-3" />
                  </Button>
                </div>

                <AnimatePresence>
                  {expandedStoryComments[story.id] && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <StoryCommentsSection storyId={story.id} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            ))}
            
            {/* CTA to share story */}
            <Card className="p-8 border-2 border-dashed border-gray-200 bg-transparent flex flex-col items-center justify-center text-center group cursor-pointer hover:border-primary/50 transition-all" onClick={() => setShowForm(true)}>
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors">
                <Plus className="w-8 h-8 text-gray-300 group-hover:text-primary transition-colors" />
              </div>
              <h4 className="text-xl font-black text-gray-900 mb-2">Share Your Journey</h4>
              <p className="text-gray-500 font-medium mb-6 max-w-xs">Your story of resilience can give hope to someone else fighting a silent battle.</p>
              <Button variant="outline" className="rounded-full px-8">Contribute Story</Button>
            </Card>
          </div>
        )}
      </section>

      {/* Story Modal */}
      <AnimatePresence>
        {selectedStory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedStory(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[40px] shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              <button 
                onClick={() => setSelectedStory(null)}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 transition-colors z-10"
              >
                <X className="w-6 h-6 text-gray-400" />
              </button>
              
              <div className="p-10">
                <div className="flex items-center gap-6 mb-8">
                  <img src={selectedStory.photo} alt={selectedStory.name} className="w-20 h-20 rounded-full object-cover border-4 border-primary/10" />
                  <div>
                    <h3 className="text-3xl font-black text-gray-900">{selectedStory.name}</h3>
                    <p className="text-primary font-bold">{selectedStory.handle}</p>
                    <div className="inline-block mt-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                      Overcoming {selectedStory.category}
                    </div>
                  </div>
                </div>
                
                <div className="prose prose-lg max-w-none">
                  <p className="text-gray-600 font-medium leading-relaxed italic text-xl">
                    "{selectedStory.content}"
                  </p>
                </div>
                
                <div className="mt-10 pt-8 border-t border-gray-100">
                  <div className="flex gap-4 mb-10">
                    <button 
                      onClick={(e) => handleLikeStory(selectedStory.id, e)}
                      className={`flex-1 sm:flex-none flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-sm transition-all shadow-lg ${
                        storyLikes[selectedStory.id] 
                          ? 'bg-rose-500 text-white shadow-rose-200' 
                          : 'bg-white border-2 border-rose-100 text-rose-500 hover:bg-rose-50 shadow-sm'
                      }`}
                    >
                      <Heart className={`w-5 h-5 ${storyLikes[selectedStory.id] ? 'fill-current' : ''}`} />
                      {storyLikes[selectedStory.id] ? 'Liked Story' : 'Send Love'} ({selectedStory.likesCount || 0})
                    </button>
                  </div>

                  <div className="border-t pt-10">
                    <h4 className="text-2xl font-black text-gray-900 mb-8 flex items-center gap-3">
                      <MessageSquare className="w-6 h-6 text-primary" />
                      Messages of Support
                    </h4>
                    <StoryCommentsSection storyId={selectedStory.id} autoFocus />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-3 mb-8">
        <MessageSquare className="w-6 h-6 text-primary" />
        <h2 className="text-2xl font-black text-gray-900 tracking-tight">Recent Discussions</h2>
      </div>

      {showForm && (
        <Card className="p-8 mb-12 border-2 border-primary/10 shadow-2xl animate-in slide-in-from-top-4">
          <form onSubmit={handleCreatePost} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Title (Optional)</label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full p-4 bg-gray-50 rounded-2xl font-bold focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none border border-transparent transition-all"
                placeholder="What's on your mind?"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Content</label>
              <textarea
                required
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                className="w-full min-h-[150px] p-6 bg-gray-50 rounded-3xl font-medium focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none border border-transparent transition-all resize-none"
                placeholder="Share your thoughts, feelings, or an update..."
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={isAnon}
                  onChange={(e) => setIsAnon(e.target.checked)}
                  className="w-5 h-5 accent-primary rounded cursor-pointer"
                />
                <span className="text-sm font-bold text-gray-600 group-hover:text-primary transition-colors">Post anonymously</span>
              </label>
              <Button type="submit" loading={submitting} className="px-10">Post to Circle</Button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
        </div>
      ) : (
        <div className="space-y-8">
          {posts.map((post) => (
            <Card key={post.id} className="p-0 overflow-hidden hover:shadow-xl transition-all border-none shadow-sm">
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center text-primary">
                      <UserIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{post.isAnonymous ? 'Anonymous Member' : post.authorName}</p>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(getDate(post.createdAt))} ago
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {user?.uid === post.authorId && (
                      <div className="flex items-center gap-1 mr-2">
                        <button 
                          onClick={() => startEditing(post)}
                          className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                          title="Edit post"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeletePost(post.id)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                          title="Delete post"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    <div className="bg-gray-50 px-3 py-1 rounded-full text-[10px] font-black uppercase text-gray-400 tracking-widest">
                      Support
                    </div>
                  </div>
                </div>

                {editingPostId === post.id ? (
                  <form onSubmit={handleUpdatePost} className="space-y-4 mb-4 animate-in fade-in duration-300">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full p-3 bg-gray-50 rounded-xl font-bold focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none border border-transparent transition-all"
                      placeholder="Title"
                    />
                    <textarea
                      required
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full min-h-[120px] p-4 bg-gray-50 rounded-2xl font-medium focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none border border-transparent transition-all resize-none"
                      placeholder="Content"
                    />
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editIsAnon}
                          onChange={(e) => setEditIsAnon(e.target.checked)}
                          className="w-4 h-4 accent-primary"
                        />
                        <span className="text-sm font-bold text-gray-600">Anonymous</span>
                      </label>
                      <div className="flex gap-2">
                        <Button type="button" variant="secondary" size="sm" onClick={() => setEditingPostId(null)}>Cancel</Button>
                        <Button type="submit" size="sm" loading={updating}>Save Changes</Button>
                      </div>
                    </div>
                  </form>
                ) : (
                  <>
                    {post.title && <h3 className="text-2xl font-extrabold text-gray-800 mb-4 leading-tight">{post.title}</h3>}
                    <p className="text-gray-600 font-medium leading-relaxed mb-8 text-lg whitespace-pre-wrap">{post.content}</p>
                  </>
                )}
                
                <div className="flex items-center gap-4 pt-6 border-t font-sans">
                  <button 
                    onClick={() => handleLike(post.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all shadow-sm ${
                      userLikes[post.id] 
                        ? 'bg-primary text-white' 
                        : 'bg-secondary text-primary hover:bg-primary hover:text-white'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${userLikes[post.id] ? 'fill-current' : 'fill-none'}`} />
                    {post.likesCount}
                  </button>
                  <button 
                    onClick={() => toggleComments(post.id)}
                    className={`flex items-center gap-2 px-4 py-2 border rounded-xl font-bold transition-all ${
                      expandedComments[post.id]
                        ? 'text-primary border-primary bg-primary/5'
                        : 'text-gray-400 hover:text-primary hover:border-primary'
                    }`}
                  >
                    <MessageSquare className="w-4 h-4" />
                    {expandedComments[post.id] ? 'Closing Replies' : 'Reply'}
                  </button>
                </div>

                {expandedComments[post.id] && (
                  <CommentsSection postId={post.id} />
                )}
              </div>
            </Card>
          ))}
          {posts.length === 0 && (
            <div className="text-center py-24 bg-gray-50/50 rounded-[40px] border-2 border-dashed border-gray-200">
               <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                 <MessageSquare className="w-10 h-10 text-primary/20" />
               </div>
               <h3 className="text-2xl font-black text-gray-900 mb-2">The Circle is waiting for your voice</h3>
               <p className="text-gray-500 font-medium max-w-sm mx-auto mb-8">
                 Your experiences can be a beacon of hope for someone else. Share a thought, a win, or even a struggle.
               </p>
               <Button onClick={() => setShowForm(true)} variant="outline" className="rounded-full px-8">
                 Start a Conversation
               </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const StoryCommentsSection: React.FC<{ storyId: string; autoFocus?: boolean }> = ({ storyId, autoFocus }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const path = `resilienceStories/${storyId}/comments`;
    if (!user) {
        setLoading(false);
        return;
    }
    const q = query(collection(db, path), orderBy('createdAt', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const c = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment));
      setComments(c);
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, path);
    });
    return () => unsubscribe();
  }, [storyId, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim() || submitting) return;

    if (!user.emailVerified && user.providerData?.[0]?.providerId === 'password') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'resilienceStories', storyId, 'comments'), {
        authorId: user.uid,
        authorName: user.displayName || 'Anonymous Member',
        content: newComment,
        createdAt: serverTimestamp()
      });
      setNewComment('');
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const getDate = (date: any) => {
    if (!date) return new Date();
    if (date.toDate) return date.toDate();
    return new Date(date);
  };

  return (
    <div className="mt-6 pt-6 border-t border-gray-100 space-y-6">
      <div className="space-y-4 max-h-[300px] overflow-y-auto no-scrollbar pr-2">
        {loading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="w-5 h-5 text-primary animate-spin" />
          </div>
        ) : comments.length === 0 ? (
          <p className="text-center py-4 text-gray-400 text-xs font-medium">Be the first to send a message of strength.</p>
        ) : (
          comments.map(comment => (
            <div key={comment.id} className="flex gap-3 group animate-in fade-in slide-in-from-left-2 transition-all">
              <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 shrink-0">
                <UserIcon className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-gray-900">{comment.authorName}</span>
                    <span className="text-[9px] text-gray-400 uppercase font-black">
                      {formatDistanceToNow(getDate(comment.createdAt))} ago
                    </span>
                  </div>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">{comment.content}</p>
              </div>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2 sticky bottom-0 bg-white/80 backdrop-blur-sm pt-2">
        <input 
          autoFocus={autoFocus}
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Send support..."
          className="flex-1 bg-gray-100 rounded-2xl px-5 py-3 text-sm font-medium focus:ring-2 focus:ring-primary/20 bg-white border-transparent focus:border-primary/20 transition-all outline-none"
        />
        <Button size="sm" type="submit" loading={submitting} disabled={!newComment.trim()} className="rounded-2xl px-6 h-12">
          Send
        </Button>
      </form>
    </div>
  );
};

const CommentsSection: React.FC<{ postId: string }> = ({ postId }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const path = `communityPosts/${postId}/comments`;
    if (!user) {
        setLoading(false);
        return;
    }
    const q = query(collection(db, path), orderBy('createdAt', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const c = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment));
      setComments(c);
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, path);
    });
    return () => unsubscribe();
  }, [postId, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim() || submitting) return;

    if (!user.emailVerified && user.providerData?.[0]?.providerId === 'password') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'communityPosts', postId, 'comments'), {
        authorId: user.uid,
        authorName: user.displayName || 'Anonymous Member',
        content: newComment,
        createdAt: serverTimestamp()
      });
      setNewComment('');
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const getDate = (date: any) => {
    if (!date) return new Date();
    if (date.toDate) return date.toDate();
    return new Date(date);
  };

  return (
    <div className="mt-8 pt-8 border-t space-y-6">
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="w-5 h-5 text-primary animate-spin" />
          </div>
        ) : comments.length === 0 ? (
          <p className="text-center py-4 text-gray-400 text-sm font-medium">No replies yet. Start the conversation!</p>
        ) : (
          comments.map(comment => (
            <div key={comment.id} className="flex gap-4 group">
              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 shrink-0">
                <UserIcon className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-sm text-gray-900">{comment.authorName}</span>
                  <span className="text-[10px] text-gray-400 uppercase font-black">
                    {formatDistanceToNow(getDate(comment.createdAt))} ago
                  </span>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">{comment.content}</p>
              </div>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input 
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Write a reply..."
          className="flex-1 bg-gray-50 rounded-xl px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-primary/20 bg-white border-transparent focus:border-primary/20 transition-all outline-none"
        />
        <Button size="sm" type="submit" loading={submitting} disabled={!newComment.trim()}>
          Reply
        </Button>
      </form>
    </div>
  );
};

export default Community;
