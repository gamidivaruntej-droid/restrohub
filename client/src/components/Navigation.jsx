import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { HiHome, HiClipboardList, HiBell, HiChatAlt2, HiCog, HiUser } from 'react-icons/hi';

const Navigation = ({ onLogout, user }) => {
  const links = [
    { name: 'HOME', path: '/home', icon: <HiHome />, show: true },
    { name: 'TASKS', path: '/tasks', icon: <HiClipboardList />, show: true },
    { name: 'NOTIFICATIONS', path: '/notifications', icon: <HiBell />, show: true },
    { name: 'CHAT', path: '/community', icon: <HiChatAlt2 />, show: true },
    { name: 'SETTINGS', path: '/settings', icon: <HiCog />, show: true },
    { name: 'PROFILE', path: '/profile', icon: <HiUser />, show: true }
  ].filter(link => link.show);

  return (
    <>
      {/* Desktop Top Nav */}
      <div className="nav-bar">
        <Link to="/home" className="nav-brand" style={{ textDecoration: 'none', color: 'var(--accent)' }}>RestroHub</Link>
        <div className="nav-links">
          {links.map(link => {
            const isDisabled = !user?.isProfileComplete && link.path !== '/profile';
            return (
              <NavLink
                key={link.path}
                to={isDisabled ? '#' : link.path}
                className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
                style={{
                  opacity: isDisabled ? 0.3 : 1,
                  pointerEvents: isDisabled ? 'none' : 'auto',
                  cursor: isDisabled ? 'not-allowed' : 'pointer'
                }}
              >
                {link.name}
              </NavLink>
            );
          })}
        </div>
        <button className="btn-exit" onClick={onLogout}>LOG OUT</button>
      </div>

      {/* Mobile Bottom Nav */}
      <div className="bottom-nav">
        {links.map(link => {
          const isDisabled = !user?.isProfileComplete && link.path !== '/profile';
          return (
            <NavLink
              key={link.path}
              to={isDisabled ? '#' : link.path}
              className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                fontSize: '0.7rem',
                opacity: isDisabled ? 0.3 : 1,
                pointerEvents: isDisabled ? 'none' : 'auto',
                padding: '12px 10px',
                borderRadius: '16px',
                color: 'var(--text-muted)',
                textDecoration: 'none',
                flex: 1,
                minWidth: '0',
                transition: 'all 0.2s'
              }}
            >
              <span style={{ fontSize: '1.5rem', display: 'block' }}>{link.icon}</span>
              <span style={{ fontWeight: 800, fontSize: '0.6rem', letterSpacing: '0.5px' }}>{link.name}</span>
            </NavLink>
          );
        })}
      </div>
    </>
  );
};

export default Navigation;
