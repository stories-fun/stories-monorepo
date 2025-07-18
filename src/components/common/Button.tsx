import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";
import { twMerge } from "tailwind-merge";

interface CustomButtonProps {
  text?: string | ReactNode;
  icon?: LucideIcon;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  disabled?: boolean;
  children?: React.ReactNode;
}

const CustomButton = ({
  icon: Icon,
  text,
  onClick = () => console.log("Button clicked!"),
  className = "",
  disabled = false,
  children, // ✅ Add this line
}: CustomButtonProps) => {
  const iconOnly = Icon && !text && !children;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={twMerge(
        `
        inline-flex items-center justify-center gap-3
        ${iconOnly ? "w-12 h-12 p-0" : "px-6 py-2"}
        bg-green-500 hover:bg-green-600 active:bg-green-700
        text-white font-bold text-lg
        rounded-full border border-black cursor-pointer
        transition-all duration-200 ease-in-out
        disabled:opacity-50 disabled:cursor-not-allowed
        focus:outline-none focus:ring-4 focus:ring-green-300
        shadow-lg hover:shadow-xl
      `,
        className
      )}
    >
      {Icon && <Icon size={24} />}
      {children ? <>{children}</> : text && <span>{text}</span>}
    </button>
  );
};


export default CustomButton;