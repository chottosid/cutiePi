import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { playTickSound } from '../utils/audio';

interface ClockHandProps {
  type: 'hour' | 'minute' | 'second';
  rotation: number;
  isDraggable: boolean;
  onRotate: (angle: number) => void;
  isSettingMode: boolean;
}

export function ClockHand({ type, rotation, isDraggable, onRotate }: ClockHandProps) {
  const [isDragging, setIsDragging] = useState(false);
  const handRef = useRef<HTMLDivElement>(null);

  // Hand dimensions and styles
  const handConfig = {
    hour: {
      width: '8px',
      height: '70px',
      bg: 'bg-kawaii-pink',
      origin: 'bottom-center',
      borderRadius: '4px',
      zIndex: 10,
    },
    minute: {
      width: '5px',
      height: '100px',
      bg: 'bg-kawaii-mint',
      origin: 'bottom-center',
      borderRadius: '2px',
      zIndex: 11,
    },
    second: {
      width: '2px',
      height: '110px',
      bg: 'bg-red-400',
      origin: 'bottom-center',
      borderRadius: '1px',
      zIndex: 12,
    },
  };

  const config = handConfig[type];

  // Calculate angle from mouse/touch position
  const getAngleFromEvent = (clientX: number, clientY: number): number => {
    if (!handRef.current) return 0;

    const clock = handRef.current.closest('[data-clock]') as HTMLElement;
    if (!clock) return 0;

    const rect = clock.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    return Math.atan2(clientY - centerY, clientX - centerX) * (180 / Math.PI) + 90;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isDraggable) return;
    setIsDragging(true);
    e.preventDefault();
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !isDraggable) return;

    const angle = getAngleFromEvent(e.clientX, e.clientY);
    const normalizedAngle = ((angle % 360) + 360) % 360;

    // Only trigger tick sound if moved significantly
    const currentRotation = rotation;
    if (Math.abs(normalizedAngle - currentRotation) > 5) {
      playTickSound(0.5);
    }

    onRotate(normalizedAngle);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (_e: React.TouchEvent) => {
    if (!isDraggable) return;
    setIsDragging(true);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging || !isDraggable) return;
    e.preventDefault();

    const touch = e.touches[0];
    const angle = getAngleFromEvent(touch.clientX, touch.clientY);
    const normalizedAngle = ((angle % 360) + 360) % 360;

    if (Math.abs(normalizedAngle - rotation) > 5) {
      playTickSound(0.5);
    }

    onRotate(normalizedAngle);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleMouseUp);

      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('touchend', handleMouseUp);
      };
    }
  }, [isDragging, isDraggable, rotation]);

  return (
    <motion.div
      ref={handRef}
      className={`absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-full ${config.bg} shadow-md`}
      style={{
        width: config.width,
        height: config.height,
        transformOrigin: 'bottom center',
        zIndex: config.zIndex,
        cursor: isDraggable ? 'grab' : 'default',
        borderRadius: config.borderRadius,
      }}
      animate={{ rotate: rotation }}
      transition={isDragging ? { type: 'spring', stiffness: 300, damping: 30 } : { type: 'spring', stiffness: 100, damping: 15 }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      {/* Cute decoration at the end of second hand */}
      {type === 'second' && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-red-400 text-lg">
          ♥
        </div>
      )}

      {/* Center dot cap */}
      <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full ${config.bg} shadow-md`} />
    </motion.div>
  );
}
