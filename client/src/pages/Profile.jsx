import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import { doc, setDoc, deleteDoc, collection, addDoc, getDocs, serverTimestamp, query, where, onSnapshot } from 'firebase/firestore';
import { deleteUser } from 'firebase/auth';

const Profile = ({ user, onUpdate }) => {
  const navigate = useNavigate();
  const [showSuccess, setShowSuccess] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveReason, setLeaveReason] = useState('');
  const [isSubmittingLeave, setIsSubmittingLeave] = useState(false);

  const [formData, setFormData] = useState({
    // Personal Details
    fullName: user?.name || user?.fullName || '',
    profilePhoto: user?.profilePhoto || null,
    gender: user?.gender || 'Male',
    dob: user?.dob || '1995-05-15',
    phone: user?.phone || '9876543210',
    email: user?.email || '',
    address: user?.address || '123 Fine Dining Ave, Kitchener Heights',

    // Employee Details
    employeeId: user?.employeeId || 'RH-2024-042',
    role: user?.role || 'Waiter',
    department: user?.department || 'Front of House',
    doj: user?.doj || '2024-01-10',
    workShift: user?.workShift || 'Morning',
    employmentType: user?.employmentType || 'Full-time',
    currentStatus: user?.currentStatus || 'Active',
    experience: user?.experience || '3 Years',
    skills: user?.skills || 'Customer Service, POS Systems, Wine Pairing',

    // Emergency Contact
    emergencyName: user?.emergencyName || 'Jane Smith',
    emergencyPhone: user?.emergencyPhone || '9000012345',

    // Security
    username: user?.username || (user?.email ? user.email.split('@')[0] : 'admin_user')
  });

  const [leaveRequest, setLeaveRequest] = useState(null);

  useEffect(() => {
    if (!user?.uid) return;
    const today = new Date().toISOString().split('T')[0];
    const q = query(collection(db, 'leaves'), where('userId', '==', user.uid), where('date', '==', today));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setLeaveRequest({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
      } else {
        setLeaveRequest(null);
      }
    });
    return () => unsubscribe();
  }, [user?.uid]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, profilePhoto: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerUpload = () => {
    document.getElementById('profile-upload').click();
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!user?.uid) return;

    try {
      const userRef = doc(db, 'users', user.uid);
      const updatedData = {
        ...formData,
        name: formData.fullName, // Map back to unified name field
        isProfileComplete: true,
        updatedAt: new Date()
      };

      await setDoc(userRef, updatedData, { merge: true });

      if (onUpdate) onUpdate(updatedData);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        navigate('/home');
      }, 1500);
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Failed to save profile. Please try again.");
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("⚠️ CRITICAL: Are you sure? This will PERMANENTLY delete your account and data.")) return;

    setIsDeleting(true);
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        // Delete Firestore data first
        await deleteDoc(doc(db, 'users', user.uid));
        // Delete Auth account
        await deleteUser(currentUser);
        alert("Account deleted successfully.");
        window.location.reload();
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("Please re-login to delete your account (Security requirement).");
    } finally {
      setIsDeleting(false);
    }
  };

  const submitLeaveRequest = async () => {
    if (!leaveReason.trim()) return alert("Please provide a reason.");
    setIsSubmittingLeave(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // 1. Save Leave Request
      await addDoc(collection(db, 'leaves'), {
        userId: user.uid,
        userName: user.name || user.fullName || 'Staff Member',
        role: user.role,
        status: 'pending',
        date: today,
        reason: leaveReason,
        createdAt: serverTimestamp()
      });

      // 2. Notify All Managers
      const managersQuery = query(collection(db, 'users'), where('role', '==', 'Manager'));
      const managersSnapshot = await getDocs(managersQuery);
      const managerCount = managersSnapshot.size;
      
      for (const managerDoc of managersSnapshot.docs) {
        await addDoc(collection(db, 'notifications'), {
          userId: managerDoc.id,
          type: 'Alert',
          title: '📅 New Leave Request',
          message: `${user.name || user.fullName || 'A staff member'} is requesting leave for today. Reason: ${leaveReason}`,
          time: 'Just now',
          icon: '⏳',
          color: '#f59e0b',
          createdAt: serverTimestamp()
        });
      }

      // 3. Notify Self (Receipt)
      await addDoc(collection(db, 'notifications'), {
        userId: user.uid,
        type: 'Info',
        title: '✅ Leave Requested',
        message: `Your leave request for today has been submitted. Status: PENDING.`,
        time: 'Just now',
        icon: '📋',
        color: '#3b82f6',
        createdAt: serverTimestamp()
      });

      if (managerCount > 0) {
        alert(`Leave request submitted! ${managerCount} manager(s) have been notified in real-time.`);
      } else {
        alert("Leave request submitted! (Note: No managers are currently registered to receive alerts, but your request is saved in the portal).");
      }
      setLeaveReason('');
      setShowLeaveModal(false);
    } catch (error) {
      console.error("Error submitting leave:", error);
      alert("Failed to submit request.");
    } finally {
      setIsSubmittingLeave(false);
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: '1000px' }}>
      {showSuccess && <div className="success-toast">✨ Profile Updated Successfully!</div>}

      {!user?.isProfileComplete && (
        <div style={{
          backgroundColor: 'rgba(249, 115, 22, 0.1)',
          border: '1px solid var(--accent)',
          padding: '20px',
          borderRadius: '16px',
          marginBottom: '2rem',
          textAlign: 'center',
          color: 'var(--accent)',
          fontWeight: '700'
        }}>
          🚀 Welcome! Please complete your profile setup to unlock full access to the dashboard and tasks.
        </div>
      )}

      <h1 style={{ textAlign: 'center', marginBottom: '3rem', fontSize: '3rem', fontWeight: '800' }}>User Profile</h1>

      <form onSubmit={handleSave} style={{ width: '100%' }}>
        {/* Header Section with Photo */}
        <div className="stat-card" style={{ marginBottom: '2rem', padding: '2rem' }}>
          <div className="profile-photo-wrapper" style={{ 
            flexDirection: window.innerWidth < 640 ? 'column' : 'row',
            alignItems: 'center',
            textAlign: window.innerWidth < 640 ? 'center' : 'left',
            gap: '2rem'
          }}>
            <input
              type="file"
              id="profile-upload"
              hidden
              accept="image/*"
              onChange={handlePhotoChange}
            />
            <div className="profile-photo-preview" onClick={triggerUpload} style={{
              width: '120px', height: '120px', fontSize: '3rem', margin: window.innerWidth < 640 ? '0 auto' : '0'
            }}>
              {formData.profilePhoto ? (
                <img
                  src={formData.profilePhoto}
                  alt="Profile"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                formData.fullName.charAt(0)
              )}
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '8px' }}>Profile Picture</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '15px' }}>JPG or PNG. Max size 2MB.</p>
              <button type="button" className="btn-primary" onClick={triggerUpload} style={{ marginTop: '0', padding: '10px 20px', fontSize: '0.9rem' }}>
                Change Avatar
              </button>
            </div>
          </div>
        </div>

        <div className="stat-card profile-section" style={{ padding: window.innerWidth < 768 ? '1.5rem' : '2.5rem' }}>
          <h2 className="profile-section-title" style={{ fontSize: '1.2rem', marginBottom: '1.5rem' }}>Personal Details</h2>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: window.innerWidth < 768 ? '1fr' : 'repeat(2, 1fr)', 
            gap: '1.5rem' 
          }}>
            <div className="form-group">
              <label>Full Name</label>
              <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} className="form-control" />
            </div>
            <div className="form-group">
              <label>Gender</label>
              <select name="gender" value={formData.gender} onChange={handleChange} className="form-control">
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </div>
            <div className="form-group">
              <label>Date of Birth</label>
              <input type="date" name="dob" value={formData.dob} onChange={handleChange} className="form-control" />
            </div>
            <div className="form-group">
              <label>Phone Number</label>
              <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="form-control" />
            </div>
            <div className="form-group" style={{ gridColumn: window.innerWidth < 768 ? 'span 1' : 'span 2' }}>
              <label>Residential Address</label>
              <textarea name="address" value={formData.address} onChange={handleChange} className="form-control" style={{ minHeight: '80px' }}></textarea>
            </div>
          </div>
        </div>

        <div className="stat-card profile-section" style={{ padding: window.innerWidth < 768 ? '1.5rem' : '2.5rem' }}>
          <h2 className="profile-section-title" style={{ fontSize: '1.2rem', marginBottom: '1.5rem' }}>Professional Details</h2>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: window.innerWidth < 768 ? '1fr' : 'repeat(3, 1fr)', 
            gap: '1.5rem' 
          }}>
            <div className="form-group">
              <label>Employee ID</label>
              <input type="text" name="employeeId" value={formData.employeeId} readOnly className="form-control" style={{ opacity: 0.7 }} />
            </div>
            <div className="form-group">
              <label>Role</label>
              <input
                type="text"
                name="role"
                value={formData.role}
                readOnly
                className="form-control"
                style={{ backgroundColor: 'rgba(255,255,255,0.05)', cursor: 'not-allowed', color: 'var(--accent)', fontWeight: 'bold' }}
              />
            </div>
            <div className="form-group">
              <label>Station Assignment</label>
              <select
                name="subGroup"
                value={formData.subGroup || ''}
                onChange={handleChange}
                className="form-control"
              >
                <option value="">Select Assignment...</option>
                {formData.role === 'Waiter' && (
                  <>
                    <option>Dining Room - Floor 1</option>
                    <option>Dining Room - Floor 2</option>
                    <option>Terrace / Outdoor</option>
                    <option>VIP Lounge</option>
                  </>
                )}
                {formData.role === 'Chef' && (
                  <>
                    <option>Grill Station</option>
                    <option>Pastry & Desserts</option>
                    <option>Sauté / Main Course</option>
                    <option>Cold Kitchen / Prep</option>
                  </>
                )}
                {formData.role === 'Manager' && (
                  <>
                    <option>Operational Staffing</option>
                    <option>Inventory & Supplies</option>
                    <option>Customer Relations</option>
                    <option>Finance / Accounting</option>
                  </>
                )}
                {formData.role === 'Cleaner' && (
                  <>
                    <option>Main Hall Cleaning</option>
                    <option>Restroom Maintenance</option>
                    <option>Kitchen Deep Clean</option>
                  </>
                )}
                {(!['Waiter', 'Chef', 'Manager', 'Cleaner'].includes(formData.role)) && (
                  <option>General Support</option>
                )}
              </select>
            </div>
            <div className="form-group">
              <label>Department</label>
              <input type="text" name="department" value={formData.department} readOnly className="form-control" style={{ opacity: 0.7 }} />
            </div>
            <div className="form-group">
              <label>Date of Joining</label>
              <input type="date" name="doj" value={formData.doj} readOnly className="form-control" style={{ opacity: 0.7 }} />
            </div>
            <div className="form-group">
              <label>Work Shift</label>
              <select name="workShift" value={formData.workShift} onChange={handleChange} className="form-control">
                <option>Morning</option>
                <option>Afternoon</option>
                <option>Night</option>
                <option>Double Shift</option>
              </select>
            </div>
            <div className="form-group">
              <label>Employment Type</label>
              <select name="employmentType" value={formData.employmentType} onChange={handleChange} className="form-control">
                <option>Full-time</option>
                <option>Part-time</option>
                <option>Contract</option>
              </select>
            </div>
            <div className="form-group">
              <label>Current Status</label>
              <input type="text" name="currentStatus" value={formData.currentStatus} readOnly className="form-control" style={{ color: '#10b981', fontWeight: 'bold' }} />
            </div>
            <div className="form-group">
              <label>Experience</label>
              <input type="text" name="experience" value={formData.experience} onChange={handleChange} className="form-control" />
            </div>
            <div className="form-group" style={{ gridColumn: window.innerWidth < 768 ? 'span 1' : 'span 3' }}>
              <label>Skills</label>
              <input type="text" name="skills" value={formData.skills} onChange={handleChange} className="form-control" placeholder="e.g. Communication, Culinary" />
            </div>
          </div>
        </div>

        {/* Security & Emergency */}
        <div className="stat-card profile-section">
          <h2 className="profile-section-title">Security & Emergency</h2>
          <div className="profile-grid">
            <div className="form-group">
              <label>Username</label>
              <input type="text" name="username" value={formData.username} readOnly className="form-control" style={{ opacity: 0.7 }} />
            </div>
            <div className="form-group">
              <label>Emergency Contact Name</label>
              <input type="text" name="emergencyName" value={formData.emergencyName} onChange={handleChange} className="form-control" />
            </div>
            <div className="form-group">
              <label>Emergency Contact Number</label>
              <input type="tel" name="emergencyPhone" value={formData.emergencyPhone} onChange={handleChange} className="form-control" />
            </div>
          </div>
        </div>

        {/* Leave Management Section */}
        <div className="stat-card" style={{ padding: '24px', backgroundColor: 'rgba(255, 255, 255, 0.02)', borderRadius: '24px', border: '1px solid var(--border)', marginBottom: '30px' }}>
          <div style={{ 
            display: 'flex', 
            flexDirection: window.innerWidth < 640 ? 'column' : 'row',
            justifyContent: 'space-between', 
            alignItems: 'center',
            gap: '20px'
          }}>
            <div style={{ textAlign: window.innerWidth < 640 ? 'center' : 'left' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--accent)', marginBottom: '4px' }}>📅 Leave Request</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>Request time off for duty reassignment.</p>
            </div>
            {leaveRequest ? (
              <div style={{ textAlign: window.innerWidth < 640 ? 'center' : 'right' }}>
                <span style={{ 
                  padding: '8px 16px', 
                  borderRadius: '12px', 
                  fontSize: '0.75rem', 
                  fontWeight: '900',
                  backgroundColor: leaveRequest.status === 'approved' ? 'rgba(16, 185, 129, 0.1)' : leaveRequest.status === 'pending' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  color: leaveRequest.status === 'approved' ? '#10b981' : leaveRequest.status === 'pending' ? '#f59e0b' : '#ef4444',
                  border: `1px solid ${leaveRequest.status === 'approved' ? '#10b981' : leaveRequest.status === 'pending' ? '#f59e0b' : '#ef4444'}33`
                }}>
                  {leaveRequest.status.toUpperCase()}
                </span>
              </div>
            ) : (
              <button 
                type="button"
                onClick={() => setShowLeaveModal(true)}
                className="btn-primary" 
                style={{ marginTop: 0, padding: '10px 24px', fontSize: '0.85rem', backgroundColor: '#f59e0b', width: window.innerWidth < 640 ? '100%' : 'auto' }}
              >
                🚀 Request Leave
              </button>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', marginBottom: '5rem' }}>
          <button type="submit" className="btn-primary" style={{ maxWidth: '300px' }}>
            💾 Save All Changes
          </button>

          <button
            type="button"
            disabled={isDeleting}
            onClick={handleDeleteAccount}
            style={{
              background: 'none',
              border: 'none',
              color: '#ef4444',
              fontWeight: '700',
              cursor: isDeleting ? 'not-allowed' : 'pointer',
              textDecoration: 'underline',
              fontSize: '0.9rem',
              marginTop: '10px',
              opacity: isDeleting ? 0.5 : 1
            }}
          >
            {isDeleting ? 'Deleting Account...' : '🗑️ Permanently Delete My Account'}
          </button>
        </div>
      </form>

      {/* Leave Reason Modal */}
      {showLeaveModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          padding: '20px'
        }}>
          <div className="stat-card" style={{ maxWidth: '500px', width: '100%', padding: '30px', animation: 'hero-entry 0.5s ease' }}>
            <h2 style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: '10px', color: 'var(--accent)' }}>Request Leave</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '20px', fontSize: '0.9rem' }}>Please provide a brief reason for your absence today.</p>
            
            <div className="form-group">
              <label>Reason for Leave</label>
              <textarea
                value={leaveReason}
                onChange={(e) => setLeaveReason(e.target.value)}
                className="form-control"
                placeholder="I need to take leave because..."
                style={{ minHeight: '120px', padding: '15px' }}
              ></textarea>
            </div>

            <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
              <button 
                onClick={submitLeaveRequest}
                disabled={isSubmittingLeave}
                className="btn-primary" 
                style={{ marginTop: 0, flex: 1 }}
              >
                {isSubmittingLeave ? 'Submitting...' : '🚀 Submit Request'}
              </button>
              <button 
                onClick={() => setShowLeaveModal(false)}
                style={{ 
                  padding: '12px 20px', 
                  borderRadius: '12px', 
                  border: '1px solid var(--border)', 
                  backgroundColor: 'transparent',
                  color: 'var(--text-main)',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
