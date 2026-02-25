import React, { useState } from 'react';
import AuthModal from './sc/AuthModal';
import loginLanding from '@/assets/login-landing.jpg';

export default function LandingGate() {
  const [showAuthModal, setShowAuthModal] = useState(false);

  return (
    <div
      className="min-h-screen w-full bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url(" + loginLanding + ")" }}
    >
      <div className="min-h-screen w-full flex items-center justify-center bg-black/20 p-6">
        <div className="w-full max-w-md text-center">

          <img
            src={import.meta.env.BASE_URL + 'icons/ll-developer-logo-v2.png'}
            alt="Long Line Diary"
            className="mx-auto w-72 md:w-96 object-contain cursor-pointer opacity-40 hover:opacity-70 transition-opacity duration-500"
            onClick={() => setShowAuthModal(true)}
          />

          <AuthModal
            open={showAuthModal}
            onClose={() => setShowAuthModal(false)}
          />

        </div>
      </div>
    </div>
  );
}
