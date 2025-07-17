"use client";

import Image from "next/image";
import Carousel from "@/components/Carousel";
import { useEffect, useState } from "react";

const sampleCarouselItems = [
  {
    id: 1,
    image: "/lion.webp",
    title: "Tiffany Story",
    url: "https://medium.com/@jeyprox/building-a-fully-customisable-carousel-slider-with-swipe-gestures-navigation-and-custom-cursor-4e986ccbd08f",
  },
  {
    id: 2,
    image: "/lion.webp",
    title: "x Story",
    url: "https://medium.com/@jeyprox/building-a-fully-customisable-input-component-with-nextjs-reacthookfrom-tailwindcss-and-ts-58874a2e3450",
  },
  {
    id: 3,
    image: "/lion.webp",
    title: "Tiffany Story",
    url: "https://medium.com/@jeyprox/handling-forms-in-nextjs-with-busboy-reacthookform-and-ts-3f86c70545b3",
  },
  {
    id: 4,
    image: "/lion.webp",
    title: "Tiffany Story",
    url: "https://example.com/react-patterns",
  },
  {
    id: 5,
    image: "/lion.webp",
    title: "Tiffany Story",
    url: "https://example.com/typescript-mastery",
  },
];

export default function Home() {
  const [scrollPosition, setScrollPosition] = useState(0);

  useEffect(() => {
    const initializePosition = () => {
      if (window.innerWidth < 1000) {
        document.querySelectorAll(".transition-transform").forEach((el) => {
          const element = el as HTMLElement;
          element.classList.remove(
            "transition-transform",
            "duration-1000",
            "ease-out"
          );
          element.style.transform = "none";
        });
      }
    };

    const handleScroll = () => {
      if (window.innerWidth >= 1000) {
        setScrollPosition(window.scrollY);
      } else {
        setScrollPosition(300); // Set to the final position matching the styles
      }
    };

    const handleResize = () => {
      initializePosition();
    };

    initializePosition();
    window.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#141414] flex flex-col items-center relative overflow-hidden">
      {/* Logo Section */}
      <div className="w-full max-w-[1400px] mt-16 sm:mt-[200px] flex justify-center">
        <Image
          src="/stories_logo_large.svg"
          alt="Stories Logo"
          width={1000}
          height={200}
          priority
        />
      </div>

      {/* Circle Images and Text Section */}
      <section className="mt-16 sm:mt-[200px] flex flex-col items-center text-center max-w-[700px] px-6">
        {/* Row of Circles with Scroll Animation */}
        <div className="flex items-center justify-center gap-6 mb-[90px] relative">
          {/* Purple Circle */}
          <div
            className={`w-16 h-16 sm:w-24 sm:h-24 relative transition-transform duration-1000 ease-out`}
            style={{
              transform: `translate(${scrollPosition > 200 ? "0" : "-270px"}, ${
                scrollPosition > 200 ? "0" : "-450px"
              })`,
            }}
          >
            <Image src="/Ellipse 58.svg" alt="Purple Circle" fill />
          </div>

          {/* Lady Image */}
          <div
            className={`w-16 h-16 sm:w-24 sm:h-24 relative rounded-full overflow-hidden transition-transform duration-1000 ease-out`}
            style={{
              transform: `translate(${scrollPosition > 200 ? "0" : "170px"}, ${
                scrollPosition > 200 ? "0" : "-470px"
              })`,
            }}
          >
            <Image
              src="/lady_image.svg"
              alt="Lady"
              fill
              className="object-cover"
            />
          </div>

          {/* Red Circle */}
          <div
            className={`w-16 h-16 sm:w-24 sm:h-24 relative transition-transform duration-1000 ease-out`}
            style={{
              transform: `translate(${scrollPosition > 200 ? "0" : "-270px"}, ${
                scrollPosition > 200 ? "0" : "-350px"
              })`,
            }}
          >
            <Image src="/Ellipse 57.svg" alt="Red Circle" fill />
          </div>
        </div>

        {/* Styled Text with Scroll Animation */}
        <p
          className={`text-white text-[20px] font-black leading-[132%] tracking-[-0.03em] text-center transition-transform duration-1000 ease-out`}
          style={{
            transform: `translateY(${scrollPosition > 300 ? "0" : "8px"})`,
          }}
        >
          Lorem Ipsum is simply dummy text of the printing and typesetting
          industry. Lorem Ipsum has been the industry's standard dummy text ever
          since the 1500s, when an unknown printer took a galley of type
        </p>
      </section>

      {/* Trailer video section */}
      <section className="mt-16 sm:mt-[200px] w-full max-w-[1400px] px-4 flex justify-center">
        <div className="relative w-full max-w-[700px] h-[340px] sm:h-[400px]">
          <iframe
            width="100%"
            height="100%"
            src="https://www.youtube.com/embed/9zfQ3J67AZ8"
            title="Stories Trailer"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
      </section>

      {/* Carousel Section with Scroll Animation */}
      <section
        className={`mt-16 sm:mt-[200px] w-full max-w-[1400px] px-4 transition-transform duration-1000 ease-out`}
        style={{
          transform: `translateY(${scrollPosition > 400 ? "0" : "8px"})`,
        }}
      >
        <Carousel items={sampleCarouselItems} />
      </section>

      {/* Image Section group 24.png with Scroll Animation */}
      <section
        className={`mt-16 sm:mt-[200px] mb-16 sm:mb-[200px] w-full flex justify-center transition-transform duration-1000 ease-out`}
        style={{
          transform: `translateY(${scrollPosition > 500 ? "0" : "8px"})`,
        }}
      >
        <div className="relative w-full h-[340px] sm:h-[400px]">
          <Image
            src="/Group 24.png"
            alt="Group 24"
            fill
            className="object-contain"
          />
        </div>
      </section>
    </div>
  );
}
