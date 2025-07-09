"use client";

import { useEffect, useState } from "react";
import { Book, ShoppingCart, User, BarChart3 } from "lucide-react";
import { MiniCard } from "@/components/MiniCard";
import { TransactionTable } from "@/components/TransactionTable";
import { Profile } from "@/components/Profile";
import { Read } from "@/components/Reading";

// Sample data
const stories = [
  { image: "/lion.webp", title: "The Fairy Tale", price: 10.0, change: 4.5 },
  { image: "/lion.webp", title: "Cars", price: 15.0, change: 2.0 },
  { image: "/lion.webp", title: "The Butterfly Effect", price: 12.0, change: -1.5 },
  { image: "/lion.webp", title: "The Butterfly Effect", price: 12.0, change: -1.5 },
  { image: "/lion.webp", title: "The Butterfly Effect", price: 12.0, change: -1.5 },
  { image: "/lion.webp", title: "The Butterfly Effect", price: 12.0, change: -1.5 },
  { image: "/lion.webp", title: "The Butterfly Effect", price: 12.0, change: -1.5 },
  { image: "/lion.webp", title: "The Butterfly Effect", price: 12.0, change: -1.5 },
];

const transactions = [
  {
    storyTitle: "The Fairy Tale",
    price: "$10.00",
    date: "2023-01-01",
    txns: "https://example.com/txn/1",
  },
  {
    storyTitle: "Cars",
    price: "$15.00",
    date: "2023-01-02",
    txns: "https://example.com/txn/2",
  },
  {
    storyTitle: "The Butterfly Effect",
    price: "$12.00",
    date: "2023-01-03",
    txns: "https://example.com/txn/3",
  },
  {
    storyTitle: "The Butterfly Effect",
    price: "$12.00",
    date: "2023-01-03",
    txns: "https://example.com/txn/3",
  },
];

const UserProfile = {
  username: "stories",
  walletAddress: "0x1234567890abcdef1234567890abcdef12345678",
};

const StoriesRead = {
  storiesRead: 28,
  readingStreak: 15,
};

// Hook to determine how many columns based on screen size
function useBreakpoint() {
  const [columns, setColumns] = useState(2); // default mobile

  useEffect(() => {
    function updateColumns() {
      const width = window.innerWidth;
      if (width >= 1024) setColumns(5); // desktop
      else if (width >= 640) setColumns(3); // tablet
      else setColumns(2); // mobile
    }

    updateColumns();
    window.addEventListener("resize", updateColumns);
    return () => window.removeEventListener("resize", updateColumns);
  }, []);

  return columns;
}

export default function ProfilePage() {
  const [showAll, setShowAll] = useState(false);
  const columns = useBreakpoint();

  const visibleStories = showAll ? stories : stories.slice(0, columns);

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
          {stories.length > columns && (
            <button
              className="text-[#FFF6C9] text-sm font-bold"
              onClick={() => setShowAll(!showAll)}
            >
              {showAll ? "View Less" : "View All"}
            </button>
          )}
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-2 mt-[40px] mb-6 sm:mb-10 px-4">
          {visibleStories.map((story, index) => (
            <div key={index} className="flex flex-col">
              <MiniCard {...story} />
            </div>
          ))}
        </div>

        {/* Transaction Table and Profile with Titles */}
        <div className="flex flex-col lg:flex-row gap-6 px-4 mb-6">
          {/* Transaction Table Section */}
          <div className="w-full lg:w-2/3 order-1 lg:order-none">
            {/* Purchases Title */}
            <div className="flex items-center gap-x-5 sm:gap-x-7 mb-4">
              <ShoppingCart size={28} className="text-white" />
              <h1 className="text-white text-[20px] sm:text-[28px] font-bold">
                Purchases
              </h1>
            </div>
            <TransactionTable transactions={transactions} />
          </div>

          {/* Profile Section */}
          <div className="w-full lg:w-1/3 order-2 lg:order-none">
            {/* Profile Title */}
            <div className="flex items-center gap-x-5 sm:gap-x-7 mb-4 mt-6 lg:mt-0">
              <User size={28} className="text-white" />
              <h1 className="text-white text-[20px] sm:text-[28px] font-bold">
                Profile
              </h1>
            </div>
            <Profile
              username={UserProfile.username}
              walletAddress={UserProfile.walletAddress}
            />

            {/* Reading Stats Section */}
            <div className="sm:mt-0 sm:mb-0 mt-4 mb-6">
              <div className="flex items-center gap-x-5 sm:gap-x-7 mb-4 mt-6 lg:mt-0">
                <BarChart3 size={28} className="text-white" />
                <h1 className="text-white text-[20px] sm:text-[28px] font-bold">
                  Reading Stats
                </h1>
              </div>
              <Read {...StoriesRead} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
