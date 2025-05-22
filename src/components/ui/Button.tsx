import type React from "react"
import { cn } from "../../utils"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outline" | "ghost"
  size?: "sm" | "md" | "lg"
  children: React.ReactNode
}

const Button: React.FC<ButtonProps> = ({ className, variant = "primary", size = "md", children, ...props }) => {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-md font-medium transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500",
        "disabled:opacity-50 disabled:pointer-events-none",

        // Variants
        variant === "primary" &&
          "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white hover:from-indigo-700 hover:to-indigo-800 shadow-md",
        variant === "outline" && "border border-indigo-700/50 text-indigo-100 hover:bg-indigo-900/20",
        variant === "ghost" && "text-indigo-100 hover:bg-indigo-900/20",

        // Sizes
        size === "sm" && "text-xs px-3 py-1.5 rounded-md",
        size === "md" && "text-sm px-4 py-2 rounded-md",
        size === "lg" && "text-base px-6 py-3 rounded-lg",

        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}

export default Button
