"use client";

import React from "react";
import { TbLoader3 } from "react-icons/tb";

interface LoadingSpinnerProps {
  size?: number | string; // e.g., 8, "1rem", "24px"
  title?: string;
  titleClassName?: string;
}

export const LoadingSpinner = ({
  size = 8,
  title = "",
  titleClassName = "",
}: LoadingSpinnerProps) => {
  const iconSize = typeof size === "number" ? `${size * 4}px` : size;

  return (
    <div className="flex flex-col items-center justify-center h-full gap-2">
      <TbLoader3
        className="animate-spin"
        style={{ width: iconSize, height: iconSize }}
      />
      {title && (
        <p className={`${titleClassName}`}>
          {title}
        </p>
      )}
    </div>
  );
};
