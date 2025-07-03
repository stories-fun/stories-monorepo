"use client";

import { useState } from "react";
import { Book } from "lucide-react";
import { MiniCard } from "@/components/MiniCard";

const stories = [
  { image: "/lion.webp", title: "The Fairy Tale" },
  { image: "/lion.webp", title: "Cars" },
  { image: "/lion.webp", title: "Cars" },
  { image: "/lion.webp", title: "The Butterfly Effect" },
  { image: "/lion.webp", title: "The Butterfly Effect" },
  { image: "/lion.webp", title: "The Butterfly Effect" },
  { image: "/lion.webp", title: "The Butterfly Effect" },
  { image: "/lion.webp", title: "The Butterfly Effect" },
  { image: "/lion.webp", title: "The Butterfly Effect" },
];

export default function ProfilePage() {
  const [showAll, setShowAll] = useState(false);

  // Show only the first 5 stories if showAll is false
  const visibleStories = showAll ? stories : stories.slice(0, 5);

  return (
    <div className="min-h-screen bg-[#141414] flex flex-col items-center">
      <div className="w-full max-w-[1400px]">
        {/* Title Row */}
        <div className="flex items-center justify-between mb-6 mt-6 px-4">
          <div className="flex items-center gap-x-5 sm:gap-x-7">
            <Book size={28} className="text-white" />
            <h1 className="text-white text-[20px] sm:text-[28px] font-bold">
              My Library
            </h1>
          </div>

          {/* View All Button (visible on all screens now) */}
          {stories.length > 5 && (
            <button
              className="text-[#FFF6C9] text-sm font-bold"
              onClick={() => setShowAll(!showAll)}
            >
              {showAll ? "View Less" : "View All"}
            </button>
          )}
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 mt-[40px] mb-16 sm:mb-[200px] px-4">
          {visibleStories.map((story, index) => (
            <div key={index} className="flex flex-col">
              <MiniCard {...story} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
