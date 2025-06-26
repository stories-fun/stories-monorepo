"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { motion, useMotionValue, useSpring } from "framer-motion";
import CustomButton from "./Button";
import { cn } from "~/lib/utils";

const START_INDEX = 1;

export interface CarouselItem {
  title: string;
  url: string;
  image: string;
  id?: string | number;
}

interface CarouselProps {
  items: CarouselItem[];
  className?: string;
  startIndex?: number;
}

export default function Carousel({
  items,
  className = "",
  startIndex = START_INDEX,
}: CarouselProps) {
  const containerRef = useRef<HTMLUListElement>(null);
  const itemsRef = useRef<(HTMLLIElement | null)[]>([]);
  const [activeSlide, setActiveSlide] = useState(startIndex);
  const offsetX = useMotionValue(0);
  const animatedX = useSpring(offsetX, {
    damping: 20,
    stiffness: 150,
  });

  function centerSlide(index: number) {
    const container = containerRef.current;
    const item = itemsRef.current[index];
    if (!container || !item) return;

    const containerWidth = container.offsetWidth;
    const itemOffsetLeft = item.offsetLeft;
    const itemWidth = item.offsetWidth;
    const newOffset = containerWidth / 2 - (itemOffsetLeft + itemWidth / 2);

    offsetX.set(newOffset);
    setActiveSlide(index);
  }

  useEffect(() => {
    centerSlide(startIndex);
  }, [startIndex]);

  return (
    <div className={cn("container mx-auto px-4 sm:px-6", className)}>
      <div className="relative overflow-hidden">
        <motion.ul
          ref={containerRef}
          className="flex items-start w-full"
          style={{ x: animatedX }}
        >
          {items.map((item, index) => {
            const active = index === activeSlide;
            return (
              <motion.li
                layout
                key={item.id || item.title}
                ref={(el) => {
                  itemsRef.current[index] = el;
                }}
                className={cn(
                  "relative shrink-0 select-none px-2 sm:px-3 transition-opacity duration-300 w-full sm:w-auto",
                  !active && "opacity-30"
                )}
                style={{
                  flexBasis: active ? "60%" : "40%",
                }}
              >
                <Link
                  href={item.url}
                  className="block w-full"
                  target="_blank"
                  rel="noopener noreferrer"
                  draggable={false}
                >
                  {/* Title centered over the image */}
                  {active && (
<div className="flex justify-center mb-2">
  <div className="relative inline-block bg-white px-10 py-4 font-extrabold text-2xl text-black">
    {item.title}
  </div>
</div>


                  )}

                  <div
                    className={cn(
                      "relative w-full overflow-hidden bg-[#141414]",
                      active ? "aspect-[5/3]" : "aspect-[4/3]"
                    )}
                  >
                    {/* Image background */}
                    <img
                      src={item.image}
                      alt={item.title}
                      className="absolute inset-0 h-full w-full object-cover"
                      draggable={false}
                    />

                    {/* Button centered at the bottom of the image */}
                    {active && (
                      <div className="absolute bottom-[5px] left-1/2 z-20 -translate-x-1/2">
                        <CustomButton text="Unlock story" />
                      </div>
                    )}
                  </div>
                </Link>
              </motion.li>
            );
          })}
        </motion.ul>

        {/* Stick-style dots — hidden on mobile */}
        <div className="my-6 hidden sm:flex justify-center gap-2">
          {items.map((_, index) => (
            <button
              key={index}
              onClick={() => centerSlide(index)}
              className={cn(
                "h-1 w-6 transition-colors duration-300",
                index === activeSlide ? "bg-white" : "bg-white/30",
                "cursor-pointer"
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
