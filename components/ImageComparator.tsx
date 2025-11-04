import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Icon } from './Icon';

interface ImageComparatorProps {
  originalImageUrl: string;
  editedImageUrl: string;
}

export const ImageComparator: React.FC<ImageComparatorProps> = ({ originalImageUrl, editedImageUrl }) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = (x / rect.width) * 100;
    setSliderPosition(percent);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
  };

  const stopDragging = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      handleMove(e.clientX);
    }
  }, [isDragging, handleMove]);
  
  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (isDragging) {
        e.preventDefault();
        handleMove(e.touches[0].clientX);
    }
  }, [isDragging, handleMove]);

  useEffect(() => {
    const containerNode = containerRef.current;

    // Use a ref to the DOM node for the touchmove listener to set passive: false
    containerNode?.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', stopDragging);
    window.addEventListener('touchend', stopDragging);

    return () => {
      containerNode?.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', stopDragging);
      window.removeEventListener('touchend', stopDragging);
    };
  }, [handleMouseMove, stopDragging, handleTouchMove]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full select-none overflow-hidden rounded-lg shadow-2xl touch-none"
    >
      <img
        src={originalImageUrl}
        alt="Original"
        className="absolute top-0 left-0 w-full h-full object-contain pointer-events-none"
        draggable={false}
      />
      <div
        className="absolute top-0 left-0 w-full h-full overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
      >
        <img
          src={editedImageUrl}
          alt="Edited"
          className="w-full h-full object-contain pointer-events-none"
          draggable={false}
        />
      </div>
      <div
        className="absolute top-0 h-full w-1 bg-white/75 cursor-ew-resize backdrop-blur-sm group"
        style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/90 text-gray-800 rounded-full p-2.5 shadow-lg pointer-events-none transition-transform group-hover:scale-110">
          <Icon type="compareArrows" className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
};
