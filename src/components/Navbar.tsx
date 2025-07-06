"use client";

import Link from "next/link";
import CustomButton from "./Button";
import { Wallet } from "lucide-react";
import { usePathname } from "next/navigation";
import UserModal from "./UserModal";
import { useState } from "react";

const Navbar = () => {
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const pathname = usePathname();
  const isOurStoryPage = pathname === "/our-story";

  const handleOpenUserModal = () => {
    setIsUserModalOpen(true);
  };

  const handleCloseUserModal = () => {
    setIsUserModalOpen(false);
  };

  return (
    <nav className="bg-[#141414] px-4 py-4">
      <div className="w-full max-w-screen-lg mx-auto flex items-center justify-center flex-nowrap gap-4">
        {/* Navigation pill */}
        <div className="flex items-center bg-[#141414] rounded-full px-8 py-2 border border-[#FFFFFF1F] gap-6 flex-shrink text-lg">
          <Link
            href="/"
            className="text-yellow-400 text-2xl sm:text-3xl font-bold hover:text-yellow-300 transition-colors whitespace-nowrap"
          >
            S.
          </Link>

          <Link
            href={isOurStoryPage ? "/profile" : "/our-story"}
            className="text-[#FFEEBA] font-bold hover:underline transition-colors text-sm sm:text-lg whitespace-nowrap"
          >
            {isOurStoryPage ? "Profile" : "Our Story"}
          </Link>
        </div>

        {/* Connect Wallet Button (text shortens on small screens) */}
        <CustomButton
          text={
            <>
              <span className="inline sm:hidden">Connect</span>
              <span className="hidden sm:inline">Connect Wallet</span>
            </>
          }
          icon={Wallet}
          onClick={() => console.log("Wallet clicked")}
          className="whitespace-nowrap flex-shrink-0"
        />
        {/* User Modal */}
        <UserModal
          isOpen={isUserModalOpen}
          onClose={handleCloseUserModal}
          onSave={(userData) => console.log("User data saved:", userData)}
        />
      </div>
    </nav>
  );
};

export default Navbar;
