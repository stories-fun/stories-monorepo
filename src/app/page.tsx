import Image from "next/image";
import Carousel from "@/components/common/Carousel";

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
  return (
    <div className="min-h-screen bg-[#141414] flex flex-col items-center">
      {/* Logo Section */}
      <div className="w-full max-w-[1400px] mt-16 sm:mt-[200px] flex justify-center">
        <Image
          src="/stories_logo_large.svg"
          alt="Stories Logo"
          width={600}
          height={200}
          priority
        />
      </div>

      {/* Circle Images and Text Section */}
      <section className="mt-16 sm:mt-[200px] flex flex-col items-center text-center max-w-[700px] px-6">
        {/* Row of Circles */}
        <div className="flex items-center justify-center gap-6 mb-[90px]">
          <div className="w-16 h-16 sm:w-24 sm:h-24 relative">
            <Image src="/Ellipse 58.svg" alt="Purple Circle" fill />
          </div>
          <div className="w-16 h-16 sm:w-24 sm:h-24 relative rounded-full overflow-hidden">
            <Image src="/lady_image.svg" alt="Lady" fill className="object-cover" />
          </div>
          <div className="w-16 h-16 sm:w-24 sm:h-24 relative">
            <Image src="/Ellipse 57.svg" alt="Red Circle" fill />
          </div>
        </div>

        <section className="text-center px-4 py-16 sm:py-24 ">
  {/* Heading */}
  <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight mb-6">
    every life is a story.<br />what&apos;s yours<span className="text-white">?</span>
  </h1>

  {/* Styled Subtext */}
  <p className="text-base sm:text-lg md:text-xl text-[#4A4A4A] max-w-3xl mx-auto font-medium leading-relaxed">
    We help Individuals and Businesses tell stories and form meaningful connections.
    Let your authentic story become your Social Identity. Share your journey. Discover others.
    Social Media that Invests in truth.
  </p>
</section>

      </section>

      {/* Carousel Section */}
      <section className="mt-16 sm:mt-[200px] w-full max-w-[1400px] px-4">
        <Carousel items={sampleCarouselItems} />
      </section>
      

      {/* image Section group 24.png */}
      <section className="mt-16 sm:mt-[200px] mb-16 sm:mb-[200px] w-full flex justify-center">
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