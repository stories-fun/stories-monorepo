"use client";

import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

interface CustomButtonProps {
  text: string | ReactNode;
  icon?: LucideIcon;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}

const CustomButton = ({ 
  icon: Icon, 
  text, 
  onClick = () => console.log("Button clicked!"),
  className = "",
  disabled = false 
}: CustomButtonProps) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        inline-flex items-center gap-3 px-6 py-2 
        bg-green-500 hover:bg-green-600 active:bg-green-700
        text-white font-bold text-lg
        rounded-full border-none cursor-pointer
        transition-all duration-200 ease-in-out
        disabled:opacity-50 disabled:cursor-not-allowed
        focus:outline-none focus:ring-4 focus:ring-green-300
        shadow-lg hover:shadow-xl
        ${className}
      `}
    >
      {Icon && <Icon size={24} className="text-white hidden sm:block" />}
      <span>{text}</span>
    </button>
  );
};

export default CustomButton;