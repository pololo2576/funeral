import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import About from './components/About';
import Gallery from './components/Gallery';
import Life from './components/Life';
import Stories from './components/Stories';
import Navigation from './components/Navigation';
import Auth from './components/Auth'; // Import the Auth component
import Footer from './components/Footer';

function App() {
  return (
    <Router>
      <div>
        <Navigation />
        <Routes>
          <Route path="/" element={<About />} />
          <Route path="/life" element={<Life />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/stories" element={<Stories />} />
          <Route path="/auth" element={<Auth />} /> {/* Add the Auth route */}
        </Routes>
        <Footer />
      </div>
    </Router>
  );
}

export default App;

