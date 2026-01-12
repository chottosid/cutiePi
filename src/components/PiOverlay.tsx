import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PI_DIGITS } from '../utils/piDigits';
import { playErrorSound } from '../utils/audio';

interface PiOverlayProps {
  isOpen: boolean;
  alarmHour: number | null;
  alarmMinute: number | null;
  onCorrect: () => void;
}

export function PiOverlay({ isOpen, alarmHour, alarmMinute, onCorrect }: PiOverlayProps) {
  const [input, setInput] = useState('');
  const [isWrong, setIsWrong] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(1);
  const inputRef = useRef<HTMLInputElement>(null);

  // Calculate required digits (HHMM format, e.g., 02:15 = 215 digits)
  const requiredDigits = alarmHour !== null && alarmMinute !== null
    ? parseInt(
        alarmHour.toString().padStart(2, '0') +
        alarmMinute.toString().padStart(2, '0')
      )
    : 0;

  const expectedDigits = PI_DIGITS.substring(0, requiredDigits);

  useEffect(() => {
    if (isOpen) {
      setInput('');
      setIsWrong(false);
      setVolumeLevel(1);
      inputRef.current?.focus();
    }
  }, [isOpen]);

  // Volume escalation
  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      setVolumeLevel(prev => prev + 1);
    }, 10000);

    return () => clearInterval(interval);
  }, [isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;

    // Allow "3.14159..." format - keep dots, only remove non-digit non-dot chars
    // But we strip the leading "3." for comparison since PI_DIGITS starts after 3.
    const value = rawValue;

    // Extract digits after "3." for comparison
    const digitsAfterDecimal = value.replace(/^3\.?/, '').replace(/[^0-9]/g, '');

    // Count how many correct consecutive digits from start
    let correctCount = 0;
    for (let i = 0; i < digitsAfterDecimal.length; i++) {
      if (digitsAfterDecimal[i] === expectedDigits[i]) {
        correctCount++;
      } else {
        break; // Stop at first wrong digit
      }
    }

    // If they typed a wrong digit at current position, show error
    if (digitsAfterDecimal.length > 0 && correctCount < digitsAfterDecimal.length) {
      // Wrong digit entered - shake but don't stop progress
      playErrorSound();
      setIsWrong(true);
      setTimeout(() => setIsWrong(false), 300);
    }

    setInput(value);

    // Only succeed if we have all required correct digits
    if (correctCount >= requiredDigits) {
      onCorrect();
    }
  };

  // Calculate progress - count correct consecutive digits only
  const digitsAfterDecimal = input.replace(/^3\.?/, '').replace(/[^0-9]/g, '');
  let correctCount = 0;
  for (let i = 0; i < digitsAfterDecimal.length && i < expectedDigits.length; i++) {
    if (digitsAfterDecimal[i] === expectedDigits[i]) {
      correctCount++;
    } else {
      break;
    }
  }
  const progress = correctCount;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-kawaii-bg/95 flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              inputRef.current?.focus();
            }
          }}
        >
          <motion.div
            className="bg-gradient-to-br from-kawaii-cream to-yellow-100 p-10 rounded-[40px] shadow-2xl max-w-lg w-full mx-4"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: 'spring', duration: 0.5 }}
          >
            {/* Title */}
            <h2 className="font-Fredoka text-3xl text-kawaii-plum text-center mb-2">
              ⏰ WAKE UP TIME! ⏰
            </h2>

            {/* Divider */}
            <div className="text-center text-2xl text-kawaii-pink my-4">
              ♥ ♡ ♥
            </div>

            {/* Subtitle */}
            <p className="text-kawaii-pink text-lg text-center mb-4">
              Enter the first <span className="font-Fredoka text-kawaii-plum">{requiredDigits}</span> digits of π to stop the alarm!
            </p>

            {/* Pi input */}
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={handleInputChange}
              placeholder="3.14159..."
              inputMode="decimal"
              className={`w-full text-2xl py-4 px-6 border-4 rounded-2xl text-center outline-none transition-all ${
                isWrong
                  ? 'border-red-400 bg-red-50 animate-shake'
                  : 'border-kawaii-pink bg-white focus:border-kawaii-mint'
              }`}
              style={{ fontFamily: 'Nunito, sans-serif', letterSpacing: '2px' }}
            />

            {/* Progress */}
            <div className="text-center mt-4 text-kawaii-plum font-bold">
              Progress: {progress} / {requiredDigits}
            </div>

            {/* Show what's been correctly entered */}
            {progress > 0 && (
              <div className="mt-2 text-center text-sm text-kawaii-mint">
                Correct so far: <span className="font-mono">3.{expectedDigits.substring(0, progress)}</span>
              </div>
            )}

            {/* Hint */}
            <div className="mt-4 text-sm text-kawaii-pink text-center leading-relaxed">
              π = 3.14159265358979323846264338327950288419716939937510...
              <br />
              <span className="text-xs">♪ The alarm gets louder every 10 seconds! ♪</span>
            </div>

            {/* Volume indicator */}
            <div className="mt-4 text-center text-kawaii-mint font-bold">
              Volume: Level {volumeLevel} {volumeLevel >= 4 && '🔊'}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
