"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import CustomButton from "./Button";

export interface CarouselItem {
  title: string;
  url: string;
  image: string;
  id?: string | number;
}

interface NewCarouselProps {
  items: CarouselItem[];
  className?: string;
}

export default function NewCarousel({
  items,
  className = "",
}: NewCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [
    Autoplay({ delay: 4000, stopOnInteraction: false }),
  ]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!emblaApi) return;

    const onSelect = () => {
      setActiveIndex(emblaApi.selectedScrollSnap());
    };

    emblaApi.on("select", onSelect);
    onSelect();

    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);

  return (
    <div className={cn("relative w-full flex flex-col items-center", className)}>
      <div className="relative w-full max-w-6xl mx-auto">
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex">
            {items.map((item, index) => (
              <div
                className="flex-grow-0 flex-shrink-0 basis-full md:basis-1/2 lg:basis-1/3 px-4"
                key={item.id ? `item-${item.id}` : `item-${index}`}
              >
                <motion.div
                  className="h-full"
                  animate={{
                    scale: activeIndex === index ? 1 : 0.85,
                    opacity: activeIndex === index ? 1 : 0.5,
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  <Link
                    href={item.url}
                    className="block w-full h-full group"
                    target="_blank"
                    rel="noopener noreferrer"
                    draggable={false}
                  >
                    <div
                      className="relative w-full h-full overflow-hidden bg-[#141414] transition-all duration-500 ease-in-out"
                      style={{ aspectRatio: "16/9" }}
                    >
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />

                      {/* Title at Top */}
                      <div className="absolute top-0 left-0 w-full bg-gradient-to-b from-black/70 to-transparent px-4 py-3 text-white">
                        <div className="relative group max-w-full">
                          <p className="text-base md:text-lg font-semibold leading-snug">
                            {item.title}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pagination Dots */}
      <div className="flex justify-center mt-8 space-x-3">
        {items.map((_, index) => (
          <button
            key={`dot-${index}`}
            onClick={() => emblaApi && emblaApi.scrollTo(index)}
            className={cn(
              "w-1 h-3 transition-all duration-300 rounded-full",
              activeIndex === index
                ? "bg-white scale-125"
                : "bg-gray-300 hover:bg-gray-400"
            )}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
