import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, orderBy, limit, updateDoc, doc, addDoc, serverTimestamp } from 'firebase/firestore';

const Home = ({ user }) => {
    const navigate = useNavigate();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [status, setStatus] = useState('Available');
    const [checkedIn, setCheckedIn] = useState(false);
    const [workingSeconds, setWorkingSeconds] = useState(0);
    const [notifications, setNotifications] = useState([]);
    const [loadingNotifs, setLoadingNotifs] = useState(true);
    const [tasks, setTasks] = useState([]);
    const [stats, setStats] = useState({ completed: 0, active: 0, pending: 0, performance: 0, completion: 0 });
    const [shiftDocId, setShiftDocId] = useState(null);

    // Dynamic greeting
    const getGreeting = () => {
        const hour = currentTime.getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    // Update current time every minute
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    // Sync Attendance with Firestore
    useEffect(() => {
        if (!user?.uid) return;
        const today = new Date().toLocaleDateString('en-CA');
        const q = query(
            collection(db, 'shifts'),
            where('userId', '==', user.uid),
            where('date', '==', today)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            if (!snapshot.empty) {
                const shiftData = snapshot.docs[0].data();
                setShiftDocId(snapshot.docs[0].id);
                // Status is checked in if we have a checkIn but no checkOut
                const isActive = !!shiftData.checkIn && !shiftData.checkOut;
                setCheckedIn(isActive);
                
                if (shiftData.checkInTime && !shiftData.checkOut) {
                    const start = shiftData.checkInTime.toDate();
                    const now = new Date();
                    setWorkingSeconds(Math.floor((now - start) / 1000));
                }
            } else {
                setCheckedIn(false);
                setShiftDocId(null);
                setWorkingSeconds(0);
            }
        });
        return () => unsubscribe();
    }, [user?.uid]);

    // Timer Logic for Working Seconds
    useEffect(() => {
        let interval;
        if (checkedIn) {
            interval = setInterval(() => {
                setWorkingSeconds(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [checkedIn]);

    // Sync Tasks & Stats with Firestore
    useEffect(() => {
        if (!user?.uid) return;
        const q = query(collection(db, 'tasks'), where('userId', '==', user.uid));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const taskList = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            
            const pending = taskList.filter(t => t.status === 'pending').length;
            const active = taskList.filter(t => t.status === 'in-progress').length;
            const completed = taskList.filter(t => t.status === 'completed').length;
            const total = taskList.length;
            
            const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
            // Performance can be completion rate plus active tasks weighted
            const performanceRate = total > 0 ? Math.round(((completed + (active * 0.5)) / total) * 100) : 100;

            setTasks(taskList);
            setStats({
                pending,
                active,
                completed,
                completion: completionRate,
                performance: performanceRate
            });
        });
        return () => unsubscribe();
    }, [user?.uid]);

    // Real-time Notifications (Top 3)
    useEffect(() => {
        if (!user?.uid) return;
        const q = query(
            collection(db, 'notifications'),
            where('userId', '==', user.uid),
            orderBy('createdAt', 'desc'),
            limit(3)
        );
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setNotifications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoadingNotifs(false);
        });
        return () => unsubscribe();
    }, [user?.uid]);

    const formatTime = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    const statusColors = {
        'Available': '#10b981',
        'Busy': '#ef4444',
        'On Break': '#f59e0b',
        'Offline': '#6b7280'
    };

    const handleCheckIn = async () => {
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const dateStr = now.toLocaleDateString('en-CA');
        try {
            await addDoc(collection(db, 'shifts'), {
                userId: user.uid,
                date: dateStr,
                checkIn: timeStr,
                checkInTime: serverTimestamp(),
                checkOut: null,
                createdAt: serverTimestamp()
            });
        } catch (error) {
            console.error("Check-in error:", error);
        }
    };

    const handleCheckOut = async () => {
        if (!shiftDocId) return;
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        try {
            await updateDoc(doc(db, 'shifts', shiftDocId), {
                checkOut: timeStr,
                checkOutTime: serverTimestamp()
            });
        } catch (error) {
            console.error("Check-out error:", error);
        }
    };

    const completeTask = async (taskId) => {
        if (!checkedIn) return alert("❌ Please check in first!");
        try {
            await updateDoc(doc(db, 'tasks', taskId), {
                status: 'completed',
                updatedAt: serverTimestamp()
            });
        } catch (error) {
            console.error("Task completion error:", error);
        }
    };

    const focusTask = tasks.find(t => t.status === 'in-progress') || tasks.find(t => t.status === 'pending');

    return (
        <div className="page-container">
            {/* 1. Greeting Section */}
            <div className="hero-section animate-hero" style={{ padding: '2.5rem', marginBottom: '0' }}>
                <div style={{ 
                    display: 'flex', 
                    flexDirection: window.innerWidth < 768 ? 'column' : 'row',
                    justifyContent: 'space-between', 
                    alignItems: window.innerWidth < 768 ? 'center' : 'flex-start', 
                    textAlign: window.innerWidth < 768 ? 'center' : 'left',
                    width: '100%',
                    gap: '20px'
                }}>
                    <div>
                        <h2 style={{ fontSize: '0.85rem', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: '800', marginBottom: '0.5rem' }}>
                            {getGreeting()}
                        </h2>
                        <h1 className="responsive-h1" style={{ fontSize: '3rem', fontWeight: '900', color: 'var(--text-main)', marginBottom: '1rem' }}>
                            {user?.fullName || user?.name || 'Staff Member'}
                        </h1>
                        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: window.innerWidth < 768 ? 'center' : 'flex-start', gap: '10px' }}>
                            <span style={{ fontSize: '0.8rem', padding: '5px 12px', background: 'rgba(249, 115, 22, 0.1)', color: 'var(--accent)', borderRadius: '20px', fontWeight: '700' }}>
                                🛡️ {user?.role || 'Service Staff'}
                            </span>
                            <span style={{ fontSize: '0.8rem', padding: '5px 12px', background: 'var(--secondary-bg)', color: 'var(--text-muted)', borderRadius: '20px', fontWeight: '700' }}>
                                🕒 Shift: 08:00 AM - 04:00 PM
                            </span>
                        </div>
                    </div>
                    <div style={{ textAlign: window.innerWidth < 768 ? 'center' : 'right' }}>
                        <div style={{ marginBottom: '10px' }}>
                            <span style={{
                                fontSize: '0.7rem',
                                fontWeight: '800',
                                color: statusColors[status],
                                background: `${statusColors[status]}15`,
                                padding: '6px 15px',
                                borderRadius: '15px',
                                border: `1px solid ${statusColors[status]}40`
                            }}>
                                ● {status}
                            </span>
                        </div>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            style={{ background: 'var(--secondary-bg)', color: 'var(--text-main)', border: '1px solid var(--border)', padding: '5px 10px', borderRadius: '10px', cursor: 'pointer', outline: 'none' }}
                        >
                            <option value="Available">Available</option>
                            <option value="Busy">Busy</option>
                            <option value="On Break">On Break</option>
                            <option value="Offline">Offline</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="dashboard-grid">
                {/* Main Content Area */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                    {/* 2. Attendance & Overview Combined */}
                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: window.innerWidth < 1024 ? (window.innerWidth < 640 ? '1fr' : '1fr 1fr') : '1.2fr 1fr 1fr', 
                        gap: '1.2rem' 
                    }}>
                        {/* Attendance Card - Shrunken */}
                        <div className="stat-card" style={{ 
                            display: 'flex', 
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'center', 
                            borderLeft: `4px solid ${checkedIn ? '#10b981' : 'var(--accent)'}`,
                            padding: '1.2rem',
                            gap: '12px',
                            textAlign: 'center'
                        }}>
                            <div>
                                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '800', marginBottom: '4px' }}>Shift Status</p>
                                <h2 style={{ fontSize: '1.1rem', fontWeight: '900', marginBottom: checkedIn ? '2px' : '0' }}>{checkedIn ? 'Active' : 'Clocked Out'}</h2>
                                {checkedIn && <p style={{ fontSize: '1rem', color: 'var(--accent)', fontWeight: '900', letterSpacing: '1px' }}>{formatTime(workingSeconds)}</p>}
                            </div>
                            <div style={{ width: '100%' }}>
                                {!checkedIn && !shiftDocId ? (
                                    <button onClick={handleCheckIn} className="btn-primary" style={{ marginTop: 0, padding: '8px 15px', fontSize: '0.8rem', width: '100%', borderRadius: '8px' }}>CHECK IN</button>
                                ) : checkedIn ? (
                                    <button onClick={handleCheckOut} style={{ background: '#ef444415', color: '#ef4444', border: '1px solid #ef444430', padding: '8px 15px', fontSize: '0.8rem', borderRadius: '8px', fontWeight: '800', cursor: 'pointer', width: '100%' }}>EXIT SHIFT</button>
                                ) : (
                                    <span style={{ color: '#10b981', fontWeight: '900', fontSize: '0.8rem' }}>✅ SHIFT OVER</span>
                                )}
                            </div>
                        </div>

                        {/* Performance & Completed - Side by Side */}
                        <div className="stat-card" style={{ borderTop: '4px solid #8b5cf6', textAlign: 'center', padding: '1.2rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '800', marginBottom: '4px' }}>Performance</p>
                            <h2 style={{ fontSize: '1.8rem', fontWeight: '900', color: '#8b5cf6' }}>{stats.performance}%</h2>
                        </div>
                        <div className="stat-card" style={{ borderTop: '4px solid #10b981', textAlign: 'center', padding: '1.2rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '800', marginBottom: '4px' }}>Done Today</p>
                            <h2 style={{ fontSize: '1.8rem', fontWeight: '900', color: '#10b981' }}>{stats.completed}</h2>
                        </div>
                    </div>

                    {/* 3. Overview Task Cards */}
                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: window.innerWidth < 600 ? '1fr' : '1fr 1fr', 
                        gap: '1.5rem' 
                    }}>
                        <div className="stat-card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                            <div style={{ fontSize: '2rem', background: 'rgba(245, 158, 11, 0.1)', padding: '12px', borderRadius: '15px' }}>⚡</div>
                            <div>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Active Tasks</p>
                                <h2 style={{ fontSize: '1.5rem', fontWeight: '900' }}>{stats.active < 10 ? `0${stats.active}` : stats.active}</h2>
                            </div>
                        </div>
                        <div className="stat-card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                            <div style={{ fontSize: '2rem', background: 'rgba(59, 130, 246, 0.1)', padding: '12px', borderRadius: '15px' }}>⏳</div>
                            <div>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Pending Tasks</p>
                                <h2 style={{ fontSize: '1.5rem', fontWeight: '900' }}>{stats.pending < 10 ? `0${stats.pending}` : stats.pending}</h2>
                            </div>
                        </div>
                    </div>

                    {/* 4. CURRENT FOCUS TASK SECTION */}
                    <div className="stat-card" style={{ borderLeft: '4px solid var(--accent)', padding: '1.8rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--accent)', textTransform: 'uppercase' }}>🔥 Current Focus Task</h3>
                            {focusTask && (
                                <span style={{ 
                                    fontSize: '0.7rem', 
                                    background: focusTask.status === 'in-progress' ? '#f59e0b15' : 'rgba(255,255,255,0.05)',
                                    color: focusTask.status === 'in-progress' ? '#f59e0b' : 'var(--text-muted)',
                                    padding: '4px 10px',
                                    borderRadius: '10px',
                                    fontWeight: '900'
                                }}>
                                    {focusTask.status.toUpperCase()}
                                </span>
                            )}
                        </div>
                        
                        {focusTask ? (
                            <div style={{ display: 'flex', flexDirection: window.innerWidth < 640 ? 'column' : 'row', justifyContent: 'space-between', gap: '20px' }}>
                                <div style={{ flex: 1 }}>
                                    <h4 style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '8px' }}>{focusTask.title}</h4>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>{focusTask.description}</p>
                                    <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
                                        <span style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--accent)' }}>⏱ {focusTask.estimatedTime}</span>
                                        <span style={{ fontSize: '0.7rem', fontWeight: '700', color: focusTask.priority === 'High' ? '#ef4444' : '#3b82f6' }}>🚩 {focusTask.priority}</span>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <button 
                                        onClick={() => completeTask(focusTask.id)}
                                        disabled={!checkedIn}
                                        style={{ 
                                            backgroundColor: checkedIn ? '#10b981' : 'var(--border)',
                                            color: 'white',
                                            border: 'none',
                                            padding: '12px 25px',
                                            borderRadius: '12px',
                                            fontWeight: '900',
                                            cursor: checkedIn ? 'pointer' : 'not-allowed',
                                            transition: '0.2s',
                                            width: window.innerWidth < 640 ? '100%' : 'auto',
                                            opacity: checkedIn ? 1 : 0.5
                                        }}
                                    >
                                        ✅ COMPLETED
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <p style={{ textAlign: 'center', opacity: 0.5, fontSize: '0.85rem', padding: '10px' }}>🎉 Great work! You have no pending tasks left for today.</p>
                        )}
                    </div>

                    {/* 5. Weekly Snapshot Section */}
                    <div className="stat-card" style={{ padding: '2rem' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '1.5rem' }}>📅 Weekly Snapshot</h3>
                        <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: window.innerWidth < 768 ? '1fr' : 'repeat(3, 1fr)', 
                            gap: '1.5rem' 
                        }}>
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                    <span style={{ color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem' }}>Task Completion</span>
                                    <span style={{ color: 'var(--accent)', fontWeight: '800', fontSize: '0.85rem' }}>{stats.completion}%</span>
                                </div>
                                <div style={{ height: '8px', background: 'var(--primary-bg)', borderRadius: '10px', overflow: 'hidden' }}>
                                    <div style={{ width: `${stats.completion}%`, height: '100%', background: 'var(--accent)', borderRadius: '10px' }}></div>
                                </div>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '10px' }}>Attendance: 06 / 07</p>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '5px' }}>Hours Worked</p>
                                <h2 style={{ fontSize: '1.8rem', fontWeight: '900', color: 'var(--accent)' }}>42.5 hrs</h2>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                    {/* 6. Quick Actions Section */}
                    <div className="stat-card" style={{ padding: '2rem' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--accent)', textTransform: 'uppercase', marginBottom: '1.5rem' }}>⚡ Quick Actions</h3>
                        <div style={{ display: 'grid', gap: '10px' }}>
                            {[
                                { label: 'View Tasks', icon: '✅', path: '/tasks' },
                                { label: 'Open Chat', icon: '💬', path: '/community' },
                                { label: 'Request Leave', icon: '🗓️', path: '/profile' },
                                { label: 'Update Profile', icon: '👤', path: '/profile' }
                            ].map((action, i) => (
                                <button
                                    key={i}
                                    onClick={() => action.path ? navigate(action.path) : action.action()}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '15px',
                                        width: '100%',
                                        padding: '12px 20px',
                                        background: 'var(--primary-bg)',
                                        border: '1px solid var(--border)',
                                        borderRadius: '12px',
                                        color: 'var(--text-main)',
                                        fontWeight: '700',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease'
                                    }} onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'} onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                                    <span>{action.icon}</span>
                                    {action.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 7. Notifications Preview */}
                    <div className="stat-card" style={{ padding: '2rem' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--accent)', textTransform: 'uppercase', marginBottom: '1.5rem' }}>🔔 Notifications</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            {loadingNotifs ? (
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Syncing alerts...</p>
                            ) : notifications.length > 0 ? (
                                notifications.map((notif) => (
                                    <div key={notif.id} style={{ paddingBottom: '15px', borderBottom: '1px solid var(--border)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                            <h4 style={{ fontSize: '0.9rem', fontWeight: '800' }}>{notif.title}</h4>
                                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{notif.time}</span>
                                        </div>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>{notif.message}</p>
                                    </div>
                                ))
                            ) : (
                                <div style={{ padding: '10px 0', textAlign: 'left', opacity: 0.5 }}>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No recent alerts.</p>
                                </div>
                            )}
                        </div>
                        <button
                            onClick={() => navigate('/notifications')}
                            style={{ width: '100%', background: 'none', border: 'none', color: 'var(--accent)', fontWeight: '700', marginTop: '1rem', cursor: 'pointer' }}
                        >
                            VIEW ALL
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home;
