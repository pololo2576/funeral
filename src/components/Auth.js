// src/components/Auth.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { getDoc, doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/firebase';
import '../styles/Auth.css';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const googleProvider = new GoogleAuthProvider();

  const handleAuth = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      setMessage('Please fill in all fields.');
      return;
    }

    try {
      if (isRegister) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, 'users', userCredential.user.uid), { email, admin: false });
        setMessage('Successfully registered!');
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        setMessage('Successfully signed in!');
      }
      navigate('/');
    } catch (error) {
      console.error('Error with authentication', error);
      setMessage('Error with authentication');
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const userDoc = await getDoc(doc(db, 'users', result.user.uid));
      if (!userDoc.exists()) {
        await setDoc(doc(db, 'users', result.user.uid), { email: result.user.email, admin: false });
      }
      setMessage('Successfully signed in with Google!');
      navigate('/');
    } catch (error) {
      console.error('Error with Google authentication', error);
      setMessage('Error with Google authentication');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-form">
        <h2>{isRegister ? 'Register' : 'Login'}</h2>
        <form onSubmit={handleAuth}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit">{isRegister ? 'Register' : 'Login'}</button>
        </form>
        <button onClick={() => setIsRegister(!isRegister)}>
          {isRegister ? 'Already have an account? Login' : "Don't have an account? Register"}
        </button>
        <button onClick={handleGoogleSignIn} className="google-signin-btn">
          Sign in with Google
        </button>
        {message && <p className="message">{message}</p>}
      </div>
    </div>
  );
};

export default Auth;
