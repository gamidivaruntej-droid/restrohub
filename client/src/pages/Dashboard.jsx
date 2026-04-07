import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

const Dashboard = ({ user }) => {
    const [shiftStatus, setShiftStatus] = useState({
        checkIn: null, checkInTime: null, checkOut: null
    });
    const [elapsedTime, setElapsedTime] = useState(0);

    // Sync Shift Data
    useEffect(() => {
        if (!user?.uid) return;

        const today = new Date().toISOString().split('T')[0];
        const q = query(
            collection(db, 'shifts'),
            where('userId', '==', user.uid),
            where('date', '==', today)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            if (!snapshot.empty) {
                const shiftData = snapshot.docs[0].data();
                setShiftStatus({
                    checkIn: shiftData.checkIn,
                    checkInTime: shiftData.checkInTime?.toDate(),
                    checkOut: shiftData.checkOut
                });
            } else {
                setShiftStatus({ checkIn: null, checkInTime: null, checkOut: null });
            }
        });

        return () => unsubscribe();
    }, [user?.uid]);

    // Live Working Hours Counter
    useEffect(() => {
        let interval;
        if (shiftStatus.checkInTime && !shiftStatus.checkOut) {
            interval = setInterval(() => {
                const now = new Date();
                const diff = Math.floor((now - shiftStatus.checkInTime) / 1000);
                setElapsedTime(diff);
            }, 1000);
        } else if (shiftStatus.checkInTime && shiftStatus.checkOut) {
            // Already checked out, hold the final time
            setElapsedTime(0); // Optionally calculate diff between checkout and checkin here
        } else {
            setElapsedTime(0);
        }
        return () => clearInterval(interval);
    }, [shiftStatus.checkInTime, shiftStatus.checkOut]);

    const formatTime = (totalSeconds) => {
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = totalSeconds % 60;
        return `${h}h ${m}m ${s}s`;
    };

    const getStatusDisplay = () => {
        if (!shiftStatus.checkIn) return <span style={{ color: '#ef4444' }}>Not Started</span>;
        if (shiftStatus.checkIn && !shiftStatus.checkOut) return <span style={{ color: '#10b981' }}>Active</span>;
        return <span style={{ color: '#f59e0b' }}>Completed</span>;
    };

    return (
        <div className="dashboard-wrapper" style={{ minHeight: 'auto', display: 'flex', justifyContent: 'center', width: '100%' }}>
            <div className="auth-card" style={{ maxWidth: '600px', width: '100%', margin: '0 auto' }}>
                <h1 style={{ color: 'var(--accent)', fontSize: '2.5rem' }}>Welcome, {user?.name}!</h1>
                <p style={{ margin: '1.5rem 0', color: 'var(--text-muted)', fontSize: '1.1rem' }}>
                    Your centralized worker hub.
                </p>

                <div style={{ textAlign: 'left', marginTop: '2rem', padding: '1.5rem', background: 'var(--secondary-bg)', borderRadius: '16px', borderLeft: '4px solid var(--accent)' }}>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--accent)' }}>⏱️ Daily Briefing</h3>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                        <div>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '800' }}>Shift Status</p>
                            <p style={{ fontWeight: '700', fontSize: '1.2rem' }}>{getStatusDisplay()}</p>
                        </div>
                        <div>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '800' }}>Live Working Hours</p>
                            <p style={{ fontWeight: '900', fontSize: '1.25rem', color: shiftStatus.checkIn && !shiftStatus.checkOut ? 'var(--text-main)' : 'var(--text-muted)' }}>
                                {shiftStatus.checkIn && !shiftStatus.checkOut ? formatTime(elapsedTime) : '--:--:--'}
                            </p>
                        </div>
                        <div>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '800' }}>Check-In Time</p>
                            <p style={{ fontWeight: '600', color: shiftStatus.checkIn ? 'var(--text-main)' : 'var(--text-muted)' }}>{shiftStatus.checkIn || 'Pending'}</p>
                        </div>
                        <div>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '800' }}>Check-Out Time</p>
                            <p style={{ fontWeight: '600', color: shiftStatus.checkOut ? 'var(--text-main)' : 'var(--text-muted)' }}>{shiftStatus.checkOut || 'Pending'}</p>
                        </div>
                    </div>

                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '8px', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                        Navigate to the <strong style={{ color: 'var(--accent)' }}>Tasks</strong> tab to officially clock in and view your duties.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
