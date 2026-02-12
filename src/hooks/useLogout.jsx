// src/hooks/useLogout.js
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export function useLogout() {
  const { logout } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    logout();
    setShowLogoutConfirm(false);
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  return {
    showLogoutConfirm,
    handleLogout,
    confirmLogout,
    cancelLogout
  };
}