import React, { useState, useLayoutEffect, useRef } from 'react';
import type { DetectedObject } from '../types';

interface ObjectOverlaysProps {
  objects: DetectedObject[];
  selectedObject: DetectedObject | null;
  onSelectObject: (object: DetectedObject) => void;
  imageUrl: string;
  imageContainerRef: React.RefObject<HTMLDivElement>;
}

interface RenderedImageMetrics {
  width: number;
  height: number;
  top: number;
  left: number;
}

export const ObjectOverlays: React.FC<ObjectOverlaysProps> = ({ objects, selectedObject, onSelectObject, imageUrl, imageContainerRef }) => {
  const [metrics, setMetrics] = useState<RenderedImageMetrics | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  useLayoutEffect(() => {
    const calculateMetrics = () => {
      if (!imageContainerRef.current || !imageRef.current || !imageRef.current.complete) {
        return;
      }

      const container = imageContainerRef.current;
      const image = imageRef.current;

      const containerWidth = container.offsetWidth;
      const containerHeight = container.offsetHeight;
      const imageNaturalWidth = image.naturalWidth;
      const imageNaturalHeight = image.naturalHeight;

      if (containerWidth === 0 || containerHeight === 0 || imageNaturalWidth === 0 || imageNaturalHeight === 0) {
        return;
      }

      const containerAspectRatio = containerWidth / containerHeight;
      const imageAspectRatio = imageNaturalWidth / imageNaturalHeight;

      let renderedWidth: number;
      let renderedHeight: number;

      if (imageAspectRatio > containerAspectRatio) {
        renderedWidth = containerWidth;
        renderedHeight = containerWidth / imageAspectRatio;
      } else {
        renderedHeight = containerHeight;
        renderedWidth = containerHeight * imageAspectRatio;
      }

      const top = (containerHeight - renderedHeight) / 2;
      const left = (containerWidth - renderedWidth) / 2;

      setMetrics({ width: renderedWidth, height: renderedHeight, top, left });
    };

    const imageEl = new Image();
    imageEl.src = imageUrl;
    imageRef.current = imageEl;
    
    const currentContainerRef = imageContainerRef.current;

    const resizeObserver = new ResizeObserver(calculateMetrics);
    if(currentContainerRef) {
      resizeObserver.observe(currentContainerRef);
    }

    if (imageEl.complete) {
        calculateMetrics();
    } else {
        imageEl.onload = calculateMetrics;
    }

    return () => {
        imageEl.onload = null;
        if(currentContainerRef) {
            resizeObserver.unobserve(currentContainerRef);
        }
    };
  }, [imageUrl, imageContainerRef]);

  if (!metrics || objects.length === 0) {
    return null;
  }

  return (
    <div
      className="absolute top-0 left-0"
      style={{
        transform: `translate(${metrics.left}px, ${metrics.top}px)`,
        width: `${metrics.width}px`,
        height: `${metrics.height}px`,
      }}
    >
      {objects.map((obj, index) => {
        const isSelected = selectedObject === obj;
        const box = obj.boundingBox;

        const style = {
          left: `${box.x_min * 100}%`,
          top: `${box.y_min * 100}%`,
          width: `${(box.x_max - box.x_min) * 100}%`,
          height: `${(box.y_max - box.y_min) * 100}%`,
        };
        
        return (
          <div
            key={`${obj.name}-${index}`}
            onClick={(e) => {
                e.stopPropagation();
                onSelectObject(obj);
            }}
            className={`absolute border-2 transition-all duration-200 ease-in-out cursor-pointer group ${isSelected ? 'border-blue-400 bg-blue-500/30' : 'border-yellow-400 bg-yellow-500/20 hover:bg-yellow-500/40'}`}
            style={style}
          >
            <span className={`absolute -top-6 left-0 text-xs font-semibold px-1.5 py-0.5 rounded-full whitespace-nowrap ${isSelected ? 'bg-blue-400 text-white' : 'bg-yellow-400 text-black'}`}>
              {obj.name}
            </span>
          </div>
        );
      })}
    </div>
  );
};
