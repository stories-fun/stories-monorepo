import Image from "next/image";
import { CustomCard } from "@/components/Card";

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
  },
];

export default function ourStory() {
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
          <CustomCard key={index} {...story} />
        ))}
      </div>
    </div>
  );
}
