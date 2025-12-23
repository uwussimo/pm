"use client";

import { motion } from "framer-motion";

interface CursorProps {
  x: number;
  y: number;
  userName: string;
  color: string;
}

export function Cursor({ x, y, userName, color }: CursorProps) {
  return (
    <motion.div
      className="pointer-events-none fixed left-0 top-0 z-[9999] will-change-transform"
      animate={{
        x: x - 2,
        y: y - 2,
      }}
      transition={{
        type: "spring",
        damping: 30,
        stiffness: 350,
        mass: 0.4,
      }}
    >
      {/* Clean, minimal cursor */}
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-[0_1px_4px_rgba(0,0,0,0.25)]"
      >
        {/* White outline */}
        <path
          d="M2 2L2 16L8 10L11 16L13 15L10 9L16 8L2 2Z"
          fill="white"
          stroke="rgba(0,0,0,0.1)"
          strokeWidth="0.5"
        />
        {/* Colored fill */}
        <path
          d="M3 3L3 14L8 9L10.5 14L11.5 13.5L9 8.5L14 7.5L3 3Z"
          fill={color}
        />
      </svg>

      {/* Clean name label */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.05, duration: 0.15 }}
        className="absolute top-5 left-3"
      >
        <div
          className="px-2 py-0.5 rounded text-[11px] font-medium text-white shadow-sm backdrop-blur-sm"
          style={{
            backgroundColor: color,
            boxShadow: `0 2px 6px ${color}30`,
          }}
        >
          {userName}
        </div>
      </motion.div>
    </motion.div>
  );
}
