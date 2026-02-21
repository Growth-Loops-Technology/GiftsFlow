"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";

export function useAuthCheck() {
  const { data: session, status } = useSession();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [onAuthenticatedCallback, setOnAuthenticatedCallback] = useState<(() => void) | null>(null);

  const checkAuth = (onAuthenticated?: () => void) => {
    if (!session?.user) {
      if (onAuthenticated) {
        setOnAuthenticatedCallback(() => onAuthenticated);
      }
      setShowAuthModal(true);
      return false;
    }
    return true;
  };

  const closeAuthModal = () => {
    setShowAuthModal(false);
    setOnAuthenticatedCallback(null);
  };

  const handleAuthenticated = () => {
    if (onAuthenticatedCallback) {
      onAuthenticatedCallback();
    }
    closeAuthModal();
  };

  return {
    isLoggedIn: !!session?.user,
    session,
    status,
    showAuthModal,
    checkAuth,
    closeAuthModal,
    handleAuthenticated,
  };
}
