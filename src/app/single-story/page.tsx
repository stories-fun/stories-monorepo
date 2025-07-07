"use client";

import { useState } from "react";
import { SingleStory, ThemeContext } from "@/components/SingleStrory";
import CustomButton from "@/components/Button";

export default function SingleStoryPage() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  const toggleTheme = () =>
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  const [comments, setComments] = useState([
    {
      userImage: "/lady_image.svg",
      userName: "Toffani.ok",
      comment: "Ultricies ultricies interdum dolor sodales...",
      createdAt: "6h",
      replies: [
        {
          userImage: "/lady_image.svg",
          userName: "Toffani.ok",
          comment: "Ultricies ultricies interdum...",
          createdAt: "6h",
        },
      ],
    },
  ]);

  const handleNewComment = (text: string) => {
    if (!text.trim()) return;
    setComments([
      ...comments,
      {
        userImage: "/lady_image.svg",
        userName: "You",
        comment: text,
        createdAt: "Just now",
        replies: [],
      },
    ]);
  };

  const handleReplySubmit = (commentId: string, text: string) => {
    if (!text.trim()) return;

    setComments((prev) =>
      prev.map((c, i) => {
        const id = `comment-${i}`;
        if (id === commentId) {
          return {
            ...c,
            replies: [
              ...(c.replies || []),
              {
                userImage: "/lady_image.svg",
                userName: "You",
                comment: text,
                createdAt: "now",
              },
            ],
          };
        }
        return c;
      })
    );
  };

  return (
    <div className="min-h-screen bg-[#141414] flex flex-col items-center justify-center">
      <div className="w-full max-w-[1400px] flex justify-center items-center px-4">
        {/* Theme Context Provider wraps SingleStory */}
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
          <SingleStory
            title="From Witnessing Murder to Training the Most Famous Man in Crypto: My Journey from Pain to Power"
            timeToRead="5 mins"
            price={43.3}
            change={4.5}
            author="Tiffany Fong"
            authorImage="/lady_image.svg"
            storyContent="

<p>I was raised by a single mom in Section 8 housing. By 11, I’d seen people shot. By 14, I was working multiple jobs just to stop asking her for money.</p>

<p>From dodging bullets to winning coach of the year, I turned pain into passion.</p>

<p>Crypto wasn’t my plan—but it became my path. So did strength training, teaching underserved kids, and now building <strong>PILT</strong>: a Web3-powered health movement.</p>

<p>Bangkok is home, but the mission is global.</p>

<p><em>Want to know how I coached NFL-bound athletes, traded NFTs with Ansem, and still dream of ocean cleanup and free fitness for all?</em></p>

<p>This is my story—and if you’ve ever felt trapped, I promise: there’s always a way out.</p>

<h2>Where It Started</h2>

<p>I was 11 when I saw someone get shot right next to me. A stray bullet. Wrong place, wrong time. At the time, I froze. Not from fear—but from the realization that surviving was never guaranteed where I grew up.</p>

<p>Born and raised in North Carolina, I’m the oldest of nine, raised by a single mom grinding through Section 8 housing. My father was “in the streets.” I was hustling by age 11—washing cars, mowing lawns, working at Food Lion by 14—just so I wouldn’t have to ask my mom for a phone.</p>

<p>We didn’t save money. We spent it to survive.</p>

<p>The house got shot up four times. I was there for two. That was the breaking point. I moved back to my mom’s place and swore: this won’t be my life.</p>

<h2>Discovering Strength</h2>

<p>A new high school gave me a glimpse of another world—less violence, better facilities, and a coach who brought in an NFL strength trainer. It blew my mind. We went from losing every game to going undefeated. I realized: with the right system, you can transform anything—body, mindset, future.</p>

<p>That’s when I found strength training. And it became my way out.</p>

<h2>Becoming a Coach</h2>

<p>I pursued sports medicine in college, interned from year one, and by year three, I was managing teams solo. I trained middle schoolers, high schoolers, college kids, and pro athletes. In 2021, I won Coach of the Year and started a sand volleyball clinic that united competing programs under one mission: train the kids, not your egos.</p>

<h2>Discovering Crypto and Leaving the U.S.</h2>

<p>Meanwhile, I was dabbling in crypto—an old ETH + Cardano wallet suddenly ballooned in 2021. NFTs took over. I was in the trenches: OK Bears, Trippin Apes, Astros.</p>

<p>I minted and sold the top. That gave me a taste of freedom. And then… I left the U.S. I moved to Thailand.</p>

<h2>Launching PILT</h2>

<p>I rebranded my fitness business as <strong>PILT</strong>—a holistic wellness company for Web3 founders and communities. No fluff. No bloat. Just strength, mobility, nutrition, breath. I worked with NFT whales, DAO founders, and people flying across the world needing to feel human again.</p>

<p>One of them was <strong>Ansem</strong>. We trained together before his fight. I didn’t train him to win—I trained him to move better.</p>

<h2>The Crash</h2>

<p>Bangkok became home. But then came the crash. Crypto tanked. A predatory housing clause back home wiped out most of my savings. My job with Bangkok’s kids got shut down due to visa issues. I was broke, broken, and stuck. Couldn’t even afford a ticket home. That was my lowest.</p>

<h2>Rising Again</h2>

<p>But pressure makes diamonds. I kept grinding. Refocused. Rebuilt.</p>

<p>Today, <strong>PILT</strong> is expanding globally. My dream? To have fitness activations at every major crypto conference—and one day, build a world-class facility where underserved communities get access to elite training for free.</p>

<p>I’m not where I want to be yet. But I’m closer than I’ve ever been.</p>

<p>I don’t train just for muscles—I train for freedom. And I trade not just coins—I trade survival for sovereignty.</p>

<h2>Final Words</h2>

<p>So if you’re building something soulful and brave—know this:</p>

<p><strong>You don’t need to be loud to be legendary.<br>
You don’t need permission to start.<br>
And no matter how far gone you feel—there’s always a way out.</strong></p>

<p><strong>My name is Quan.<br>
And this is how I fight, heal, and build in Web3.</strong></p>"
            comments={comments}
            onNewComment={handleNewComment}
            onReplySubmit={handleReplySubmit}
          />
        </ThemeContext.Provider>
      </div>
      <CustomButton
            onClick={toggleTheme}
            text={`${theme === "light" ? "Light" : "Dark"}`}
          />
    </div>
  );
}
