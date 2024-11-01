import React, { useState, useEffect, useRef } from 'react';
import { collection, addDoc, getDocs, doc, deleteDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage, auth } from '../firebase/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUpload, faPen, faTrash, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import '../styles/Gallery.css';

const Gallery = () => {
  const [photos, setPhotos] = useState([]);
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [description, setDescription] = useState('');
  const formRef = useRef(null);
  const fileInputRef = useRef(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showFullscreenForm, setShowFullscreenForm] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth <= 1300);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [offlineMessage, setOfflineMessage] = useState(false);

  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        const photosCollection = collection(db, 'images');
        const photoSnapshot = await getDocs(photosCollection);
        const photoList = photoSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setPhotos(photoList);
      } catch (error) {
        console.error('Error fetching photos:', error);
        setPhotos(null);
      }
    };

    fetchPhotos();
  }, []);

  useEffect(() => {
    const checkAdminStatus = async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setIsAdmin(userDoc.data().admin);
        }
      }
    };

    const unsubscribe = onAuthStateChanged(auth, checkAdminStatus);
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

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && !selectedFile.type.startsWith('image/')) {
      alert('Please select an image file.');
      setFile(null);
      setFileName('');
      return;
    }
    setFile(selectedFile);
    setFileName(selectedFile.name);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) return;

    const storageRef = ref(storage, `images/${file.name}`);
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);

    try {
      const photosCollection = collection(db, 'images');
      const docRef = await addDoc(photosCollection, { imageUrl: downloadURL, description });
      setPhotos([{ id: docRef.id, imageUrl: downloadURL, description }, ...photos]);
      setFile(null);
      setFileName('');
      setDescription('');
      setShowFullscreenForm(false);
    } catch (error) {
      console.error('Error adding document: ', error);
    }
  };

  const handleAddPhotoClick = () => {
    if (isSmallScreen) {
      setShowFullscreenForm(true);
    } else {
      formRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleFileUploadClick = () => {
    fileInputRef.current.click();
  };

  const handleDeletePhoto = async () => {
    if (selectedPhoto) {
      try {
        const imageUrl = selectedPhoto.imageUrl;
        const decodedUrl = decodeURIComponent(imageUrl);
        const fileName = decodedUrl.split('/').pop().split('?')[0];

        const photoRef = ref(storage, `images/${fileName}`);
        await deleteObject(photoRef);

        await deleteDoc(doc(db, 'images', selectedPhoto.id));

        setPhotos(photos.filter(photo => photo.id !== selectedPhoto.id));
        setSelectedPhoto(null);
      } catch (error) {
        console.error('Error deleting photo:', error);
      }
    }
  };

  const handleSelectPhoto = (photo) => {
    setSelectedPhoto(photo);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prevSlide) => (prevSlide + 1) % (photos.length || 1));
    }, 3000);
    return () => clearInterval(interval);
  }, [photos.length]);

  useEffect(() => {
    const handleResize = () => {
      const screenWidth = window.innerWidth;
      setIsSmallScreen(screenWidth <= 1300);
    };

    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="gallery-page">
      {offlineMessage && <div className="offline-message">You are currently offline. Some features may not be available.</div>}
      <div className="gallery-content-wrapper">
        <div className="main-content">
          <div className="gallery-container">
            <div className="gallery-header">
              <button className="btn" onClick={handleAddPhotoClick}>
                Add photos
              </button>
              {isAdmin && (
                <button className="btn" onClick={handleDeletePhoto} disabled={!selectedPhoto}>
                  Delete Photo
                </button>
              )}
            </div>
            <div className="photos">
              <ul>
                {photos.length > 0 ? (
                  photos.map((photo, index) => (
                    <li
                      key={index}
                      className={selectedPhoto?.id === photo.id ? 'selected' : ''}
                      onClick={() => handleSelectPhoto(photo)}
                    >
                      <span className="new-label">NEW</span>
                      <img src={photo.imageUrl} alt="Gallery" />
                      <p>{photo.description}</p>
                    </li>
                  ))
                ) : (
                  <p className="loading-message">Loading photos...</p>
                )}
              </ul>
            </div>
          </div>
          {!isSmallScreen && (
            <div ref={formRef} className="photo-form">
              <h2>Add Photos</h2>
              <form onSubmit={handleSubmit}>
                <div className="file-upload" onClick={handleFileUploadClick}>
                  <FontAwesomeIcon icon={faUpload} size="2x" />
                  <label>{fileName || 'Choose file'}</label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    required
                    style={{ display: 'none' }}
                  />
                </div>
                <button type="submit" className="btn upload-btn">Upload</button>
              </form>
            </div>
          )}
          {isSmallScreen && showFullscreenForm && (
            <div className={`photo-form fullscreen`}>
              <button className="return-btn" onClick={() => setShowFullscreenForm(false)}>
                <FontAwesomeIcon icon={faArrowLeft} />
              </button>
              <h2>Add Photos</h2>
              <form onSubmit={handleSubmit}>
                <div className="file-upload" onClick={handleFileUploadClick}>
                  <FontAwesomeIcon icon={faUpload} size="2x" />
                  <label>{fileName || 'Choose file'}</label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    required
                    style={{ display: 'none' }}
                  />
                </div>
                <button type="submit" className="btn upload-btn">Upload</button>
              </form>
            </div>
          )}
        </div>
        <div className="gallery-sidebar">
          <div className="diaporama-box">
            <h3>Photos</h3>
            {photos.length > 0 && photos[currentSlide] ? (
              <img src={photos[currentSlide].imageUrl} alt="Slideshow" />
            ) : (
              <p className="loading-message">Loading slideshow...</p>
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

      {isSmallScreen && isAdmin && (
        <button className="floating-btn" onClick={handleAddPhotoClick}>
          <FontAwesomeIcon icon={faPen} />
          <span className="btn-text">Add Photo</span>
        </button>
      )}
    </div>
  );
};

export default Gallery;
