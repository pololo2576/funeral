import React, { useState, useEffect, useRef } from 'react';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { db, auth } from '../firebase/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPen, faFeatherAlt, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import '../styles/Stories.css';

const Stories = () => {
  const [showForm, setShowForm] = useState(false);
  const [stories, setStories] = useState([]);
  const [name, setName] = useState('');
  const [story, setStory] = useState('');
  const [photos, setPhotos] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [expandedStories, setExpandedStories] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authMessage, setAuthMessage] = useState('');
  const [offlineMessage, setOfflineMessage] = useState(false);
  const formRef = useRef(null);

  useEffect(() => {
    const fetchStories = async () => {
      try {
        const storiesCollection = collection(db, 'testimonials');
        const storySnapshot = await getDocs(storiesCollection);
        const storyList = storySnapshot.docs.map(doc => doc.data());
        setStories(storyList);
      } catch (error) {
        console.error('Error fetching stories:', error);
        setStories(null);
      }
    };

    fetchStories();
  }, []);

  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        const photosCollection = collection(db, 'images');
        const photoSnapshot = await getDocs(photosCollection);
        const photoList = photoSnapshot.docs.map(doc => doc.data());
        setPhotos(photoList);
      } catch (error) {
        console.error('Error fetching photos:', error);
        setPhotos(null);
      }
    };

    fetchPhotos();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prevSlide) => (prevSlide + 1) % (photos.length || 1));
    }, 3000);
    return () => clearInterval(interval);
  }, [photos.length]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleOffline = () => setOfflineMessage(true);
    const handleOnline = () => setOfflineMessage(false);

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    if (!navigator.onLine) {
      setOfflineMessage(true);
    }

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      setAuthMessage('Please log in or sign up to submit a story.');
      setTimeout(() => {
        setAuthMessage('');
      }, 6000);
      return;
    }

    const currentDate = new Date().toISOString();

    try {
      const storiesCollection = collection(db, 'testimonials');
      await addDoc(storiesCollection, { name, story, date: currentDate });
      setStories([{ name, story, date: currentDate }, ...stories]);
      setName('');
      setStory('');
      setShowForm(false); // Close the form after submission
    } catch (error) {
      console.error('Error adding document: ', error);
    }
  };

  const handleAddStoryClick = () => {
    if (window.innerWidth > 1300) {
      formRef.current.scrollIntoView({ behavior: 'smooth' });
    } else {
      setShowForm(true);
    }
  };

  const toggleStory = (index) => {
    if (expandedStories.includes(index)) {
      setExpandedStories(expandedStories.filter(i => i !== index));
    } else {
      setExpandedStories([...expandedStories, index]);
    }
  };

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleString('default', { month: 'long', day: 'numeric' });
  };

  return (
    <div className="stories-page">
      {offlineMessage && <div className="offline-message">You are currently offline. Some features may not be available.</div>}
      <div className="stories-main">
        <div className="stories-container">
          <div className="stories-header">
            <h2>Share a special moment from FELICITE's life.</h2>
            <button className="btn" onClick={handleAddStoryClick}>
              <FontAwesomeIcon icon={faPen} />
              Write a story
            </button>
          </div>

          <div className="stories">
            <ul>
              {stories ? (
                stories.map((s, index) => (
                  <li key={index}>
                    <span className="new-label">NEW</span>
                    <FontAwesomeIcon icon={faFeatherAlt} className="story-icon" />
                    <div className="story-header">
                      <small className="date">{formatDate(s.date)}</small>
                      <span className="by">• by </span>
                      <h3>{s.name}</h3>
                    </div>
                    <p className={`story-content ${expandedStories.includes(index) ? 'expanded' : ''}`}>
                      {expandedStories.includes(index) ? s.story : `${s.story.substring(0, 200)}...`}
                      {s.story.length > 200 && (
                        <span className="read-more" onClick={() => toggleStory(index)}>
                          {expandedStories.includes(index) ? ' Show less' : ' Read more'}
                        </span>
                      )}
                    </p>
                  </li>
                ))
              ) : (
                <p className="loading-message">Loading stories...</p>
              )}
            </ul>
          </div>

          <div ref={formRef} className={`story-form ${showForm && window.innerWidth <= 1300 ? 'fullscreen' : ''}`}>
            {showForm && window.innerWidth <= 1300 && (
              <button className="return-btn" onClick={() => setShowForm(false)}>
                <FontAwesomeIcon icon={faArrowLeft} />
              </button>
            )}
            <h2>Share a story</h2>
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Name (required)"
              />
              <textarea
                value={story}
                onChange={(e) => setStory(e.target.value)}
                required
                placeholder="Write your story here..."
              />
              <button type="submit" className="btn">Publish</button>
            </form>
            {authMessage && <p className="auth-message">{authMessage}</p>}
          </div>
        </div>
        <div className="stories-sidebar">
          <div className="diaporama-box">
            <h3>Photos</h3>
            {photos ? (
              photos.length > 0 && (
                <img src={photos[currentSlide].imageUrl} alt="Slideshow" />
              )
            ) : (
              <p className="loading-message">Loading photos...</p>
            )}
          </div>
          <div className="updates-box">
            <h3>Recent updates</h3>
            <ul>
              <li>June 18 - JANE EPITCHOP shared a story.</li>
              <li>June 18 - JANE EPITCHOP left a tribute.</li>
              <li>June 17 - FELICITE MANGO VEUVE NGUETEMO added 21 stories.</li>
              <li>June 17 - FELICITE MANGO VEUVE NGUETEMO left 2 tributes.</li>
              <li>June 17 - FELICITE MANGO VEUVE NGUETEMO added 5 photos.</li>
            </ul>
            <button className="btn show-more-btn">Show more</button>
          </div>
        </div>
      </div>
      {window.innerWidth <= 1300 && (
        <button className="floating-btn" onClick={handleAddStoryClick}>
          <FontAwesomeIcon icon={faPen} />
          <span className="btn-text">Add Story</span>
        </button>
      )}
    </div>
  );
};

export default Stories;
