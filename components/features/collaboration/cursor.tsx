"use client";

import { motion } from "framer-motion";
import { MousePointer2 } from "lucide-react";

interface CursorProps {
  x: number;
  y: number;
  userName: string;
  color: string;
}

export function Cursor({ x, y, userName, color }: CursorProps) {
  return (
    <motion.div
      className="pointer-events-none fixed z-50"
      initial={{ x, y, opacity: 0, scale: 0.8 }}
      animate={{ x, y, opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{
        type: "spring",
        damping: 30,
        stiffness: 300,
        opacity: { duration: 0.2 },
      }}
    >
      <MousePointer2
        className="h-5 w-5 -rotate-12"
        style={{ color }}
        fill={color}
      />
      <div
        className="mt-1 rounded-md px-2 py-1 text-xs font-medium text-white shadow-lg"
        style={{ backgroundColor: color }}
      >
        {userName}
      </div>
    </motion.div>
  );
}
