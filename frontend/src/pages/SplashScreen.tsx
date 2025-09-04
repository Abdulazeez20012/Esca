import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Fingerprint } from 'lucide-react';

// Dummy avatar URLs for the animation
const avatars = [
    'https://i.pravatar.cc/150?u=a042581f4e29026704d',
    'https://i.pravatar.cc/150?u=a042581f4e29026705d',
    'https://i.pravatar.cc/150?u=a042581f4e29026706d',
    'https://i.pravatar.cc/150?u=a042581f4e29026707d',
    'https://i.pravatar.cc/150?u=a042581f4e29026708d',
    'https://i.pravatar.cc/150?u=a042581f4e29026709d',
    'https://i.pravatar.cc/150?u=a042581f4e2902670ad',
    'https://i.pravatar.cc/150?u=a042581f4e2902670bd',
];

const SplashScreen: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/dashboard');
    }, 4000); // Increased delay to 4s to enjoy animation

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const radius = 150; // Radius of the orbit in pixels
  const angleStep = 360 / avatars.length;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black overflow-hidden">
      <div className="relative flex flex-col items-center justify-center text-center">

        {/* Animation Container */}
        <div className="relative w-[360px] h-[360px] flex items-center justify-center">
          
          {/* Decorative Rings */}
          <div className="absolute w-full h-full border-2 border-pink-500/30 rounded-full animate-spin-slow-reverse"></div>
          <div className="absolute w-[260px] h-[260px] border-2 border-pink-500/50 rounded-full animate-spin-slow"></div>

          {/* Central Logo */}
          <div className="absolute">
            <Fingerprint className="w-24 h-24 text-pink-400 animate-pulse-glow" />
          </div>

          {/* Avatar Orbiting Container */}
          <div className="absolute w-full h-full animate-spin-slow">
            {avatars.map((avatarUrl, index) => {
              const angle = angleStep * index;
              return (
                <div
                  key={index}
                  className="absolute w-12 h-12 top-1/2 left-1/2 -mt-6 -ml-6"
                  style={{
                    // Set initial position on the circle
                    transform: `rotate(${angle}deg) translateY(-${radius}px)`,
                  }}
                >
                  <img
                    src={avatarUrl}
                    alt={`User avatar ${index + 1}`}
                    className="w-full h-full rounded-full object-cover border-2 border-pink-500/50 shadow-lg shadow-pink-500/20 animate-spin-slow-reverse-synced"
                    style={{
                      // Counter-rotate against the initial static rotation to keep it upright at the start
                      transform: `rotate(-${angle}deg)`,
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>
        
        <h1 className="relative text-5xl font-bold text-white tracking-widest mt-12">ESCA</h1>
        <p className="relative text-gray-300 mt-2">Secure Escrow Swaps on the Blockchain</p>
      </div>
    </div>
  );
};

export default SplashScreen;