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

        {/* Styled Text */}
        <p className="text-white text-[20px] font-black leading-[132%] tracking-[-0.03em] text-center">
          Lorem Ipsum is simply dummy text of the printing and typesetting industry.
          Lorem Ipsum has been the industry's standard dummy text ever since the 1500s,
          when an unknown printer took a galley of type
        </p>
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