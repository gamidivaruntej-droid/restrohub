import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, updateDoc, doc, addDoc, getDocs, serverTimestamp } from 'firebase/firestore';

const Settings = ({ user, theme, toggleTheme }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [activeTab, setActiveTab] = useState('account');

    // Mock states for settings (loaded from localStorage where applicable)
    const [settings, setSettings] = useState({
        email: user?.email || 'staff@restrohub.com',
        phone: '+1 (555) 012-3456',
        animations: localStorage.getItem('restro_animations') !== 'false',
        chatNotifications: localStorage.getItem('restro_chat_notify') !== 'false',
        taskAlerts: localStorage.getItem('restro_tasks_notify') !== 'false',
        sound: localStorage.getItem('restro_sound_notify') !== 'false',
        showOnline: true,
        privateMessaging: 'everyone'
    });

    const [pendingLeaves, setPendingLeaves] = useState([]);



    useEffect(() => {
        if (user?.role !== 'Manager') return;
        const q = query(collection(db, 'leaves'), where('status', '==', 'pending'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setPendingLeaves(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        return () => unsubscribe();
    }, [user?.role]);



    const handleToggle = (key) => {
        const newValue = !settings[key];
        setSettings(prev => ({ ...prev, [key]: newValue }));

        // Persistence & Global Effects
        if (key === 'animations') {
            localStorage.setItem('restro_animations', newValue);
            if (!newValue) document.body.classList.add('no-animations');
            else document.body.classList.remove('no-animations');
        } else if (key === 'chatNotifications') {
            localStorage.setItem('restro_chat_notify', newValue);
        } else if (key === 'taskAlerts') {
            localStorage.setItem('restro_tasks_notify', newValue);
        } else if (key === 'sound') {
            localStorage.setItem('restro_sound_notify', newValue);
        }
    };

    const categories = [
        { id: 'account', name: '👤 Account', show: true },
        { id: 'appearance', name: '🎨 Appearance', show: true },
        { id: 'notifications', name: '🔔 Notifications', show: true },
        { id: 'privacy', name: '🔒 Privacy', show: true },
        { id: 'management', name: '🛡️ Management', show: user?.role === 'Manager' }
    ].filter(c => c.show);

    const handleApproveLeave = async (leave) => {
        try {
            const todayStr = new Date().toLocaleDateString('en-CA');
            
            // 1. Find all users of the same role
            const snapshot = await getDocs(query(collection(db, 'users'), where('role', '==', leave.role)));
            let candidates = snapshot.docs
                .map(d => ({ uid: d.id, ...d.data() }))
                .filter(u => u.uid !== leave.userId);

            // 2. Filter out anyone who has an approved leave for today
            const leaveSnapshot = await getDocs(query(
                collection(db, 'leaves'), 
                where('status', '==', 'approved'),
                where('date', '==', todayStr)
            ));
            const IDsOnLeave = leaveSnapshot.docs.map(d => d.data().userId);
            candidates = candidates.filter(u => !IDsOnLeave.includes(u.uid));

            if (candidates.length === 0) {
                alert(`CRITICAL: No other ${leave.role}s are available today to take these tasks. Please reassign manually.`);
                return;
            }

            // 3. Get absent worker's pending tasks
            const tSnapshot = await getDocs(query(collection(db, 'tasks'), where('userId', '==', leave.userId)));
            const pendingTasks = tSnapshot.docs.filter(d => d.data().status !== 'completed');

            if (pendingTasks.length > 0) {
                // 4. Distribute Tasks Round-Robin
                const workerAssignments = {}; // Track how many tasks each worker gets for the notification

                for (let i = 0; i < pendingTasks.length; i++) {
                    const taskDoc = pendingTasks[i];
                    const replacement = candidates[i % candidates.length];
                    
                    await updateDoc(taskDoc.ref, {
                        userId: replacement.uid,
                        isAdditional: true,
                        assignedBy: `Manager (${user.fullName || user.name || 'Admin'})`,
                        notes: `⚠️ TEAM COVERAGE: Reassigned from ${leave.userName} | Original Notes: ${taskDoc.data().notes || 'None'}`,
                        updatedAt: serverTimestamp()
                    });

                    workerAssignments[replacement.uid] = (workerAssignments[replacement.uid] || 0) + 1;
                }

                // 5. Notify all recipients
                for (const workerId in workerAssignments) {
                    await addDoc(collection(db, 'notifications'), {
                        userId: workerId,
                        type: 'Alert',
                        title: '📂 Team Coverage Assigned',
                        message: `A colleague is on leave. You've been assigned ${workerAssignments[workerId]} additional tasks for today's shift.`,
                        time: 'Just now',
                        icon: '📋',
                        color: '#3b82f6',
                        createdAt: serverTimestamp()
                    });
                }
            }

            // 6. Update Leave Status
            await updateDoc(doc(db, 'leaves', leave.id), { status: 'approved' });
            
            // 7. Notify the Requester
            await addDoc(collection(db, 'notifications'), {
                userId: leave.userId,
                type: 'Success',
                title: '✅ Leave Approved',
                message: `Your leave for today has been approved. Your ${pendingTasks.length} tasks have been distributed among the active team.`,
                time: 'Just now',
                icon: '🎉',
                color: '#10b981',
                createdAt: serverTimestamp()
            });

            alert(`Success! Leave approved. ${pendingTasks.length} tasks distributed among ${candidates.length} active workers.`);
        } catch (error) {
            console.error("Error approving leave:", error);
            alert("Execution error in redistribution logic. Check Firestore connectivity.");
        }
    };

    const handleRejectLeave = async (leaveId) => {
        try {
            await updateDoc(doc(db, 'leaves', leaveId), { status: 'rejected' });
        } catch (error) {
            console.error("Error rejecting leave:", error);
        }
    };

    const handlePlatformReset = async () => {
        if (!window.confirm("CRITICAL ACTION: This will delete ALL tasks and leaves in the system. Continue?")) return;
        
        try {
            alert("Platform reset command acknowledged! Clearing database...");
            
            const taskDocs = await getDocs(collection(db, 'tasks'));
            const leaveDocs = await getDocs(collection(db, 'leaves'));
            const notifDocs = await getDocs(collection(db, 'notifications'));
            
            const { writeBatch } = await import('firebase/firestore'); // Ensure writeBatch is available
            const batch = writeBatch(db);
            
            taskDocs.forEach(d => batch.delete(d.ref));
            leaveDocs.forEach(d => batch.delete(d.ref));
            notifDocs.forEach(d => batch.delete(d.ref));
            
            await batch.commit();
            alert("Database Reset Complete. Web app is now at initial state.");
            window.location.reload();
        } catch (error) {
            console.error("Reset error:", error);
            alert("Error resetting database. Permission denied or network issue.");
        }
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'account': {
                return (
                    <div style={{ animation: 'hero-entry 0.4s ease' }}>
                        <h3 style={{ marginBottom: '1.5rem', fontWeight: '800' }}>Account Settings</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth < 600 ? '1fr' : '1fr 1fr', gap: '1.5rem' }}>
                            <div className="form-group">
                                <label>Email Address</label>
                                <input type="email" value={settings.email} className="form-control" readOnly style={{ opacity: 0.7 }} />
                            </div>
                            <div className="form-group">
                                <label>Phone Number</label>
                                <input type="tel" value={settings.phone} className="form-control" readOnly style={{ opacity: 0.7 }} />
                            </div>
                        </div>
                        <div style={{ marginTop: '2rem', display: 'flex', flexDirection: window.innerWidth < 480 ? 'column' : 'row', gap: '15px' }}>
                            <button onClick={() => navigate('/profile')} className="btn-primary" style={{ width: '100%', marginTop: 0 }}>Update Details</button>
                            <button onClick={() => alert('Reset link sent.')} className="btn-primary" style={{ width: '100%', marginTop: 0, backgroundColor: 'transparent', border: '1px solid var(--accent)', color: 'var(--accent)' }}>Change Password</button>
                        </div>
                    </div>
                );
            }
            case 'appearance': {
                return (
                    <div style={{ animation: 'hero-entry 0.4s ease' }}>
                        <h3 style={{ marginBottom: '1.5rem', fontWeight: '800' }}>Appearance Settings</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <div className="stat-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.2rem 1.5rem' }}>
                                <div>
                                    <div style={{ fontWeight: '700' }}>Dark Mode</div>
                                    <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>Midnight Slate theme</div>
                                </div>
                                <input type="checkbox" checked={theme === 'dark'} onChange={toggleTheme} style={{ width: '20px', height: '20px', accentColor: 'var(--accent)' }} />
                            </div>
                            <div className="stat-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.2rem 1.5rem' }}>
                                <div>
                                    <div style={{ fontWeight: '700' }}>Animations</div>
                                    <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>Smooth transitions</div>
                                </div>
                                <input type="checkbox" checked={settings.animations} onChange={() => handleToggle('animations')} style={{ width: '20px', height: '20px', accentColor: 'var(--accent)' }} />
                            </div>
                        </div>
                    </div>
                );
            }
            case 'notifications': {
                return (
                    <div style={{ animation: 'hero-entry 0.4s ease' }}>
                        <h3 style={{ marginBottom: '1.5rem', fontWeight: '800' }}>Notifications</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {['chatNotifications', 'taskAlerts', 'sound'].map(key => (
                                <div key={key} className="stat-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.2rem 1.5rem' }}>
                                    <span style={{ fontWeight: '700', textTransform: 'capitalize' }}>{key.replace(/([A-Z])/g, ' $1')}</span>
                                    <input type="checkbox" checked={settings[key]} onChange={() => handleToggle(key)} style={{ width: '20px', height: '20px', accentColor: 'var(--accent)' }} />
                                </div>
                            ))}
                        </div>
                    </div>
                );
            }
            case 'privacy': {
                return (
                    <div style={{ animation: 'hero-entry 0.4s ease' }}>
                        <h3 style={{ marginBottom: '1.5rem', fontWeight: '800' }}>Privacy</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <div className="stat-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.2rem 1.5rem' }}>
                                <div>
                                    <div style={{ fontWeight: '700' }}>Online Status</div>
                                    <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>Visible in Chat</div>
                                </div>
                                <input type="checkbox" checked={settings.showOnline} onChange={() => handleToggle('showOnline')} style={{ width: '20px', height: '20px', accentColor: 'var(--accent)' }} />
                            </div>
                            <div className="form-group">
                                <label>Messaging Privacy</label>
                                <select className="form-control" value={settings.privateMessaging} onChange={(e) => setSettings({ ...settings, privateMessaging: e.target.value })}>
                                    <option value="everyone">Everyone</option>
                                    <option value="managers">Managers Only</option>
                                </select>
                            </div>
                        </div>
                    </div>
                );
            }
            case 'management': {
                return (
                    <div style={{ animation: 'hero-entry 0.4s ease' }}>
                        <h3 style={{ marginBottom: '1.5rem', fontWeight: '800', color: '#ef4444' }}>🛡️ Management Tools</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            {/* Leave Section */}
                            <div className="stat-card" style={{ borderLeft: '4px solid #f59e0b' }}>
                                <h4 style={{ marginBottom: '15px', color: '#f59e0b' }}>📅 Leave Requests ({pendingLeaves.length})</h4>
                                {pendingLeaves.length === 0 ? <p style={{ opacity: 0.6, fontSize: '0.9rem' }}>No pending requests.</p> : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        {pendingLeaves.map(leave => (
                                            <div key={leave.id} className="stat-card" style={{ padding: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div style={{ fontSize: '0.85rem' }}>
                                                    <strong>{leave.userName}</strong> ({leave.role})
                                                </div>
                                                <div style={{ display: 'flex', gap: '5px' }}>
                                                    <button onClick={() => handleApproveLeave(leave)} style={{ backgroundColor: '#10b981', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '5px', fontSize: '0.7rem' }}>OK</button>
                                                    <button onClick={() => handleRejectLeave(leave.id)} style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '5px', fontSize: '0.7rem' }}>X</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            {/* Reset Section */}
                            <div className="stat-card" style={{ borderLeft: '4px solid #ef4444' }}>
                                <h4 style={{ color: '#ef4444', marginBottom: '10px' }}>⚠️ Full Reset</h4>
                                <p style={{ fontSize: '0.85rem', opacity: 0.6, marginBottom: '1rem' }}>Clear all tasks, leaves, and notifications system-wide.</p>
                                <button onClick={handlePlatformReset} className="btn-primary" style={{ backgroundColor: '#ef4444', marginTop: 0, padding: '10px 20px', fontSize: '0.8rem' }}>RESET WEBSITE NOW</button>
                            </div>
                        </div>
                    </div>
                );
            }
            default: return null;
        }
    };

    return (
        <div className="page-container" style={{ maxWidth: '1000px' }}>
            <h1 className="responsive-h1" style={{ textAlign: 'center', marginBottom: '3rem', fontSize: '3rem', fontWeight: '800' }}>Settings</h1>

            <div className="settings-layout" style={{
                display: 'flex',
                flexDirection: window.innerWidth < 768 ? 'column' : 'row',
                gap: '30px',
                width: '100%',
                alignItems: 'start'
            }}>
                {/* Sidebar / Top-bar Tabs */}
                <div style={{
                    display: 'flex',
                    flexDirection: window.innerWidth < 768 ? 'row' : 'column',
                    gap: '10px',
                    backgroundColor: 'var(--card-bg)',
                    padding: '15px',
                    borderRadius: '24px',
                    border: '1px solid var(--border)',
                    boxShadow: 'var(--shadow)',
                    width: window.innerWidth < 768 ? '100%' : '250px',
                    overflowX: window.innerWidth < 768 ? 'auto' : 'visible',
                    whiteSpace: 'nowrap',
                    sticky: 'top',
                    top: '80px',
                    zIndex: 5
                }} className="hide-scrollbar">
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveTab(cat.id)}
                            style={{
                                padding: '12px 20px',
                                borderRadius: '12px',
                                border: 'none',
                                backgroundColor: activeTab === cat.id ? 'var(--accent)' : 'transparent',
                                color: activeTab === cat.id ? 'white' : 'var(--text-main)',
                                textAlign: 'left',
                                fontWeight: '700',
                                fontSize: '0.9rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                flexShrink: 0
                            }}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="stat-card" style={{ minHeight: '500px', flex: 1, width: '100%', overflow: 'hidden' }}>
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

export default Settings;
