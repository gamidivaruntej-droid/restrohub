import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import {
    collection,
    query,
    orderBy,
    onSnapshot,
    addDoc,
    serverTimestamp,
    deleteDoc,
    doc,
    updateDoc,
    where,
    limit,
    getDocs,
    writeBatch
} from 'firebase/firestore';

const ROLE_THEMES = {
    'Manager': { icon: '👑', color: '#a855f7', label: 'MANAGER', bg: 'rgba(168, 85, 247, 0.15)' },
    'Chef': { icon: '👨‍🍳', color: '#f43f5e', label: 'CHEF', bg: 'rgba(244, 63, 94, 0.15)' },
    'Waiter': { icon: '🍽️', color: '#3b82f6', label: 'WAITER', bg: 'rgba(59, 130, 246, 0.15)' },
    'Cleaner': { icon: '🧹', color: '#10b981', label: 'CLEANER', bg: 'rgba(16, 185, 129, 0.15)' },
    'Staff': { icon: '👤', color: '#6b7280', label: 'STAFF', bg: 'rgba(107, 114, 128, 0.15)' }
};

const Chat = ({ user }) => {
    const [messages, setMessages] = useState([]);
    const [activeStaff, setActiveStaff] = useState([]);
    const [input, setInput] = useState('');
    const [replyTo, setReplyTo] = useState(null);
    const [isImportantNext, setIsImportantNext] = useState(false);

    // Advanced Features States
    const [editingMessage, setEditingMessage] = useState(null); 
    const [lastDeleteTime, setLastDeleteTime] = useState(0);
    const [cooldownRemaining, setCooldownRemaining] = useState(0);
    const [chatAccent] = useState('#f97316');
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
    const [showMobileStaff, setShowMobileStaff] = useState(false);

    const chatEndRef = useRef(null);

    // Watch for window resize
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Sync Messages
    useEffect(() => {
        const q = query(
            collection(db, 'messages'),
            orderBy('createdAt', 'asc'),
            limit(100)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                time: doc.data().createdAt?.toDate()?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || '...'
            }));
            setMessages(msgs);
        });

        return () => unsubscribe();
    }, []);

    // Cooldown Timer Logic
    useEffect(() => {
        let interval;
        if (cooldownRemaining > 0) {
            interval = setInterval(() => {
                setCooldownRemaining(prev => Math.max(0, prev - 1));
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [cooldownRemaining]);

    // Sync Online Staff
    useEffect(() => {
        const q = query(collection(db, 'users'), where('status', '==', 'online'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const now = Date.now();
            const staff = [];

            snapshot.docs.forEach(doc => {
                const data = doc.data();
                // Check if lastSeen is within the last 5 minutes (300,000 ms)
                // If lastSeen doesn't exist, we fallback to just the online status.
                let isTrulyOnline = true;
                if (data.lastSeen) {
                    const lastSeenTime = data.lastSeen.toDate().getTime();
                    if (now - lastSeenTime > 300000) {
                        isTrulyOnline = false;
                    }
                }

                if (isTrulyOnline) {
                    staff.push({
                        name: data.fullName || data.name || 'Staff',
                        role: data.role,
                        uid: doc.id
                    });
                }
            });

            setActiveStaff(staff);
        });

        return () => unsubscribe();
    }, []);

    const clearAllMessages = async () => {
        if (user?.role !== 'Manager') {
            alert("Only Managers can clear the chat history.");
            return;
        }
        if (window.confirm("⚠️ DANGER: Are you sure you want to clear the entire chat history? This cannot be undone.")) {
            try {
                const q = query(collection(db, 'messages'));
                const snapshot = await getDocs(q);
                const batch = writeBatch(db);
                snapshot.docs.forEach(d => {
                    batch.delete(doc(db, 'messages', d.id));
                });
                await batch.commit();
            } catch (err) {
                console.error("Clear chat error:", err);
                alert("Failed to clear chat.");
            }
        }
    };

    const handleSend = async (e, textOverride = null) => {
        if (e) e.preventDefault();
        const finalMsg = textOverride || input;
        if (!finalMsg.trim()) return;

        const urlPattern = /(https?:\/\/|www\.)[^\s]+/g;
        if (urlPattern.test(finalMsg)) {
            alert("❌ external links are not allowed for security reasons.");
            return;
        }

        try {
            const msgData = {
                user: user?.fullName || user?.name || 'Staff Member',
                role: user?.role || 'Staff',
                userId: user?.uid,
                text: finalMsg,
                createdAt: serverTimestamp(),
                isImportant: isImportantNext,
                isPinned: false,
                replyingTo: replyTo ? { user: replyTo.user, text: replyTo.text } : null
            };

            await addDoc(collection(db, 'messages'), msgData);

            // Global Notification logic
            const staffDocs = await getDocs(collection(db, 'users'));
            const roleTheme = ROLE_THEMES[user?.role] || ROLE_THEMES['Staff'];

            for (const sd of staffDocs.docs) {
                if (sd.id !== user.uid) {
                    await addDoc(collection(db, 'notifications'), {
                        userId: sd.id,
                        type: isImportantNext ? 'Alert' : 'Message',
                        title: isImportantNext ? '🚨 IMPORTANT MESSAGE' : `💬 ${user.fullName || user.name}`,
                        message: finalMsg.substring(0, 60),
                        time: 'Just now',
                        icon: isImportantNext ? '🚨' : '💬',
                        color: isImportantNext ? '#ef4444' : roleTheme.color,
                        createdAt: serverTimestamp()
                    });
                }
            }

            setInput('');
            setReplyTo(null);
            setIsImportantNext(false);
        } catch (err) {
            console.error("Send message error:", err);
            alert("Failed to send message.");
        }
    };

    const handleEdit = async (e) => {
        if (e) e.preventDefault();
        if (!editingMessage || !editingMessage.text.trim()) return;

        try {
            await updateDoc(doc(db, 'messages', editingMessage.id), {
                text: editingMessage.text,
                editedAt: serverTimestamp(),
                isEdited: true
            });
            setEditingMessage(null);
        } catch (err) {
            console.error("Edit msg error:", err);
            alert("Failed to edit message.");
        }
    };

    const deleteMessage = async (id) => {
        const now = Date.now();
        const secondsSinceLast = (now - lastDeleteTime) / 1000;

        if (secondsSinceLast < 30) {
            const remaining = Math.ceil(30 - secondsSinceLast);
            setCooldownRemaining(remaining);
            alert(`⚠️ Cooldown: Please wait ${remaining}s before deleting another message.`);
            return;
        }

        if (window.confirm("Delete this message?")) {
            try {
                await deleteDoc(doc(db, 'messages', id));
                setLastDeleteTime(Date.now());
            } catch (err) {
                console.error("Delete msg error:", err);
                alert("Permission denied or network error.");
            }
        }
    };

    const togglePin = async (id, currentStatus) => {
        try {
            await updateDoc(doc(db, 'messages', id), { isPinned: !currentStatus });
        } catch (err) {
            console.error("Toggle pin error:", err);
        }
    };

    const renderText = (text) => {
        return text.split(/(@\w+)/g).map((part, i) => {
            if (part.startsWith('@')) {
                return <span key={i} style={{ color: 'var(--accent)', fontWeight: '800', backgroundColor: 'var(--accent)22', padding: '2px 4px', borderRadius: '4px' }}>{part}</span>;
            }
            return part;
        });
    };

    const quickReplies = ["On it! 🏃", "Copy that 🫡", "Emergency! 🚨", "Need help 🤝", "Done ✅"];

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const pinnedMessages = messages.filter(m => m.isPinned);

    return (
        <div style={{
            maxWidth: '1600px',
            width: '100%',
            margin: '0 auto',
            padding: isMobile ? '5px 8px' : '5px 20px',
            height: 'calc(100vh - 85px)', 
            overflow: 'hidden', 
            display: 'flex',
            flexDirection: 'column',
            gap: isMobile ? '8px' : '12px',
            color: '#f9fafb'
        }}>
            <style>
                {`
                    .chat-messages-container::-webkit-scrollbar { width: 6px; }
                    .chat-messages-container::-webkit-scrollbar-track { background: transparent; }
                    .chat-messages-container::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
                    .chat-messages-container::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.2); }
                `}
            </style>

            <div style={{ textAlign: 'center', marginTop: isMobile ? '0' : '-5px' }}>
                <h1 style={{
                    fontSize: isMobile ? '1.8rem' : '2.8rem', 
                    fontWeight: '900',
                    margin: '0',
                    background: 'linear-gradient(to bottom, #ffffff, #94a3b8)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    letterSpacing: '-1px'
                }}>
                    Staff Community
                </h1>
            </div>

            <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                backgroundColor: 'rgba(17, 24, 39, 0.6)',
                backdropFilter: 'blur(20px)',
                borderRadius: isMobile ? '24px' : '32px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                overflow: 'hidden',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}>
                {/* Mobile Staff Strip (Toggle) */}
                {isMobile && (
                    <div 
                        onClick={() => setShowMobileStaff(!showMobileStaff)}
                        style={{
                            padding: '12px 16px',
                            backgroundColor: 'rgba(31, 41, 55, 0.6)',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            cursor: 'pointer'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: '800' }}>
                            <span style={{ color: '#10b981' }}>●</span> {activeStaff.length} Members Online
                        </div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--accent)', fontWeight: '900' }}>
                            {showMobileStaff ? 'CLOSE' : 'VIEW TEAM'}
                        </span>
                    </div>
                )}

                {/* Staff Sidebar */}
                {(!isMobile || showMobileStaff) && (
                    <div style={{
                        width: isMobile ? '100%' : '320px',
                        maxHeight: isMobile ? '250px' : 'none',
                        backgroundColor: isMobile ? 'rgba(31, 41, 55, 0.95)' : 'rgba(31, 41, 55, 0.4)',
                        borderRight: isMobile ? 'none' : '1px solid rgba(255, 255, 255, 0.05)',
                        borderBottom: isMobile ? '1px solid rgba(255, 255, 255, 0.05)' : 'none',
                        display: 'flex',
                        flexDirection: 'column',
                        zIndex: 10
                    }}>
                        {!isMobile && (
                            <div style={{ padding: '24px', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span style={{ color: '#10b981' }}>●</span> Online Team
                                </h3>
                            </div>
                        )}
                        <div className="chat-messages-container" style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '8px' : '16px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr', gap: isMobile ? '8px' : '4px' }}>
                                {activeStaff.map((staff) => (
                                    <div key={staff.uid} style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        padding: isMobile ? '8px' : '12px',
                                        borderRadius: '16px',
                                        backgroundColor: isMobile ? 'rgba(255,255,255,0.03)' : 'transparent'
                                    }}>
                                        <div style={{
                                            width: isMobile ? '36px' : '44px',
                                            height: isMobile ? '36px' : '44px',
                                            borderRadius: '12px',
                                            backgroundColor: (ROLE_THEMES[staff.role] || ROLE_THEMES['Staff']).color + '22',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: isMobile ? '1rem' : '1.2rem',
                                            border: `1px solid ${(ROLE_THEMES[staff.role] || ROLE_THEMES['Staff']).color}44`
                                        }}>
                                            {(ROLE_THEMES[staff.role] || ROLE_THEMES['Staff']).icon}
                                        </div>
                                        <div style={{ overflow: 'hidden' }}>
                                            <div style={{ fontWeight: '700', fontSize: '0.85rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{staff.name}</div>
                                            <div style={{ fontSize: '0.65rem', color: (ROLE_THEMES[staff.role] || ROLE_THEMES['Staff']).color, fontWeight: '800' }}>
                                                {(ROLE_THEMES[staff.role] || ROLE_THEMES['Staff']).label}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        {user?.role === 'Manager' && !isMobile && (
                            <div style={{ padding: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                                <button onClick={clearAllMessages} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #ef444444', backgroundColor: '#ef444411', color: '#f87171', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer' }}>
                                    🗑️ Clear All History
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Main Chat Area */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', width: '100%', overflow: 'hidden' }}>
                    <div className="chat-messages-container" style={{
                        flex: 1,
                        padding: isMobile ? '16px' : '32px',
                        overflowY: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: isMobile ? '16px' : '24px'
                    }}>
                        {pinnedMessages.length > 0 && (
                            <div style={{ marginBottom: '20px', padding: '16px', backgroundColor: 'rgba(255, 255, 255, 0.03)', borderRadius: '20px' }}>
                                <div style={{ fontSize: '0.75rem', fontWeight: '900', color: '#94a3b8', marginBottom: '12px' }}>📌 PINNED</div>
                                {pinnedMessages.map(pm => (
                                    <div key={`pin-${pm.id}`} style={{ fontSize: '0.85rem', marginBottom: '4px' }}>
                                        <strong style={{ color: '#f59e0b' }}>@{pm.user}:</strong> {pm.text}
                                    </div>
                                ))}
                            </div>
                        )}

                        {messages.map((msg) => {
                            const isSelf = msg.userId === user?.uid;
                            const roleTheme = ROLE_THEMES[msg.role] || ROLE_THEMES['Staff'];

                            return (
                                <div key={msg.id} style={{
                                    alignItems: isSelf ? 'flex-end' : 'flex-start',
                                    alignSelf: isSelf ? 'flex-end' : 'flex-start',
                                    maxWidth: isMobile ? '94%' : '80%'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '0.75rem' }}>
                                        {!isSelf && <span style={{ fontWeight: '800', color: roleTheme.color }}>{roleTheme.icon} {msg.user}</span>}
                                        {isSelf && <span style={{ color: roleTheme.color, fontWeight: '800' }}>{roleTheme.icon} You</span>}
                                        <span style={{ color: '#64748b' }}>{msg.time}</span>
                                    </div>

                                    {msg.replyingTo && (
                                        <div style={{ fontSize: '0.8rem', padding: '8px 16px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '16px 16px 0 0', borderLeft: `4px solid ${roleTheme.color}`, marginBottom: '-4px', opacity: 0.7, width: 'calc(100% - 20px)', color: '#94a3b8' }}>
                                            <strong>@{msg.replyingTo.user}:</strong> {msg.replyingTo.text}
                                        </div>
                                    )}

                                    <div style={{
                                        padding: isMobile ? '12px 16px' : '16px 24px',
                                        borderRadius: isSelf ? '24px 24px 4px 24px' : '24px 24px 24px 4px',
                                        backgroundColor: msg.isImportant ? 'rgba(239, 68, 68, 0.2)' : isSelf ? chatAccent : roleTheme.bg,
                                        color: '#f8fafc',
                                        border: msg.isImportant ? '2px solid #ef4444' : `1px solid ${roleTheme.color}33`,
                                        borderLeft: !isSelf ? (isMobile ? `3px solid ${roleTheme.color}` : `5px solid ${roleTheme.color}`) : `1px solid ${roleTheme.color}33`,
                                        boxShadow: isSelf ? `0 10px 25px ${chatAccent}20` : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                        backdropFilter: 'blur(10px)'
                                    }}>
                                        <div style={{ fontSize: '0.65rem', fontWeight: '900', color: roleTheme.color, marginBottom: '6px', letterSpacing: '1px', display: 'flex', justifyContent: 'space-between' }}>
                                            <span>{roleTheme.label}</span>
                                            {msg.isImportant && <span style={{ color: '#ef4444' }}>🚨 IMPORTANT</span>}
                                        </div>
                                        <div style={{ fontSize: '1rem', lineHeight: '1.6' }}>
                                            {renderText(msg.text)}
                                            {msg.isEdited && <span style={{ fontSize: '0.65rem', opacity: 0.4, marginLeft: '8px' }}>(edited)</span>}
                                        </div>

                                        <div style={{ display: 'flex', gap: '16px', marginTop: '12px', opacity: 0.5, fontSize: '0.75rem' }}>
                                            <span onClick={() => setReplyTo(msg)} style={{ cursor: 'pointer', fontWeight: '700' }}>↩️ Reply</span>
                                            {isSelf && <span onClick={() => setEditingMessage({ id: msg.id, text: msg.text })} style={{ cursor: 'pointer', fontWeight: '700' }}>✏️ Edit</span>}
                                            <span onClick={() => togglePin(msg.id, msg.isPinned)} style={{ cursor: 'pointer', fontWeight: '700' }}>{msg.isPinned ? '📍 Unpin' : '📌 Pin'}</span>
                                            {(user?.role === 'Manager' || isSelf) && (
                                                <span onClick={() => deleteMessage(msg.id)} style={{ cursor: cooldownRemaining > 0 ? 'not-allowed' : 'pointer', color: '#f87171', fontWeight: '900' }}>
                                                    🗑️ {cooldownRemaining > 0 ? `${cooldownRemaining}s` : 'Delete'}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={chatEndRef} />
                    </div>

                    {/* Input Area */}
                    <div style={{ padding: isMobile ? '12px' : '24px', backgroundColor: 'rgba(31, 41, 55, 0.4)', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginBottom: isMobile ? '10px' : '16px', paddingBottom: '5px' }} className="hide-scrollbar">
                            {quickReplies.map((qr, i) => (
                                <button key={i} onClick={() => handleSend(null, qr)} style={{ whiteSpace: 'nowrap', padding: isMobile ? '6px 12px' : '8px 16px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.1)', backgroundColor: 'rgba(255, 255, 255, 0.03)', color: '#94a3b8', cursor: 'pointer', fontSize: isMobile ? '0.75rem' : '0.8rem' }}>{qr}</button>
                            ))}
                        </div>

                        {editingMessage && (
                            <div style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', padding: '10px 20px', borderRadius: '12px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.85rem' }}>✏️ Editing message...</span>
                                <button onClick={() => setEditingMessage(null)} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer' }}>Cancel</button>
                            </div>
                        )}

                        <form onSubmit={editingMessage ? handleEdit : handleSend} style={{ display: 'flex', gap: isMobile ? '8px' : '16px', alignItems: 'center' }}>
                            <button type="button" onClick={() => setIsImportantNext(!isImportantNext)} style={{ flexShrink: 0, width: isMobile ? '44px' : '56px', height: isMobile ? '44px' : '56px', borderRadius: '14px', border: 'none', backgroundColor: isImportantNext ? '#ef4444' : 'rgba(255,255,255,0.05)', cursor: 'pointer', fontSize: isMobile ? '1rem' : '1.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🚨</button>
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                {replyTo && <div style={{ fontSize: '0.65rem', color: chatAccent, fontWeight: 'bold' }}>Replying to @{replyTo.user}</div>}
                                <input
                                    type="text"
                                    value={editingMessage ? editingMessage.text : input}
                                    onChange={(e) => editingMessage ? setEditingMessage({ ...editingMessage, text: e.target.value }) : setInput(e.target.value)}
                                    placeholder={editingMessage ? "Edit..." : "Type here..."}
                                    style={{ width: '100%', boxSizing: 'border-box', padding: isMobile ? '12px 16px' : '16px 24px', borderRadius: '14px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '0.95rem', outline: 'none' }}
                                />
                            </div>
                            <button type="submit" style={{ flexShrink: 0, width: isMobile ? '44px' : '56px', height: isMobile ? '44px' : '56px', borderRadius: '14px', border: 'none', backgroundColor: chatAccent, color: '#fff', cursor: 'pointer', fontSize: isMobile ? '1.2rem' : '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {editingMessage ? '✅' : '🚀'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Chat;
