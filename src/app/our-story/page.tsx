"use client";

import Image from "next/image";
import { useState } from "react";
import { CustomCard } from "@/components/Card";
import StoryModal from "@/components/StoryModal";

const stories = [
  {
    image: "/lion.webp",
    title: "The Fairy Tale",
    url: "/stories/the-fairy-tale",
    timeToRead: "5 mins",
    price: 43.3,
    change: +4.5,
    author: "Tiffany Fong",
    authorImage: "lady_image.svg",
    contentSnippet:
      "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged.",
  },
  {
    image: "/lion.webp",
    title: "Cars",
    url: "/stories/cars-1",
    timeToRead: "5 mins",
    price: 43.3,
    change: -4.5,
    author: "Tiffany Fong",
    authorImage: "lady_image.svg",
    contentSnippet:
      "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged.",
  },
  {
    image: "/lion.webp",
    title: "Cars",
    url: "/stories/cars-2",
    timeToRead: "5 mins",
    price: 43.3,
    change: -4.5,
    author: "Tiffany Fong",
    authorImage: "lady_image.svg",
    contentSnippet:
      "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged.",
  },
  {
    image: "/lion.webp",
    title: "The Butterfly Effect",
    url: "/stories/the-butterfly-effect",
    timeToRead: "5 mins",
    price: 43.3,
    change: +4.5,
    author: "Tiffany Fong",
    authorImage: "lady_image.svg",
    contentSnippet:
      "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged.",
  },
];

export default function OurStory() {
  const [selectedStory, setSelectedStory] = useState<any | null>(null);
  const [modalType, setModalType] = useState<
    "snippet" | "unlocked" | "perks" | null
  >(null);

  const openModal = (story: any, type: "snippet" | "unlocked" | "perks") => {
    setSelectedStory(story);
    setModalType(type);
  };

  const closeModal = () => {
    setSelectedStory(null);
    setModalType(null);
  };

  return (
    <div className="min-h-screen bg-[#141414] flex flex-col items-center">
      {/* STORIES Logo */}
      <div className="w-full max-w-[1400px] mt-16 sm:mt-[200px] flex justify-center">
        <Image
          src="/STORIES.svg"
          alt="Stories Logo"
          width={400}
          height={100}
          priority
        />
      </div>

      {/* Card Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-16 sm:mt-[200px] mb-16 sm:mb-[200px] px-4 max-w-[1400px]">
        {stories.map((story, index) => (
          <div key={index} className="flex flex-col gap-2">
            <CustomCard
              {...story}
              onClick={() => openModal(story, "snippet")}
            />
            {/*
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => openModal(story, "unlocked")}
                className="text-xs px-2 py-1 bg-green-500 text-white rounded"
              >
                Test Unlocked
              </button>
              <button
                onClick={() => openModal(story, "perks")}
                className="text-xs px-2 py-1 bg-yellow-500 text-black rounded"
              >
                Test Perks
              </button>
            </div>
            */}
          </div>
        ))}
      </div>

      {/* Modal */}
      <StoryModal
        isOpen={!!modalType}
        onClose={closeModal}
        type={modalType as any}
        story={selectedStory}
      />
    </div>
  );
}
