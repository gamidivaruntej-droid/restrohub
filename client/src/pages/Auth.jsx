import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const Auth = ({ onLogin, onBackToLanding }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'Waiter' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (isLogin) {
                // Login existing user
                const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
                const user = userCredential.user;

                // Fetch additional user data from Firestore
                const userDoc = await getDoc(doc(db, 'users', user.uid));
                const userData = userDoc.exists() ? userDoc.data() : {
                    name: user.displayName || 'Staff Member',
                    role: 'Waiter',
                    isProfileComplete: true
                };

                onLogin({
                    uid: user.uid,
                    name: userData.name,
                    email: user.email,
                    role: userData.role,
                    isProfileComplete: true
                });
            } else {
                // Create new user
                const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
                const user = userCredential.user;

                // Set display name
                await updateProfile(user, { displayName: formData.name });

                // Create user profile in Firestore
                const userData = {
                    uid: user.uid,
                    name: formData.name,
                    email: formData.email,
                    role: formData.role,
                    isProfileComplete: false,
                    createdAt: new Date()
                };
                await setDoc(doc(db, 'users', user.uid), userData);

                onLogin(userData);
            }
            navigate('/home');
        } catch (err) {
            console.error("Auth Error:", err);
            setError(err.message.replace('Firebase:', '').trim());
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-wrapper">
            <div className="auth-card">
                {!isLogin && (
                    <button
                        className="back-button"
                        onClick={() => setIsLogin(true)}
                        title="Back to Login"
                    >
                        ←
                    </button>
                )}
                <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🥗</div>
                <h1 style={{ color: 'var(--accent)', fontSize: '3rem', fontWeight: '900', letterSpacing: '-2px', marginBottom: '0.5rem' }}>
                    <Link
                        to="/"
                        onClick={onBackToLanding}
                        style={{ textDecoration: 'none', color: 'var(--accent)' }}
                    >
                        RESTRO HUB
                    </Link>
                </h1>
                <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem', fontWeight: '800', fontSize: '0.85rem', letterSpacing: '1px', textTransform: 'uppercase' }}>Modern Restaurant Solutions</p>

                <h2 style={{ marginBottom: '0.5rem', fontWeight: '900', color: 'var(--text-main)' }}>
                    {isLogin ? 'Welcome Back' : 'Create Account'}
                </h2>
                {!isLogin && <p style={{ fontSize: '0.8rem', opacity: 0.7, marginBottom: '1.5rem', color: '#f87171' }}>⚠️ Domain selection is permanent and cannot be changed later.</p>}

                {error && (
                    <div style={{
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        color: '#ef4444',
                        padding: '10px',
                        borderRadius: '8px',
                        marginBottom: '1rem',
                        fontSize: '0.8rem',
                        fontWeight: '700'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    {!isLogin && (
                        <input
                            type="text"
                            placeholder="Full Name"
                            className="auth-input"
                            required
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    )}
                    <input
                        type="email"
                        placeholder="Email Address"
                        className="auth-input"
                        required
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        className="auth-input"
                        required
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                    {!isLogin && (
                        <div style={{ textAlign: 'left', marginBottom: '1rem' }}>
                            <label style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--accent)', marginLeft: '1.5rem', marginBottom: '0.5rem', display: 'block' }}>PROFESSIONAL DOMAIN</label>
                            <select
                                className="auth-input"
                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                style={{ marginTop: '0' }}
                            >
                                <option value="Waiter">Waiter (Service)</option>
                                <option value="Manager">Manager (Operations)</option>
                                <option value="Chef">Chef (Culinary)</option>
                                <option value="Cleaner">Housekeeping / Cleaning</option>
                                <option value="Kitchen Staff">Kitchen Support</option>
                            </select>
                        </div>
                    )}

                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? 'Processing...' : (isLogin ? 'Sign In Now' : 'Join RestroHub')}
                    </button>
                </form>

                <button
                    onClick={() => setIsLogin(!isLogin)}
                    style={{ marginTop: '1.5rem', color: 'var(--accent)', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 'bold' }}
                >
                    {isLogin ? "Need an account? Sign Up" : "Have an account? Log In"}
                </button>
            </div>
        </div>
    );
};

export default Auth;
