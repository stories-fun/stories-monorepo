"use client";

import { BookOpen, Calendar } from "lucide-react";

interface ReadProps {
  storiesRead: number;
  readingStreak: number;
}

export const Read = ({ storiesRead, readingStreak }: ReadProps) => {
  return (
    <div className="w-full bg-[#2E2E2E] rounded-2xl overflow-hidden">
      {/* Stories Read Section - First Row */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#141414]">
        <span className="text-white text-lg font-medium">
          Stories read
        </span>
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-[#FFF6C9]" />
          <span className="text-white text-lg font-medium">
            {storiesRead}
          </span>
        </div>
      </div>
      

      
      {/* Reading Streak Section */}
      <div className="flex items-center justify-between px-6 py-4">
        <span className="text-white text-lg font-medium">
          Reading Streak
        </span>
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-[#FFF6C9]" />
          <span className="text-white text-lg font-medium">
            {readingStreak} Days
          </span>
        </div>
      </div>
    </div>
  );
};