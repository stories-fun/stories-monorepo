"use client";
import React, { useState, useEffect, useRef } from "react";

const ModernVideoSection = ({ scrollPosition = 0 }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);


  useEffect(() => {
    // Simulate loading
    const timeout = setTimeout(() => setIsLoaded(true), 1000);
    return () => clearTimeout(timeout);
  }, []);

  const enterFullscreen = () => {
    const container = containerRef.current;
    if (container?.requestFullscreen) {
      container.requestFullscreen();
    }
  };

  return (
    <div className="min-h-screen bg-[#141414] flex flex-col items-center justify-center p-4">
      <div
        className="relative w-full max-w-4xl transition-all duration-1000 ease-out"
        style={{
          transform: `translateY(${scrollPosition > 400 ? "0" : "20px"})`,
          opacity: scrollPosition > 400 ? 1 : 0.8,
        }}
      >
        {/* Glowing Border */}
        <div className="absolute -inset-1 bg-gradient-to-r from-[#FFF6C9] via-[#f0d54e] to-[#dab810] rounded-2xl blur opacity-30 animate-pulse" />

        <div
          ref={containerRef}
          className="relative bg-black/20 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
        >
          {/* Responsive Aspect Ratio Box (16:9) */}
          <div className="relative w-full pt-[56.25%]"> {/* 16:9 aspect ratio */}
            <iframe
              className="absolute top-0 left-0 w-full h-full rounded-2xl"
              src="https://www.youtube.com/embed/9zfQ3J67AZ8?rel=0&showinfo=0&autoplay=0&mute=1&modestbranding=1"
              title="Stories Trailer"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              loading="lazy"
            ></iframe>
          </div>

          {/* Loading Overlay */}
          {!isLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
              <div className="flex items-center space-x-2 text-white">
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span className="text-sm">Loading...</span>
              </div>
            </div>
          )}
        </div>

        {/* Ambient Glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#FFF6C9]/20 via-[#f0d54e]/20 to-[#dab810]/20 rounded-2xl blur-xl -z-10 animate-pulse" />
      </div>

      {/* Title & Description */}
      <div className="mt-8 text-center max-w-2xl">
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          Stories Trailer
        </h2>
        <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
          Experience the future of storytelling with our immersive platform.
          Discover, create, and share stories that matter.
        </p>
      </div>
    </div>
  );
};

export default ModernVideoSection;
