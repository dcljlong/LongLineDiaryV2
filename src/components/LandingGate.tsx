import React, { useState } from 'react';
import AuthModal from './sc/AuthModal';

export default function LandingGate() {
  const [showAuthModal, setShowAuthModal] = useState(false);

  return (
    <div className="w-full max-w-md text-center">
      <button
        type="button"
        className="w-full flex items-center justify-center"
        onClick={() => setShowAuthModal(true)}
        aria-label="Open sign in"
      >
        <img
          src={import.meta.env.BASE_URL + 'icons/ll-developer-logo-v2.png'}
          alt="Long Line Diary"
          className="mx-auto w-64 md:w-80 object-contain opacity-60 hover:opacity-100 transition-opacity duration-400 ease-out"
        />
      </button>

      <AuthModal
        open={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  );
}


