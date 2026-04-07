import React, { useState, useEffect } from 'react';
import { initialTemplates } from '../data/initialTemplates';
import { db } from '../firebase';
import {
  collection,
  query,
  where,
  onSnapshot,
  updateDoc,
  doc,
  addDoc,
  getDocs,
  serverTimestamp
} from 'firebase/firestore';

const Tasks = ({ user }) => {
  const [view, setView] = useState('list'); // 'list' or 'templates'
  const [templates, setTemplates] = useState([]);
  const [activeRole, setActiveRole] = useState(user?.role || 'Waiter');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(null);

  const roles = ['Waiter', 'Kitchen Staff', 'Cleaner', 'Cashier', 'Manager', 'Chef'];

  const [routineTasks, setRoutineTasks] = useState([]);
  const [additionalTasks, setAdditionalTasks] = useState([]);

  // Sync tasks with Firestore
  useEffect(() => {
    if (!user?.uid) return;

    const q = query(collection(db, 'tasks'), where('userId', '==', user.uid));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const taskList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      if (taskList.length === 0) {
        // Initialize tasks from templates per role if none exist
        const initialTasks = initialTemplates
          .filter(t => t.role === user.role)
          .map(t => ({
            ...t,
            userId: user.uid,
            status: 'pending',
            createdAt: new Date()
          }));

        for (const task of initialTasks) {
          await addDoc(collection(db, 'tasks'), task);
        }
      } else {
        // Further filter by role for safety (handles migration from "all visible" period)
        const roleTasks = taskList.filter(t => t.role === user.role || !t.role || t.isAdditional);
        setRoutineTasks(roleTasks.filter(t => !t.isAdditional));
        setAdditionalTasks(roleTasks.filter(t => t.isAdditional));
      }
    });

    return () => unsubscribe();
  }, [user?.uid, user?.role]);

  const updateTaskStatus = async (id, newStatus) => {
    try {
      const taskRef = doc(db, 'tasks', id);
      await updateDoc(taskRef, { 
        status: newStatus,
        updatedAt: serverTimestamp() 
      });
    } catch (error) {
      alert("⚠️ Error updating task status. Ensure you have permissions or check-in first!");
      console.error("Error updating task status:", error);
    }
  };

  const TaskItem = ({ task, variant = 'routine' }) => {
    const isAdditional = variant === 'additional';
    const isCompleted = task.status === 'completed';
    const isInProgress = task.status === 'in-progress';
    const isPending = task.status === 'pending';

    const getStatusColor = () => {
      if (isCompleted) return '#10b981';
      if (isInProgress) return '#f59e0b';
      return 'var(--text-muted)';
    };

    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          padding: '24px',
          borderBottom: '1px solid var(--border)',
          background: isCompleted ? 'rgba(0,0,0,0.01)' : 'transparent',
          transition: '0.2s',
          opacity: isCompleted ? 0.7 : 1,
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{
                fontSize: '1.1rem',
                fontWeight: '800',
                textDecoration: isCompleted ? 'line-through' : 'none',
                color: isCompleted ? 'var(--text-muted)' : 'inherit'
              }}>
                {task.title}
              </span>
              <span style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--accent)' }}>
                ⏱️ {task.estimatedTime}
              </span>
            </div>

            {/* Context Info: Assigned By & Tables */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '700' }}>
                👤 Assigned by {task.assignedBy || 'System'}
              </span>
              {user?.role === 'Waiter' && task.tables && (
                <span style={{ fontSize: '0.7rem', color: '#3b82f6', fontWeight: '800', backgroundColor: 'rgba(59, 130, 246, 0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                  📍 Tables: {task.tables.join(', ')}
                </span>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <span style={{
              fontSize: '0.7rem',
              fontWeight: '900',
              padding: '4px 10px',
              borderRadius: '6px',
              backgroundColor: `${getStatusColor()}15`,
              color: getStatusColor(),
              border: `1px solid ${getStatusColor()}30`,
              textTransform: 'uppercase'
            }}>
              {task.status}
            </span>
            <span style={{
              padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold',
              backgroundColor: task.priority === 'High' ? '#ef4444' : task.priority === 'Medium' ? '#f59e0b' : '#3b82f6',
              color: 'white'
            }}>
              {task.priority}
            </span>
          </div>
        </div>

        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0, maxWidth: '800px', lineHeight: '1.5' }}>
          {task.description}
        </p>

        {task.notes && (
          <div style={{
            backgroundColor: 'rgba(249, 115, 22, 0.05)',
            borderLeft: '4px solid var(--accent)',
            padding: '10px 15px',
            borderRadius: '4px',
            fontSize: '0.85rem',
            fontStyle: 'italic',
            color: 'var(--text-main)'
          }}>
            " {task.notes} "
          </div>
        )}

        {!isCompleted && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
            <button 
              className="btn-primary" 
              onClick={() => updateTaskStatus(task.id, 'completed')} 
              disabled={!shiftStatus.checkIn}
              style={{ 
                backgroundColor: shiftStatus.checkIn ? '#10b981' : 'var(--border)', 
                marginTop: '10px', 
                padding: '12px',
                cursor: shiftStatus.checkIn ? 'pointer' : 'not-allowed',
                opacity: shiftStatus.checkIn ? 1 : 0.6,
                fontWeight: '900'
              }}
            >
              ✅ COMPLETED
            </button>
            {!shiftStatus.checkIn && (
              <p style={{ color: '#ef4444', fontSize: '0.75rem', fontWeight: '800', textAlign: 'center', margin: 0 }}>
                ⚠️ Please Check-In to complete tasks
              </p>
            )}
          </div>
        )}
      </div>
    );
  };

  const TaskSummaryWidget = () => {
    const allTasks = [...routineTasks, ...additionalTasks];
    const pendingCount = allTasks.filter(t => t.status === 'pending').length;
    const progressCount = allTasks.filter(t => t.status === 'in-progress').length;
    const completedCount = allTasks.filter(t => t.status === 'completed').length;

    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: window.innerWidth < 768 ? '1fr' : 'repeat(3, 1fr)',
        gap: '15px',
        marginBottom: '2rem'
      }}>
        <div className="stat-card" style={{ textAlign: 'center', borderTop: '4px solid var(--text-muted)', padding: '1.5rem' }}>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '800', marginBottom: '8px' }}>PENDING TASKS</p>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '900' }}>{pendingCount}</h2>
        </div>
        <div className="stat-card" style={{ textAlign: 'center', borderTop: '4px solid #f59e0b', padding: '1.5rem' }}>
          <p style={{ fontSize: '0.7rem', color: '#f59e0b', fontWeight: '800', marginBottom: '8px' }}>IN PROGRESS</p>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '900' }}>{progressCount}</h2>
        </div>
        <div className="stat-card" style={{ textAlign: 'center', borderTop: '4px solid #10b981', padding: '1.5rem' }}>
          <p style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: '800', marginBottom: '8px' }}>COMPLETED</p>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '900' }}>{completedCount}</h2>
        </div>
      </div>
    );
  };

  // Shift Data Logic
  const [shiftStatus, setShiftStatus] = useState({
    start: '09:00 AM', end: '05:00 PM', checkIn: null, checkInTime: null, checkOut: null, isEarly: false, docId: null
  });
  const [elapsedTime, setElapsedTime] = useState(0);

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
        const docId = snapshot.docs[0].id;

        setShiftStatus(prev => ({
          ...prev,
          checkIn: shiftData.checkIn,
          checkInTime: shiftData.checkInTime?.toDate(),
          checkOut: shiftData.checkOut,
          docId: docId,
          isEarly: shiftData.isEarly
        }));
      }
    });

    return () => unsubscribe();
  }, [user?.uid]);

  useEffect(() => {
    let interval;
    if (shiftStatus.checkInTime && !shiftStatus.checkOut) {
      interval = setInterval(() => {
        const now = new Date();
        const diff = Math.floor((now - shiftStatus.checkInTime) / 1000);
        setElapsedTime(diff);
      }, 1000);
    } else if (shiftStatus.checkInTime && shiftStatus.checkOut) {
      // If already checked out, we might need a stored duration or calculate it once
      // For simplicity, we'll let it stay at the last elapsed time if we want, 
      // but it's better to store the final duration.
    }
    return () => clearInterval(interval);
  }, [shiftStatus.checkInTime, shiftStatus.checkOut]);

  const formatTime = (totalSeconds) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h}h ${m}m ${s}s`;
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
        isEarly: false,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Check-in error:", error);
    }
  };

  const handleCheckOut = async () => {
    if (!shiftStatus.docId) return;

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const scheduledEnd = new Date();
    scheduledEnd.setHours(17, 0, 0, 0);

    try {
      const shiftRef = doc(db, 'shifts', shiftStatus.docId);
      await updateDoc(shiftRef, {
        checkOut: timeStr,
        checkOutTime: serverTimestamp(),
        isEarly: now < scheduledEnd
      });
    } catch (error) {
      console.error("Check-out error:", error);
    }
  };

  const ShiftCard = () => (
    <div className="stat-card" style={{
      width: '100%', marginBottom: '2rem', display: 'flex', 
      flexDirection: window.innerWidth < 1024 ? 'column' : 'row',
      justifyContent: 'space-between', alignItems: window.innerWidth < 1024 ? 'stretch' : 'center',
      padding: window.innerWidth < 768 ? '1.5rem' : '2rem 3rem', 
      background: 'linear-gradient(135deg, var(--card-bg) 0%, var(--secondary-bg) 100%)', 
      borderLeft: '8px solid var(--accent)',
      gap: '2rem'
    }}>
      <div style={{ 
        display: 'flex', 
        flexDirection: window.innerWidth < 640 ? 'column' : 'row',
        gap: window.innerWidth < 640 ? '1rem' : '40px',
        width: '100%'
      }}>
        <div style={{ textAlign: 'left', flex: 1 }}>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '800', marginBottom: '4px' }}>🕒 Shift Window</p>
          <h3 style={{ fontSize: '1rem' }}>{shiftStatus.start} - {shiftStatus.end}</h3>
        </div>
        <div style={{ 
          textAlign: 'left', 
          borderLeft: window.innerWidth < 640 ? 'none' : '1px solid var(--border)', 
          paddingLeft: window.innerWidth < 640 ? '0' : '40px', 
          flex: 1 
        }}>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '800', marginBottom: '4px' }}>📍 Check-In</p>
          <h3 style={{ fontSize: '1rem', color: shiftStatus.checkIn ? 'var(--text-main)' : 'var(--text-muted)' }}>
            {shiftStatus.checkIn || '--:--'}
          </h3>
        </div>
        <div style={{ 
          textAlign: 'left', 
          borderLeft: window.innerWidth < 640 ? 'none' : '1px solid var(--border)', 
          paddingLeft: window.innerWidth < 640 ? '0' : '40px', 
          flex: 1 
        }}>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '800', marginBottom: '4px' }}>🔚 Check-Out</p>
          <h3 style={{ fontSize: '1rem', color: shiftStatus.checkOut ? 'var(--text-main)' : 'var(--text-muted)' }}>
            {shiftStatus.checkOut || '--:--'}
          </h3>
        </div>
        <div style={{ 
          textAlign: 'left', 
          borderLeft: window.innerWidth < 640 ? 'none' : '1px solid var(--border)', 
          paddingLeft: window.innerWidth < 640 ? '0' : '40px', 
          flex: 1 
        }}>
          <p style={{ fontSize: '0.7rem', color: 'var(--accent)', textTransform: 'uppercase', fontWeight: '800', marginBottom: '4px' }}>💰 Working Hours</p>
          <h3 style={{ fontSize: '1rem', fontWeight: '900' }}>{formatTime(elapsedTime)}</h3>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: window.innerWidth < 1024 ? 'center' : 'flex-end', gap: '8px' }}>
        <div style={{ display: 'flex', gap: '15px', width: '100%' }}>
          {!shiftStatus.checkIn ? (
            <button onClick={handleCheckIn} className="btn-primary" style={{ marginTop: '0', padding: '10px 20px', width: '100%' }}>▶️ Check In</button>
          ) : !shiftStatus.checkOut ? (
            <button onClick={handleCheckOut} className="btn-primary" style={{ marginTop: '0', padding: '10px 20px', backgroundColor: '#ef4444', width: '100%' }}>⏹️ Check Out</button>
          ) : <span style={{ color: '#10b981', fontWeight: '800', fontSize: '1rem', textAlign: 'center', width: '100%' }}>✅ Shift Logged</span>}
        </div>
        {shiftStatus.isEarly && (
          <p style={{ color: '#ef4444', fontSize: '0.8rem', fontWeight: '700' }}>⚠️ Shift incomplete</p>
        )}
      </div>
    </div>
  );

  const activeRoutine = routineTasks.filter(t => t.status !== 'completed');
  const activeAdditional = additionalTasks.filter(t => t.status !== 'completed');
  const completedTasks = [...routineTasks, ...additionalTasks].filter(t => t.status === 'completed');

  return (
    <div className="page-container" style={{ maxWidth: '1200px' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '3rem', fontSize: '3rem', fontWeight: '800' }}>Operational Tasks</h1>

      {user?.role === 'Manager' && (
        <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'center' }}>
          <button className="btn-primary" onClick={() => setView(view === 'list' ? 'templates' : 'list')} style={{ marginTop: 0 }}>
            {view === 'list' ? '🛠️ MANAGE MASTER TEMPLATES' : '🔙 BACK TO TASK LIST'}
          </button>
        </div>
      )}

      {view === 'list' ? (
        <>
          <TaskSummaryWidget />
          <ShiftCard />

          <div className="tasks-grid">
            {/* Daily Routine Section */}
            <div className="task-section">
              <div className="section-header" style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '900' }}>Daily Protocol</h2>
                <span className="task-count">{activeRoutine.length} Active</span>
              </div>
              <div className="stat-card" style={{ padding: '0', overflow: 'hidden' }}>
                {activeRoutine.length > 0 ? activeRoutine.map(task => (
                  <TaskItem key={task.id} task={task} />
                )) : <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>All routine protocols maintained</div>}
              </div>
            </div>

            {/* Additional Shifts & Covering Section */}
            <div className="task-section">
              <div className="section-header" style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#ef4444' }}>High Priority Actions</h2>
                <span className="task-count" style={{ backgroundColor: '#fee2e2', color: '#ef4444' }}>{activeAdditional.length} Emergency</span>
              </div>
              <div className="stat-card" style={{ padding: '0', overflow: 'hidden', borderTop: '4px solid #ef4444' }}>
                {activeAdditional.length > 0 ? activeAdditional.map(task => (
                  <TaskItem key={task.id} task={task} variant="additional" />
                )) : <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No critical alerts active</div>}
              </div>
            </div>
          </div>

          {/* Completed Missions Section */}
          {completedTasks.length > 0 && (
            <div style={{ marginTop: '4rem' }}>
              <div className="section-header" style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#10b981' }}>Completed Tasks</h2>
                <span className="task-count" style={{ backgroundColor: '#dcfce7', color: '#10b981' }}>{completedTasks.length} Logged</span>
              </div>
              <div className="stat-card" style={{ padding: '0', overflow: 'hidden', opacity: 0.8 }}>
                {completedTasks.map(task => (
                  <TaskItem key={task.id} task={task} />
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="animate-hero">
          <p style={{ textAlign: 'center', opacity: 0.5, marginTop: '4rem' }}>Master Template System Active. Navigate back to see your daily list.</p>
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem' }}>
            <button
              className="btn-primary"
              onClick={() => setView('list')}
              style={{ backgroundColor: 'transparent', color: 'var(--accent)', border: '1px solid var(--accent)' }}
            >
              🔙 Return to Operations
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;
