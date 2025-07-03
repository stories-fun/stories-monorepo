"use client";

import Image from "next/image";

interface MiniCardProps {
  image: string;
  title: string;
}

export function MiniCard({ image, title }: MiniCardProps) {
  return (
    <div className="relative overflow-hidden text-white max-w-[210px] w-full h-[320px] flex flex-col">
      {/* Folded corner */}
      <div className="absolute top-[-1px] right-0 w-10 h-10 z-1">
        <div
          className="absolute top-0 right-0 w-full h-full shadow-md"
          style={{ clipPath: "polygon(100% 100%, 1000% 0%, 0% 0%)" }}
        />
        <div
          className="absolute top-0 right-0 w-full h-full border-l border-b bg-[#141414] shadow-md"
          style={{ clipPath: "polygon(100% 100%, 1000% 0%, 0% 0%)" }}
        />
        <div
          className="absolute top-0 right-0 w-full h-full bg-[#FFF6C9] shadow-md"
          style={{ clipPath: "polygon(0% 0%, 0% 100%, 100% 100%)" }}
        />
        <div
          className="absolute top-0 right-0 w-full h-full border-l border-b border-[#141414] bg-[#FFF6C9] shadow-md"
          style={{ clipPath: "polygon(0% 0%, 0% 100%, 100% 100%)" }}
        />
      </div>

      {/* Image with author overlay */}
      <div className="relative w-full h-64">
        <Image src={image} alt={title} fill className="object-cover" />
      </div>

      {/* Content */}
      <div className="wavyimage z-1 absolute bottom-8 left-0 w-full ">
      <div className="bg-[#FFF6C9] text-[#141414] py-4 flex items-center justify-center px-4 h-[56px] mt-1">
        <h3 className="font-extrabold text-[16px] text-center leading-snug break-words">
          {title}
        </h3>
        </div>
      </div>
    </div>
  );
}
