import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import {
    collection,
    query,
    where,
    onSnapshot,
    orderBy,
    getDocs,
    deleteDoc,
    doc,
    writeBatch
} from 'firebase/firestore';

const Notifications = ({ user }) => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user?.uid) return;

        const q = query(
            collection(db, 'notifications'),
            where('userId', '==', user.uid)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const notifs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })).sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

            setNotifications(notifs);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user?.uid]);

    const markAllAsRead = async () => {
        try {
            const batch = writeBatch(db);
            notifications.forEach(n => {
                batch.delete(doc(db, 'notifications', n.id));
            });
            await batch.commit();
        } catch (err) {
            console.error("Mark all as read error:", err);
        }
    };

    return (
        <div className="page-container" style={{ maxWidth: '900px' }}>
            <h1 style={{ textAlign: 'center', marginBottom: '3rem', fontSize: '3rem', fontWeight: '800' }}>Notifications</h1>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
                {loading ? (
                    <p style={{ textAlign: 'center', opacity: 0.5 }}>Syncing alerts...</p>
                ) : notifications.length > 0 ? (
                    notifications.map((notif) => (
                        <div
                            key={notif.id}
                            className="stat-card"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '24px',
                                padding: '1.5rem 2rem',
                                textAlign: 'left',
                                borderLeft: `6px solid ${notif.color}`
                            }}
                        >
                            <div style={{
                                fontSize: '2rem',
                                backgroundColor: `${notif.color}15`,
                                width: '64px',
                                height: '64px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '16px'
                            }}>
                                {notif.icon}
                            </div>

                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>{notif.title}</h3>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{notif.time}</span>
                                </div>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.5' }}>
                                    {notif.message}
                                </p>
                                <div style={{ marginTop: '10px' }}>
                                    <span style={{
                                        fontSize: '0.7rem',
                                        backgroundColor: 'var(--secondary-bg)',
                                        padding: '4px 10px',
                                        borderRadius: '6px',
                                        fontWeight: '800',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px',
                                        color: notif.color,
                                        border: `1px solid ${notif.color}30`
                                    }}>
                                        {notif.type}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="stat-card" style={{ padding: '3rem', textAlign: 'center', opacity: 0.5 }}>
                        🚀 All caught up! No active alerts for you.
                    </div>
                )}
            </div>

            {notifications.length > 0 && (
                <div style={{ marginTop: '4rem', textAlign: 'center' }}>
                    <button
                        className="btn-primary"
                        style={{ maxWidth: '240px', background: 'transparent', border: '2px solid var(--border)', color: 'var(--text-muted)' }}
                        onClick={markAllAsRead}
                    >
                        Mark all as read
                    </button>
                </div>
            )}
        </div>
    );
};

export default Notifications;
