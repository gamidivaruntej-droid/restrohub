import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Auth from './pages/Auth';
import Home from './pages/Home';
import Tasks from './pages/Tasks';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';
import Chat from './pages/Chat';
import Settings from './pages/Settings';
import Landing from './pages/Landing';
import ProtectedRoute from './components/ProtectedRoute';
import Navigation from './components/Navigation';
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, updateDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(localStorage.getItem('restro_theme') || 'dark');
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('restro_theme', theme);
  }, [theme]);



  // Presence Logic
  useEffect(() => {
    if (!user?.uid) return;

    const updatePresence = async () => {
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          status: 'online',
          lastSeen: serverTimestamp()
        });
      } catch (error) {
        console.error("Error updating presence:", error);
      }
    };

    updatePresence();
    const interval = setInterval(updatePresence, 120000); // Every 2 mins

    return () => clearInterval(interval);
  }, [user?.uid]);

  useEffect(() => {
    let unsubscribeSnapshot = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Set an onSnapshot listener for the user's document
        const userRef = doc(db, 'users', firebaseUser.uid);
        unsubscribeSnapshot = onSnapshot(userRef, (userDoc) => {
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUser({ 
              ...userData, 
              uid: firebaseUser.uid, 
              email: firebaseUser.email,
              name: userData.name || userData.fullName || firebaseUser.displayName || 'Staff Member'
            });
          } else {
            // New user case
            const newUser = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              name: firebaseUser.displayName || 'Staff Member',
              role: 'Waiter',
              isProfileComplete: false
            };
            setUser(newUser);
          }
          setLoading(false);
        }, (error) => {
          console.error("User snapshot error:", error);
          setLoading(false);
        });
      } else {
        if (unsubscribeSnapshot) unsubscribeSnapshot();
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, []);

  const handleLogout = async () => {
    if (user?.uid) {
      try {
        await updateDoc(doc(db, 'users', user.uid), { status: 'offline' });
      } catch (e) {
        console.error("Logout presence error:", e);
      }
    }
    await signOut(auth);
    setUser(null);
    setShowAuth(false);
  };

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  if (loading) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--primary-bg)',
        color: 'var(--accent)',
        fontSize: '1.5rem',
        fontWeight: '900'
      }}>
        RESTRO HUB LOADING...
      </div>
    );
  }

  return (
    <div className="app-container">
      <Router>


        <button className="theme-toggle" onClick={toggleTheme}>
          {theme === 'dark' ? '☀️ MODE' : '🌙 MODE'}
        </button>

        {user ? (
          <>
            <Navigation onLogout={handleLogout} user={user} />
            <div className="content-wrapper">
              <Routes>
                <Route path="/home" element={
                  <ProtectedRoute isAuthenticated={!!user}>
                    {!user?.isProfileComplete ? <Navigate to="/profile" replace /> : <Home user={user} />}
                  </ProtectedRoute>
                } />

                <Route path="/tasks" element={
                  <ProtectedRoute isAuthenticated={!!user}>
                    {!user?.isProfileComplete ? <Navigate to="/profile" replace /> : <Tasks user={user} />}
                  </ProtectedRoute>
                } />

                <Route path="/notifications" element={
                  <ProtectedRoute isAuthenticated={!!user}>
                    {!user?.isProfileComplete ? <Navigate to="/profile" replace /> : <Notifications user={user} />}
                  </ProtectedRoute>
                } />

                <Route path="/community" element={
                  <ProtectedRoute isAuthenticated={!!user}>
                    {!user?.isProfileComplete ? <Navigate to="/profile" replace /> : <Chat user={user} />}
                  </ProtectedRoute>
                } />

                <Route path="/settings" element={
                  <ProtectedRoute isAuthenticated={!!user}>
                    {!user?.isProfileComplete ? <Navigate to="/profile" replace /> : <Settings user={user} theme={theme} toggleTheme={toggleTheme} />}
                  </ProtectedRoute>
                } />

                <Route path="/profile" element={
                  <ProtectedRoute isAuthenticated={!!user}>
                    <Profile user={user} onUpdate={(updatedUser) => setUser({ ...user, ...updatedUser, isProfileComplete: true })} />
                  </ProtectedRoute>
                } />

                <Route path="*" element={<Navigate to={user?.isProfileComplete ? "/home" : "/profile"} replace />} />
              </Routes>
            </div>
          </>
        ) : (
          <Routes>
            <Route path="/" element={
              showAuth ? (
                <Auth
                  onLogin={(u) => { setUser(u); }}
                  onBackToLanding={() => setShowAuth(false)}
                />
              ) : (
                <Landing onGetStarted={() => setShowAuth(true)} />
              )
            } />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        )}
      </Router>
    </div>
  );
}

export default App;
