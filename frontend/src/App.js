import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { toast, Toaster } from 'sonner';
import '@/App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Generate unique user ID for likes
const getUserId = () => {
  let userId = localStorage.getItem('user_id');
  if (!userId) {
    userId = 'user_' + Math.random().toString(36).substr(2, 9) + Date.now();
    localStorage.setItem('user_id', userId);
  }
  return userId;
};

// Share functionality
const shareWork = (work, platform) => {
  const url = window.location.origin + `/work/${work.id}`;
  const title = work.title;
  const text = `Check out "${title}" by ${work.author_name} on JNV Editorial Club`;
  
  const shareUrls = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
  };
  
  if (platform === 'copy') {
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard!');
  } else if (platform === 'native' && navigator.share) {
    navigator.share({ title, text, url }).catch(() => {});
  } else if (shareUrls[platform]) {
    window.open(shareUrls[platform], '_blank', 'width=600,height=400');
  }
};

const categories = [
  { value: 'poem', label: 'Poem', label_hi: 'कविता' },
  { value: 'story', label: 'Story', label_hi: 'कहानी' },
  { value: 'essay', label: 'Essay', label_hi: 'निबंध' },
  { value: 'article', label: 'Article', label_hi: 'लेख' }
];

function Header() {
  const navigate = useNavigate();
  const isAdmin = localStorage.getItem('admin_token');

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    toast.success('Logged out successfully');
    navigate('/');
  };

  return (
    <header className="border-b-2 border-black bg-white" data-testid="main-header">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-3" data-testid="logo-link">
          <div className="bg-[#CCFF00] px-4 py-2 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transform -rotate-1">
            <h1 className="font-bold text-xl" style={{fontFamily: 'Syne'}}>JNV EDITORIAL</h1>
          </div>
        </Link>
        <nav className="flex items-center gap-4">
          <Link to="/browse" className="font-semibold hover:text-[#FF0055] transition-colors" data-testid="browse-link" style={{fontFamily: 'Space Grotesk'}}>Browse</Link>
          <Link to="/submit" className="font-semibold hover:text-[#FF0055] transition-colors" data-testid="submit-link" style={{fontFamily: 'Space Grotesk'}}>Submit</Link>
          {isAdmin ? (
            <>
              <Link to="/admin" className="font-semibold hover:text-[#3366FF] transition-colors" data-testid="admin-dashboard-link" style={{fontFamily: 'Space Grotesk'}}>Dashboard</Link>
              <button onClick={handleLogout} className="bg-black text-white px-6 py-2 font-bold border-2 border-transparent hover:bg-[#FF0055] hover:border-black transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]" data-testid="logout-button" style={{fontFamily: 'Space Grotesk'}}>Logout</button>
            </>
          ) : (
            <Link to="/admin/login" className="bg-black text-white px-6 py-2 font-bold border-2 border-transparent hover:bg-[#CCFF00] hover:text-black hover:border-black transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]" data-testid="admin-login-link" style={{fontFamily: 'Space Grotesk'}}>Admin</Link>
          )}
        </nav>
      </div>
    </header>
  );
}

function Home() {
  const [featured, setFeatured] = useState([]);
  const [showAll, setShowAll] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const response = await axios.get(`${API}/submissions?status=approved`);
        setFeatured(response.data);
      } catch (error) {
        console.error('Error fetching featured works:', error);
      }
    };
    fetchFeatured();
  }, []);

  const displayedWorks = showAll ? featured : featured.slice(0, 6);

  return (
    <div className="min-h-screen" style={{backgroundColor: '#F4F1EA'}} data-testid="home-page">
      <Header />
      
      <section className="relative py-20 border-b-2 border-black overflow-hidden" data-testid="hero-section">
        <div className="absolute inset-0 bg-[#3366FF] opacity-10"></div>
        <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
          <h1 className="text-6xl md:text-8xl font-bold tracking-tighter leading-[0.9] mb-6" style={{fontFamily: 'Syne'}} data-testid="hero-title">
            Young<br/>Editorial<br/>Club
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-2xl" style={{fontFamily: 'Space Grotesk'}} data-testid="hero-subtitle">
            युवा संपादकीय क्लब<br/>
            Jawahar Navodaya Vidyalaya Sukma
          </p>
          <button onClick={() => navigate('/browse')} className="bg-[#CCFF00] text-black px-8 py-4 font-bold text-lg border-2 border-black hover:bg-[#FF0055] hover:text-white transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1" data-testid="explore-button" style={{fontFamily: 'Space Grotesk'}}>Explore Works</button>
        </div>
      </section>

      <section className="py-16 border-b-2 border-black" data-testid="categories-section">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <h2 className="text-4xl md:text-6xl font-bold mb-12" style={{fontFamily: 'Syne'}}>Categories</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {categories.map(cat => (
              <button
                key={cat.value}
                onClick={() => navigate(`/browse?category=${cat.value}`)}
                className="bg-white border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
                data-testid={`category-${cat.value}-button`}
              >
                <h3 className="text-2xl font-bold mb-2" style={{fontFamily: 'Syne'}}>{cat.label}</h3>
                <p className="text-xl" style={{fontFamily: 'Rozha One'}}>{cat.label_hi}</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16" data-testid="featured-section">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <h2 className="text-4xl md:text-6xl font-bold mb-12" style={{fontFamily: 'Syne'}}>Featured Works</h2>
          {featured.length === 0 ? (
            <div className="bg-white border-2 border-black p-12 text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" data-testid="no-works-message">
              <p className="text-xl" style={{fontFamily: 'Space Grotesk'}}>No works published yet. Be the first to submit!</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayedWorks.map(work => (
                  <div
                    key={work.id}
                    className="bg-white border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
                    data-testid={`featured-work-${work.id}`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <span className="bg-[#3366FF] text-white px-3 py-1 text-xs uppercase tracking-wider border border-black transform -rotate-1" style={{fontFamily: 'Space Grotesk'}}>{work.category}</span>
                    </div>
                    <div onClick={() => navigate(`/work/${work.id}`)} className="cursor-pointer">
                      <h3 className="text-2xl font-bold mb-2" style={{fontFamily: 'Syne'}}>{work.title}</h3>
                      {work.title_hi && <p className="text-xl mb-3" style={{fontFamily: 'Rozha One', fontSize: '1.3rem'}}>{work.title_hi}</p>}
                      <p className="text-sm text-gray-700 line-clamp-3 mb-4" style={{fontFamily: 'Space Grotesk'}}>{work.content.substring(0, 150)}...</p>
                    </div>
                    <p 
                      className="text-sm font-semibold cursor-pointer hover:text-[#FF0055] transition-colors" 
                      style={{fontFamily: 'Space Grotesk'}}
                      onClick={() => navigate(`/student/${encodeURIComponent(work.author_name)}`)}
                      data-testid={`author-link-${work.id}`}
                    >— {work.author_name}, Class {work.author_class}</p>
                  </div>
                ))}
              </div>
              {featured.length > 6 && (
                <div className="text-center mt-8">
                  <button 
                    onClick={() => setShowAll(!showAll)}
                    className="bg-black text-white px-8 py-3 font-bold border-2 border-transparent hover:bg-[#CCFF00] hover:text-black hover:border-black transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                    style={{fontFamily: 'Space Grotesk'}}
                    data-testid="toggle-all-button"
                  >
                    {showAll ? 'Show Less' : `View All ${featured.length} Works`}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}

function Browse() {
  const [works, setWorks] = useState([]);
  const [filter, setFilter] = useState({ category: '', language: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cat = params.get('category') || '';
    setFilter(prev => ({ ...prev, category: cat }));
  }, []);

  useEffect(() => {
    const fetchWorks = async () => {
      try {
        if (searchQuery.trim().length > 0) {
          setSearching(true);
          const response = await axios.get(`${API}/search?q=${encodeURIComponent(searchQuery)}`);
          setWorks(response.data);
          setSearching(false);
        } else {
          const params = new URLSearchParams({ status: 'approved' });
          if (filter.category) params.append('category', filter.category);
          if (filter.language) params.append('language', filter.language);
          const response = await axios.get(`${API}/submissions?${params}`);
          setWorks(response.data);
        }
      } catch (error) {
        console.error('Error fetching works:', error);
        setSearching(false);
      }
    };
    
    const debounceTimer = setTimeout(fetchWorks, 300);
    return () => clearTimeout(debounceTimer);
  }, [filter, searchQuery]);

  return (
    <div className="min-h-screen" style={{backgroundColor: '#F4F1EA'}} data-testid="browse-page">
      <Header />
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        <h1 className="text-5xl md:text-7xl font-bold mb-8" style={{fontFamily: 'Syne'}} data-testid="browse-title">Browse Works</h1>
        
        <div className="mb-8" data-testid="search-section">
          <input
            type="text"
            placeholder="Search by title, content, or author name... / शीर्षक, सामग्री या लेखक नाम से खोजें..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border-2 border-black p-4 text-lg focus:outline-none focus:ring-2 focus:ring-[#CCFF00] focus:border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)]"
            style={{fontFamily: 'Space Grotesk'}}
            data-testid="search-input"
          />
        </div>
        
        <div className="flex gap-4 mb-8 flex-wrap" data-testid="filter-section">
          <select
            value={filter.category}
            onChange={(e) => setFilter(prev => ({ ...prev, category: e.target.value }))}
            className="bg-white border-2 border-black p-3 focus:outline-none focus:ring-2 focus:ring-[#CCFF00] focus:border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)]"
            style={{fontFamily: 'Space Grotesk'}}
            data-testid="category-filter"
          >
            <option value="">All Categories</option>
            {categories.map(cat => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
          </select>
          
          <select
            value={filter.language}
            onChange={(e) => setFilter(prev => ({ ...prev, language: e.target.value }))}
            className="bg-white border-2 border-black p-3 focus:outline-none focus:ring-2 focus:ring-[#CCFF00] focus:border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)]"
            style={{fontFamily: 'Space Grotesk'}}
            data-testid="language-filter"
          >
            <option value="">All Languages</option>
            <option value="english">English</option>
            <option value="hindi">Hindi</option>
            <option value="both">Both</option>
          </select>
          
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="bg-[#FF0055] text-white px-6 py-3 font-bold border-2 border-black hover:bg-[#e6004d] transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)]"
              style={{fontFamily: 'Space Grotesk'}}
              data-testid="clear-search-button"
            >
              Clear Search
            </button>
          )}
        </div>

        {searching ? (
          <div className="bg-white border-2 border-black p-12 text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <p className="text-xl" style={{fontFamily: 'Space Grotesk'}}>Searching...</p>
          </div>
        ) : works.length === 0 ? (
          <div className="bg-white border-2 border-black p-12 text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" data-testid="no-results-message">
            <p className="text-xl" style={{fontFamily: 'Space Grotesk'}}>No works found with current filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="works-grid">
            {works.map(work => (
              <div
                key={work.id}
                className="bg-white border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
                data-testid={`work-card-${work.id}`}
              >
                <div className="flex justify-between items-start mb-4">
                  <span className="bg-[#3366FF] text-white px-3 py-1 text-xs uppercase tracking-wider border border-black transform -rotate-1" style={{fontFamily: 'Space Grotesk'}}>{work.category}</span>
                </div>
                <div onClick={() => navigate(`/work/${work.id}`)} className="cursor-pointer">
                  <h3 className="text-2xl font-bold mb-2" style={{fontFamily: 'Syne'}}>{work.title}</h3>
                  {work.title_hi && <p className="text-xl mb-3" style={{fontFamily: 'Rozha One', fontSize: '1.3rem'}}>{work.title_hi}</p>}
                  <p className="text-sm text-gray-700 line-clamp-3 mb-4" style={{fontFamily: 'Space Grotesk'}}>{work.content.substring(0, 150)}...</p>
                </div>
                <p 
                  className="text-sm font-semibold cursor-pointer hover:text-[#FF0055] transition-colors" 
                  style={{fontFamily: 'Space Grotesk'}}
                  onClick={() => navigate(`/student/${encodeURIComponent(work.author_name)}`)}
                >— {work.author_name}, Class {work.author_class}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function WorkDetail() {
  const { id } = useParams();
  const [work, setWork] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState({ author_name: '', comment_text: '' });
  const [likes, setLikes] = useState(0);
  const [userLiked, setUserLiked] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const navigate = useNavigate();
  const userId = getUserId();

  useEffect(() => {
    const fetchWork = async () => {
      try {
        const response = await axios.get(`${API}/submissions/${id}`);
        setWork(response.data);
        setLikes(response.data.likes || 0);
        setUserLiked(response.data.liked_by?.includes(userId) || false);
      } catch (error) {
        console.error('Error fetching work:', error);
        toast.error('Work not found');
        navigate('/browse');
      }
    };
    
    const fetchComments = async () => {
      try {
        const response = await axios.get(`${API}/submissions/${id}/comments`);
        setComments(response.data);
      } catch (error) {
        console.error('Error fetching comments:', error);
      }
    };
    
    fetchWork();
    fetchComments();
  }, [id, navigate, userId]);

  const handleLike = async () => {
    try {
      const response = await axios.post(`${API}/submissions/${id}/like`, { user_id: userId });
      setLikes(response.data.likes);
      setUserLiked(response.data.user_liked);
      toast.success(response.data.action === 'liked' ? 'Liked!' : 'Like removed');
    } catch (error) {
      console.error('Error liking work:', error);
      toast.error('Failed to like work');
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.author_name.trim() || !newComment.comment_text.trim()) {
      toast.error('Please fill in all fields');
      return;
    }
    
    try {
      const response = await axios.post(`${API}/submissions/${id}/comment`, newComment);
      setComments([response.data, ...comments]);
      setNewComment({ author_name: '', comment_text: '' });
      toast.success('Comment added!');
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    }
  };

  if (!work) return <div className="min-h-screen flex items-center justify-center" style={{backgroundColor: '#F4F1EA'}}><p className="text-xl" style={{fontFamily: 'Space Grotesk'}}>Loading...</p></div>;

  return (
    <div className="min-h-screen" style={{backgroundColor: '#F4F1EA'}} data-testid="work-detail-page">
      <Header />
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-12">
        <button onClick={() => navigate('/browse')} className="mb-8 text-lg font-semibold hover:text-[#FF0055] transition-colors" style={{fontFamily: 'Space Grotesk'}} data-testid="back-button">← Back to Browse</button>
        
        <div className="bg-white border-2 border-black p-8 md:p-12 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]" data-testid="work-content">
          <div className="flex justify-between items-start mb-6 flex-wrap gap-4">
            <span className="bg-[#3366FF] text-white px-4 py-2 text-sm uppercase tracking-wider border border-black transform -rotate-1" style={{fontFamily: 'Space Grotesk'}} data-testid="work-category">{work.category}</span>
            
            <div className="flex gap-3">
              <button
                onClick={handleLike}
                className={`${userLiked ? 'bg-[#FF0055] text-white' : 'bg-white text-black'} px-6 py-2 font-bold border-2 border-black hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-2`}
                style={{fontFamily: 'Space Grotesk'}}
                data-testid="like-button"
              >
                {userLiked ? '❤' : '♡'} {likes}
              </button>
              
              <div className="relative">
                <button
                  onClick={() => setShowShareMenu(!showShareMenu)}
                  className="bg-[#CCFF00] text-black px-6 py-2 font-bold border-2 border-black hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all"
                  style={{fontFamily: 'Space Grotesk'}}
                  data-testid="share-button"
                >
                  Share
                </button>
                
                {showShareMenu && (
                  <div className="absolute right-0 mt-2 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4 z-10 min-w-[200px]" data-testid="share-menu">
                    <button onClick={() => { shareWork(work, 'facebook'); setShowShareMenu(false); }} className="block w-full text-left px-4 py-2 hover:bg-[#CCFF00] transition-colors font-semibold" style={{fontFamily: 'Space Grotesk'}} data-testid="share-facebook">Facebook</button>
                    <button onClick={() => { shareWork(work, 'twitter'); setShowShareMenu(false); }} className="block w-full text-left px-4 py-2 hover:bg-[#CCFF00] transition-colors font-semibold" style={{fontFamily: 'Space Grotesk'}} data-testid="share-twitter">Twitter</button>
                    <button onClick={() => { shareWork(work, 'whatsapp'); setShowShareMenu(false); }} className="block w-full text-left px-4 py-2 hover:bg-[#CCFF00] transition-colors font-semibold" style={{fontFamily: 'Space Grotesk'}} data-testid="share-whatsapp">WhatsApp</button>
                    <button onClick={() => { shareWork(work, 'linkedin'); setShowShareMenu(false); }} className="block w-full text-left px-4 py-2 hover:bg-[#CCFF00] transition-colors font-semibold" style={{fontFamily: 'Space Grotesk'}} data-testid="share-linkedin">LinkedIn</button>
                    <button onClick={() => { shareWork(work, 'copy'); setShowShareMenu(false); }} className="block w-full text-left px-4 py-2 hover:bg-[#CCFF00] transition-colors font-semibold" style={{fontFamily: 'Space Grotesk'}} data-testid="share-copy">Copy Link</button>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-4" style={{fontFamily: 'Syne'}} data-testid="work-title">{work.title}</h1>
          {work.title_hi && <h2 className="text-3xl md:text-5xl mb-6" style={{fontFamily: 'Rozha One', fontSize: '2.5rem'}} data-testid="work-title-hindi">{work.title_hi}</h2>}
          
          <div className="mb-8">
            <p 
              className="text-lg font-semibold cursor-pointer hover:text-[#FF0055] transition-colors inline-block" 
              style={{fontFamily: 'Space Grotesk'}} 
              data-testid="work-author"
              onClick={() => navigate(`/student/${encodeURIComponent(work.author_name)}`)}
            >By {work.author_name}</p>
            <p className="text-base text-gray-600" style={{fontFamily: 'Space Grotesk'}}>Class {work.author_class}</p>
          </div>
          
          <div className="prose max-w-none mb-8">
            <div className="whitespace-pre-wrap text-base md:text-lg leading-relaxed" style={{fontFamily: 'Space Grotesk'}} data-testid="work-content-english">{work.content}</div>
          </div>
          
          {work.content_hi && (
            <div className="prose max-w-none border-t-2 border-black pt-8 mb-8">
              <div className="whitespace-pre-wrap text-lg md:text-xl leading-relaxed" style={{fontFamily: 'Rozha One', fontSize: '1.3rem'}} data-testid="work-content-hindi">{work.content_hi}</div>
            </div>
          )}
          
          <div className="border-t-2 border-black pt-8">
            <h3 className="text-3xl font-bold mb-6" style={{fontFamily: 'Syne'}} data-testid="comments-title">Comments ({comments.length})</h3>
            
            <form onSubmit={handleCommentSubmit} className="mb-8 bg-[#F4F1EA] border-2 border-black p-6 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]" data-testid="comment-form">
              <div className="mb-4">
                <label className="block text-sm font-bold uppercase tracking-wider mb-2" style={{fontFamily: 'Space Grotesk'}}>Your Name / आपका नाम *</label>
                <input
                  type="text"
                  required
                  value={newComment.author_name}
                  onChange={(e) => setNewComment(prev => ({ ...prev, author_name: e.target.value }))}
                  className="w-full bg-white border-2 border-black p-3 focus:outline-none focus:ring-2 focus:ring-[#CCFF00] focus:border-black"
                  style={{fontFamily: 'Space Grotesk'}}
                  data-testid="comment-name-input"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-bold uppercase tracking-wider mb-2" style={{fontFamily: 'Space Grotesk'}}>Your Comment / आपकी टिप्पणी *</label>
                <textarea
                  required
                  rows="4"
                  value={newComment.comment_text}
                  onChange={(e) => setNewComment(prev => ({ ...prev, comment_text: e.target.value }))}
                  className="w-full bg-white border-2 border-black p-3 focus:outline-none focus:ring-2 focus:ring-[#CCFF00] focus:border-black"
                  style={{fontFamily: 'Space Grotesk'}}
                  data-testid="comment-text-input"
                />
              </div>
              
              <button
                type="submit"
                className="bg-[#3366FF] text-white px-6 py-3 font-bold border-2 border-black hover:bg-[#2952cc] transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
                style={{fontFamily: 'Space Grotesk'}}
                data-testid="comment-submit-button"
              >
                Post Comment
              </button>
            </form>
            
            <div className="space-y-4" data-testid="comments-list">
              {comments.length === 0 ? (
                <p className="text-gray-600" style={{fontFamily: 'Space Grotesk'}} data-testid="no-comments">No comments yet. Be the first to comment!</p>
              ) : (
                comments.map(comment => (
                  <div key={comment.id} className="bg-white border-2 border-black p-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" data-testid={`comment-${comment.id}`}>
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-bold" style={{fontFamily: 'Space Grotesk'}}>{comment.author_name}</p>
                      <p className="text-sm text-gray-600" style={{fontFamily: 'Space Grotesk'}}>
                        {new Date(comment.created_at).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                    <p className="whitespace-pre-wrap" style={{fontFamily: 'Space Grotesk'}}>{comment.comment_text}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StudentProfile() {
  const { authorName } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get(`${API}/students/${encodeURIComponent(authorName)}`);
        setProfile(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching student profile:', error);
        toast.error('Student profile not found');
        navigate('/browse');
      }
    };
    fetchProfile();
  }, [authorName, navigate]);

  if (loading) return <div className="min-h-screen flex items-center justify-center" style={{backgroundColor: '#F4F1EA'}}><p className="text-xl" style={{fontFamily: 'Space Grotesk'}}>Loading...</p></div>;

  return (
    <div className="min-h-screen" style={{backgroundColor: '#F4F1EA'}} data-testid="student-profile-page">
      <Header />
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        <button onClick={() => navigate('/browse')} className="mb-8 text-lg font-semibold hover:text-[#FF0055] transition-colors" style={{fontFamily: 'Space Grotesk'}} data-testid="back-button">← Back to Browse</button>
        
        <div className="bg-white border-2 border-black p-8 md:p-12 mb-12 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]" data-testid="profile-header">
          <h1 className="text-5xl md:text-7xl font-bold mb-6" style={{fontFamily: 'Syne'}} data-testid="student-name">{profile.author_name}</h1>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-[#CCFF00] border-2 border-black p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]" data-testid="total-works-stat">
              <p className="text-sm font-bold uppercase tracking-wider mb-1" style={{fontFamily: 'Space Grotesk'}}>Total Works</p>
              <p className="text-3xl font-bold" style={{fontFamily: 'Syne'}}>{profile.total_works}</p>
            </div>
            
            {Object.entries(profile.categories).map(([cat, count]) => (
              <div key={cat} className="bg-white border-2 border-black p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]" data-testid={`category-stat-${cat}`}>
                <p className="text-sm font-bold uppercase tracking-wider mb-1" style={{fontFamily: 'Space Grotesk'}}>{cat}</p>
                <p className="text-3xl font-bold" style={{fontFamily: 'Syne'}}>{count}</p>
              </div>
            ))}
          </div>
        </div>
        
        <h2 className="text-4xl font-bold mb-8" style={{fontFamily: 'Syne'}}>All Works by {profile.author_name}</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="student-works-grid">
          {profile.works.map(work => (
            <div
              key={work.id}
              className="bg-white border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
              data-testid={`work-card-${work.id}`}
            >
              <div className="flex justify-between items-start mb-4">
                <span className="bg-[#3366FF] text-white px-3 py-1 text-xs uppercase tracking-wider border border-black transform -rotate-1" style={{fontFamily: 'Space Grotesk'}}>{work.category}</span>
              </div>
              <div onClick={() => navigate(`/work/${work.id}`)} className="cursor-pointer">
                <h3 className="text-2xl font-bold mb-2" style={{fontFamily: 'Syne'}}>{work.title}</h3>
                {work.title_hi && <p className="text-xl mb-3" style={{fontFamily: 'Rozha One', fontSize: '1.3rem'}}>{work.title_hi}</p>}
                <p className="text-sm text-gray-700 line-clamp-3 mb-4" style={{fontFamily: 'Space Grotesk'}}>{work.content.substring(0, 150)}...</p>
                <p className="text-sm text-gray-600" style={{fontFamily: 'Space Grotesk'}}>Class {work.author_class}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Submit() {
  const [formData, setFormData] = useState({
    title: '',
    title_hi: '',
    content: '',
    content_hi: '',
    author_name: '',
    author_class: '',
    category: 'poem',
    language: 'english'
  });
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      await axios.post(`${API}/submissions`, formData);
      toast.success('Work submitted successfully! Awaiting admin approval.');
      setFormData({
        title: '',
        title_hi: '',
        content: '',
        content_hi: '',
        author_name: '',
        author_class: '',
        category: 'poem',
        language: 'english'
      });
    } catch (error) {
      console.error('Error submitting work:', error);
      toast.error('Failed to submit work. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen" style={{backgroundColor: '#F4F1EA'}} data-testid="submit-page">
      <Header />
      <div className="max-w-3xl mx-auto px-4 md:px-8 py-12">
        <h1 className="text-5xl md:text-7xl font-bold mb-4" style={{fontFamily: 'Syne'}} data-testid="submit-title">Submit Your Work</h1>
        <p className="text-lg mb-8" style={{fontFamily: 'Space Grotesk'}}>अपनी रचना सबमिट करें</p>
        
        <form onSubmit={handleSubmit} className="bg-white border-2 border-black p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]" data-testid="submit-form">
          <div className="mb-6">
            <label className="block text-sm font-bold uppercase tracking-wider mb-2" style={{fontFamily: 'Space Grotesk'}} data-testid="author-name-label">Author Name / लेखक का नाम *</label>
            <input
              type="text"
              required
              value={formData.author_name}
              onChange={(e) => setFormData(prev => ({ ...prev, author_name: e.target.value }))}
              className="w-full bg-white border-2 border-black p-3 focus:outline-none focus:ring-2 focus:ring-[#CCFF00] focus:border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)]"
              style={{fontFamily: 'Space Grotesk'}}
              data-testid="author-name-input"
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-bold uppercase tracking-wider mb-2" style={{fontFamily: 'Space Grotesk'}} data-testid="author-class-label">Class / कक्षा *</label>
            <input
              type="text"
              required
              value={formData.author_class}
              onChange={(e) => setFormData(prev => ({ ...prev, author_class: e.target.value }))}
              className="w-full bg-white border-2 border-black p-3 focus:outline-none focus:ring-2 focus:ring-[#CCFF00] focus:border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)]"
              style={{fontFamily: 'Space Grotesk'}}
              placeholder="e.g., 10th A"
              data-testid="author-class-input"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-bold uppercase tracking-wider mb-2" style={{fontFamily: 'Space Grotesk'}} data-testid="category-label">Category *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full bg-white border-2 border-black p-3 focus:outline-none focus:ring-2 focus:ring-[#CCFF00] focus:border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)]"
                style={{fontFamily: 'Space Grotesk'}}
                data-testid="category-select"
              >
                {categories.map(cat => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-bold uppercase tracking-wider mb-2" style={{fontFamily: 'Space Grotesk'}} data-testid="language-label">Language *</label>
              <select
                value={formData.language}
                onChange={(e) => setFormData(prev => ({ ...prev, language: e.target.value }))}
                className="w-full bg-white border-2 border-black p-3 focus:outline-none focus:ring-2 focus:ring-[#CCFF00] focus:border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)]"
                style={{fontFamily: 'Space Grotesk'}}
                data-testid="language-select"
              >
                <option value="english">English Only</option>
                <option value="hindi">Hindi Only</option>
                <option value="both">Both Languages</option>
              </select>
            </div>
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-bold uppercase tracking-wider mb-2" style={{fontFamily: 'Space Grotesk'}} data-testid="title-label">Title (English) *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full bg-white border-2 border-black p-3 focus:outline-none focus:ring-2 focus:ring-[#CCFF00] focus:border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)]"
              style={{fontFamily: 'Space Grotesk'}}
              data-testid="title-input"
            />
          </div>
          
          {(formData.language === 'hindi' || formData.language === 'both') && (
            <div className="mb-6">
              <label className="block text-sm font-bold uppercase tracking-wider mb-2" style={{fontFamily: 'Space Grotesk'}} data-testid="title-hindi-label">शीर्षक (हिंदी)</label>
              <input
                type="text"
                value={formData.title_hi}
                onChange={(e) => setFormData(prev => ({ ...prev, title_hi: e.target.value }))}
                className="w-full bg-white border-2 border-black p-3 focus:outline-none focus:ring-2 focus:ring-[#CCFF00] focus:border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)]"
                style={{fontFamily: 'Rozha One', fontSize: '1.1rem'}}
                data-testid="title-hindi-input"
              />
            </div>
          )}
          
          <div className="mb-6">
            <label className="block text-sm font-bold uppercase tracking-wider mb-2" style={{fontFamily: 'Space Grotesk'}} data-testid="content-label">Content (English) *</label>
            <textarea
              required
              rows="10"
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              className="w-full bg-white border-2 border-black p-3 focus:outline-none focus:ring-2 focus:ring-[#CCFF00] focus:border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)]"
              style={{fontFamily: 'Space Grotesk'}}
              data-testid="content-input"
            />
          </div>
          
          {(formData.language === 'hindi' || formData.language === 'both') && (
            <div className="mb-6">
              <label className="block text-sm font-bold uppercase tracking-wider mb-2" style={{fontFamily: 'Space Grotesk'}} data-testid="content-hindi-label">सामग्री (हिंदी)</label>
              <textarea
                rows="10"
                value={formData.content_hi}
                onChange={(e) => setFormData(prev => ({ ...prev, content_hi: e.target.value }))}
                className="w-full bg-white border-2 border-black p-3 focus:outline-none focus:ring-2 focus:ring-[#CCFF00] focus:border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)]"
                style={{fontFamily: 'Rozha One', fontSize: '1.1rem'}}
                data-testid="content-hindi-input"
              />
            </div>
          )}
          
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-[#CCFF00] text-black px-8 py-4 font-bold text-lg border-2 border-black hover:bg-[#FF0055] hover:text-white transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{fontFamily: 'Space Grotesk'}}
            data-testid="submit-button"
          >
            {submitting ? 'Submitting...' : 'Submit Work'}
          </button>
        </form>
      </div>
    </div>
  );
}

function AdminLogin() {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [loggingIn, setLoggingIn] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoggingIn(true);
    
    try {
      const response = await axios.post(`${API}/admin/login`, credentials);
      localStorage.setItem('admin_token', response.data.token);
      toast.success('Logged in successfully!');
      navigate('/admin');
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Invalid credentials');
    } finally {
      setLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{backgroundColor: '#F4F1EA'}} data-testid="admin-login-page">
      <div className="w-full max-w-md px-4">
        <div className="bg-white border-2 border-black p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <h1 className="text-4xl font-bold mb-6" style={{fontFamily: 'Syne'}} data-testid="admin-login-title">Admin Login</h1>
          
          <form onSubmit={handleLogin} data-testid="admin-login-form">
            <div className="mb-6">
              <label className="block text-sm font-bold uppercase tracking-wider mb-2" style={{fontFamily: 'Space Grotesk'}} data-testid="admin-username-label">Username</label>
              <input
                type="text"
                required
                value={credentials.username}
                onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
                className="w-full bg-white border-2 border-black p-3 focus:outline-none focus:ring-2 focus:ring-[#CCFF00] focus:border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)]"
                style={{fontFamily: 'Space Grotesk'}}
                data-testid="admin-username-input"
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-bold uppercase tracking-wider mb-2" style={{fontFamily: 'Space Grotesk'}} data-testid="admin-password-label">Password</label>
              <input
                type="password"
                required
                value={credentials.password}
                onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                className="w-full bg-white border-2 border-black p-3 focus:outline-none focus:ring-2 focus:ring-[#CCFF00] focus:border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)]"
                style={{fontFamily: 'Space Grotesk'}}
                data-testid="admin-password-input"
              />
            </div>
            
            <button
              type="submit"
              disabled={loggingIn}
              className="w-full bg-black text-white px-8 py-4 font-bold text-lg border-2 border-transparent hover:bg-[#CCFF00] hover:text-black hover:border-black transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{fontFamily: 'Space Grotesk'}}
              data-testid="admin-login-submit-button"
            >
              {loggingIn ? 'Logging in...' : 'Login'}
            </button>
          </form>
          
          <p className="mt-4 text-sm text-gray-600 text-center" style={{fontFamily: 'Space Grotesk'}}>Default: admin / jnv2024</p>
        </div>
      </div>
    </div>
  );
}

function AdminDashboard() {
  const [pending, setPending] = useState([]);
  const [stats, setStats] = useState(null);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    const token = localStorage.getItem('admin_token');
    const headers = { Authorization: `Bearer ${token}` };
    
    try {
      const [pendingRes, statsRes] = await Promise.all([
        axios.get(`${API}/submissions/pending/list`, { headers }),
        axios.get(`${API}/stats`, { headers })
      ]);
      setPending(pendingRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('admin_token');
        navigate('/admin/login');
      }
    }
  };

  const handleApprove = async (id) => {
    const token = localStorage.getItem('admin_token');
    try {
      await axios.patch(`${API}/submissions/${id}/approve`, { admin_notes: adminNotes }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Submission approved!');
      setSelectedSubmission(null);
      setAdminNotes('');
      fetchData();
    } catch (error) {
      console.error('Error approving:', error);
      toast.error('Failed to approve submission');
    }
  };

  const handleReject = async (id) => {
    const token = localStorage.getItem('admin_token');
    try {
      await axios.patch(`${API}/submissions/${id}/reject`, { admin_notes: adminNotes }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Submission rejected');
      setSelectedSubmission(null);
      setAdminNotes('');
      fetchData();
    } catch (error) {
      console.error('Error rejecting:', error);
      toast.error('Failed to reject submission');
    }
  };

  return (
    <div className="min-h-screen" style={{backgroundColor: '#F4F1EA'}} data-testid="admin-dashboard-page">
      <Header />
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        <h1 className="text-5xl md:text-7xl font-bold mb-8" style={{fontFamily: 'Syne'}} data-testid="admin-dashboard-title">Admin Dashboard</h1>
        
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12" data-testid="stats-section">
            <div className="bg-white border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" data-testid="total-stat">
              <p className="text-sm font-bold uppercase tracking-wider mb-2" style={{fontFamily: 'Space Grotesk'}}>Total</p>
              <p className="text-4xl font-bold" style={{fontFamily: 'Syne'}}>{stats.total_submissions}</p>
            </div>
            <div className="bg-[#CCFF00] border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" data-testid="approved-stat">
              <p className="text-sm font-bold uppercase tracking-wider mb-2" style={{fontFamily: 'Space Grotesk'}}>Approved</p>
              <p className="text-4xl font-bold" style={{fontFamily: 'Syne'}}>{stats.approved}</p>
            </div>
            <div className="bg-[#FF0055] text-white border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" data-testid="pending-stat">
              <p className="text-sm font-bold uppercase tracking-wider mb-2" style={{fontFamily: 'Space Grotesk'}}>Pending</p>
              <p className="text-4xl font-bold" style={{fontFamily: 'Syne'}}>{stats.pending}</p>
            </div>
            <div className="bg-[#3366FF] text-white border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" data-testid="rejected-stat">
              <p className="text-sm font-bold uppercase tracking-wider mb-2" style={{fontFamily: 'Space Grotesk'}}>Rejected</p>
              <p className="text-4xl font-bold" style={{fontFamily: 'Syne'}}>{stats.rejected}</p>
            </div>
          </div>
        )}
        
        <h2 className="text-3xl font-bold mb-6" style={{fontFamily: 'Syne'}}>Pending Submissions</h2>
        
        {pending.length === 0 ? (
          <div className="bg-white border-2 border-black p-12 text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" data-testid="no-pending-message">
            <p className="text-xl" style={{fontFamily: 'Space Grotesk'}}>No pending submissions</p>
          </div>
        ) : (
          <div className="space-y-6" data-testid="pending-submissions-list">
            {pending.map(sub => (
              <div key={sub.id} className="bg-white border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" data-testid={`pending-submission-${sub.id}`}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="bg-[#3366FF] text-white px-3 py-1 text-xs uppercase tracking-wider border border-black transform -rotate-1" style={{fontFamily: 'Space Grotesk'}}>{sub.category}</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedSubmission(sub.id === selectedSubmission ? null : sub.id)}
                      className="bg-black text-white px-4 py-2 font-bold border-2 border-transparent hover:bg-[#CCFF00] hover:text-black hover:border-black transition-all"
                      style={{fontFamily: 'Space Grotesk'}}
                      data-testid={`view-submission-${sub.id}`}
                    >
                      {selectedSubmission === sub.id ? 'Hide' : 'Review'}
                    </button>
                  </div>
                </div>
                
                <h3 className="text-2xl font-bold mb-2" style={{fontFamily: 'Syne'}}>{sub.title}</h3>
                {sub.title_hi && <p className="text-xl mb-3" style={{fontFamily: 'Rozha One', fontSize: '1.3rem'}}>{sub.title_hi}</p>}
                <p className="text-sm mb-2" style={{fontFamily: 'Space Grotesk'}}>By {sub.author_name}, Class {sub.author_class}</p>
                <p className="text-sm text-gray-600" style={{fontFamily: 'Space Grotesk'}}>Language: {sub.language}</p>
                
                {selectedSubmission === sub.id && (
                  <div className="mt-6 pt-6 border-t-2 border-black" data-testid={`submission-review-${sub.id}`}>
                    <div className="mb-4">
                      <h4 className="font-bold mb-2" style={{fontFamily: 'Space Grotesk'}}>Content (English):</h4>
                      <p className="whitespace-pre-wrap" style={{fontFamily: 'Space Grotesk'}}>{sub.content}</p>
                    </div>
                    
                    {sub.content_hi && (
                      <div className="mb-4">
                        <h4 className="font-bold mb-2" style={{fontFamily: 'Space Grotesk'}}>सामग्री (हिंदी):</h4>
                        <p className="whitespace-pre-wrap" style={{fontFamily: 'Rozha One', fontSize: '1.1rem'}}>{sub.content_hi}</p>
                      </div>
                    )}
                    
                    <div className="mb-4">
                      <label className="block text-sm font-bold uppercase tracking-wider mb-2" style={{fontFamily: 'Space Grotesk'}}>Admin Notes (Optional)</label>
                      <textarea
                        rows="3"
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        className="w-full bg-white border-2 border-black p-3 focus:outline-none focus:ring-2 focus:ring-[#CCFF00] focus:border-black"
                        style={{fontFamily: 'Space Grotesk'}}
                        placeholder="Add notes for this submission..."
                        data-testid={`admin-notes-${sub.id}`}
                      />
                    </div>
                    
                    <div className="flex gap-4">
                      <button
                        onClick={() => handleApprove(sub.id)}
                        className="bg-[#CCFF00] text-black px-6 py-3 font-bold border-2 border-black hover:bg-[#b3e600] transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
                        style={{fontFamily: 'Space Grotesk'}}
                        data-testid={`approve-button-${sub.id}`}
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(sub.id)}
                        className="bg-[#FF0055] text-white px-6 py-3 font-bold border-2 border-black hover:bg-[#e6004d] transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
                        style={{fontFamily: 'Space Grotesk'}}
                        data-testid={`reject-button-${sub.id}`}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function App() {
  return (
    <div className="App">
      <Toaster position="top-right" richColors />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/browse" element={<Browse />} />
          <Route path="/work/:id" element={<WorkDetail />} />
          <Route path="/student/:authorName" element={<StudentProfile />} />
          <Route path="/submit" element={<Submit />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;