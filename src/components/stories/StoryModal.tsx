"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import CustomButton from "@/components/common/Button";
import { X, Clock5, Gift } from "lucide-react";
import { balloons } from "balloons-js";

type Story = {
  title: string;
  author: string;
  authorImage: string;
  timeToRead: string;
  url: string;
  contentSnippet?: string;
};

type ModalType = "snippet" | "unlocked" | "perks";

interface StoryModalProps {
  isOpen: boolean;
  onCloseAction: () => void;
  type: ModalType;
  story?: Story;
}

export default function StoryModal({
  isOpen,
  onCloseAction,
  type,
  story,
}: StoryModalProps) {
  const balloonContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (type === "unlocked" && isOpen && balloonContainerRef.current) {
      balloonContainerRef.current.innerHTML = "";
      // @ts-ignore
      balloons({
        container: balloonContainerRef.current,
        count: 15,
        colors: ["#FFD166", "#EF476F", "#06D6A0", "#118AB2"],
        size: 40,
        gravity: 0.2,
      });
    }
  }, [type, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-150 px-4">
      <div className="relative">
        {/* Modal card */}
        <div className="bg-[#FFEEBA] text-[#141414] p-6 sm:p-8 w-full max-w-lg relative shadow-xl border border-[#141414]">
          {/* Balloon canvas container */}
          {type === "unlocked" && (
            <div
              ref={balloonContainerRef}
              className="absolute inset-0 pointer-events-none z-0"
            />
          )}

          <div className="relative z-10">
            {/* Snippet Modal */}
            {type === "snippet" && story && (
              <>
                <h2 className="font-bold text-xl sm:text-2xl mb-4">
                  {story.title}
                </h2>
                <div className="flex items-center gap-2 mb-4">
                  <div className="bg-[#141414] p-1 rounded-lg flex items-center gap-2">
                    <Image
                      src={`${story.authorImage}`}
                      alt={story.author}
                      width={32}
                      height={32}
                      className="rounded-full"
                    />
                    <span className="text-sm font-semibold text-white">
                      {story.author}
                    </span>
                  </div>
                  <span className="flex items-center text-sm ml-auto gap-1">
                    <Clock5 size={16} />
                    {story.timeToRead}
                  </span>
                  <CustomButton
                    text="Perks"
                    icon={Gift}
                    onClick={() => console.log("Viewing perks")}
                    className="rounded-lg border-none bg-[#FFDE7A] hover:bg-[#ffd07a] active:bg-yellow-600 focus:ring-[#ffe79d] text-[18px] text-[#141414]"
                  />
                </div>

                <p className="text-sm leading-relaxed mb-6">
                  {story.contentSnippet
                    ? story.contentSnippet
                    : "This is a snippet of the story. Click below to read the full story."}
                </p>

                <div className="flex justify-center">
                  <CustomButton
                    text="Read full story"
                    onClick={() => console.log("Reading full story")}
                    className="justify-center"
                  />
                </div>
              </>
            )}

            {/* Unlocked Modal */}
            {type === "unlocked" && story && (
              <div className="text-center">
                <h2 className="font-bold text-xl mt-4">{story.title}</h2>
                <p className="mt-2 text-sm font-medium">
                  is now unlocked and ready to read.
                </p>

                <CustomButton
                  text="Start reading"
                  onClick={() => console.log("Start reading")}
                  className="mt-6 w-full justify-center"
                />
              </div>
            )}

            {/* Perks Modal */}
            {type === "perks" && (
              <div className="flex flex-col max-h-[70vh]">
                <h2 className="font-bold text-xl text-center mb-1">
                  Token Holder Perks
                </h2>
                <p className="text-sm text-center mb-4">
                  Unlock exclusive benefits
                </p>

                <div
                  className="overflow-y-auto space-y-4 pr-2"
                  style={{
                    flex: 1,
                    scrollbarWidth: "none",
                    msOverflowStyle: "none",
                  }}
                >
                  <style jsx>{`
                    div::-webkit-scrollbar {
                      display: none;
                    }
                  `}</style>

                  {[
                    {
                      label: "VIP Status",
                      desc: "Priority access to all new content and features",
                    },
                    {
                      label: "Live Events",
                      desc: "Exclusive invitations to webinars and live sessions",
                    },
                    {
                      label: "Custom Content",
                      desc: "Request specific topics and get personalized content",
                    },
                    {
                      label: "Live Events",
                      desc: "Exclusive invitations to webinars and live sessions",
                    },
                    {
                      label: "And More",
                      desc: "Yep, the list goes on.",
                    },
                  ].map((perk, i) => (
                    <div
                      key={i}
                      className="bg-yellow-200 p-3 rounded-xl shadow-sm"
                    >
                      <div className="font-semibold">{perk.label}</div>
                      <div className="text-sm">{perk.desc}</div>
                    </div>
                  ))}
                </div>

                <CustomButton
                  text="Got it!"
                  onClick={onCloseAction}
                  className="w-full justify-center mt-4"
                />
              </div>
            )}
          </div>
        </div>

        {/* Close button at bottom center */}
        <button
          onClick={onCloseAction}
          className="absolute left-1/2 text-black translate-x-[-50%] top-full mt-4 w-10 h-10 rounded-full bg-[#FFEEBA] border border-[#141414] flex items-center justify-center shadow-md hover:text-red-600 transition-all z-10"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
}