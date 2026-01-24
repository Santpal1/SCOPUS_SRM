import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, Menu, X, User, BarChart3 } from 'lucide-react';
import styles from './UserMenu.module.css';

const UserMenu: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  if (!isAuthenticated || !user) {
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsOpen(false);
  };

  const getAccessLevelLabel = (level: number): string => {
    switch (level) {
      case 1:
        return 'Admin';
      case 2:
        return 'Faculty (Full Access)';
      case 3:
        return 'Faculty (Restricted)';
      default:
        return 'User';
    }
  };

  const getAccessLevelColor = (level: number): string => {
    switch (level) {
      case 1:
        return '#ff6b6b'; // Red for admin
      case 2:
        return '#4ecdc4'; // Teal for full access
      case 3:
        return '#ffa502'; // Orange for restricted
      default:
        return '#95a5a6'; // Gray for default
    }
  };

  return (
    <div className={styles.userMenuContainer}>
      <button
        className={styles.userMenuButton}
        onClick={() => setIsOpen(!isOpen)}
        title={`${user.username} - ${getAccessLevelLabel(user.accessLevel)}`}
      >
        <User size={20} />
        <span className={styles.username}>{user.username}</span>
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.userInfo}>
            <div className={styles.userDetails}>
              <p className={styles.label}>Username:</p>
              <p className={styles.value}>{user.username}</p>
              
              <p className={styles.label}>Access Level:</p>
              <div className={styles.accessLevel}>
                <span
                  className={styles.badge}
                  style={{ backgroundColor: getAccessLevelColor(user.accessLevel) }}
                >
                  {getAccessLevelLabel(user.accessLevel)}
                </span>
              </div>

              {user.facultyName && (
                <>
                  <p className={styles.label}>Faculty Name:</p>
                  <p className={styles.value}>{user.facultyName}</p>
                </>
              )}

              {user.email && (
                <>
                  <p className={styles.label}>Email:</p>
                  <p className={styles.value}>{user.email}</p>
                </>
              )}
            </div>
          </div>

          {(user.accessLevel === 1 || user.accessLevel === 2) && (
            <button
              className={styles.reportsButton}
              onClick={() => {
                navigate('/reports');
                setIsOpen(false);
              }}
            >
              <BarChart3 size={18} />
              <span>Reports & Analytics</span>
            </button>
          )}

          <button className={styles.logoutButton} onClick={handleLogout}>
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      )}

      {isOpen && (
        <div
          className={styles.backdrop}
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default UserMenu;
