import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ClockHand } from './ClockHand';
import { PiOverlay } from './PiOverlay';
import { playTickSound, startAlarm, stopAlarm } from '../utils/audio';

export function Clock() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isSettingMode, setIsSettingMode] = useState(false);
  const [alarmHour, setAlarmHour] = useState<number | null>(null);
  const [alarmMinute, setAlarmMinute] = useState<number | null>(null);
  const [isAlarmTriggered, setIsAlarmTriggered] = useState(false);
  const [alarmTimeDisplay, setAlarmTimeDisplay] = useState('');

  // In setting mode, we store the time being set (hours 0-11, minutes 0-59)
  const [settingHour, setSettingHour] = useState(0);
  const [settingMinute, setSettingMinute] = useState(0);

  const alarmCheckRef = useRef<number | null>(null);

  // Update current time
  useEffect(() => {
    if (isSettingMode || isAlarmTriggered) return;

    const interval = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);

      // Play tick sound on second change
      if (now.getSeconds() === 0) {
        playTickSound(0.3);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isSettingMode, isAlarmTriggered]);

  // Check for alarm
  useEffect(() => {
    if (alarmHour === null || alarmMinute === null || isAlarmTriggered) return;

    const checkAlarm = () => {
      const now = new Date();
      if (now.getHours() === alarmHour && now.getMinutes() === alarmMinute && now.getSeconds() === 0) {
        triggerAlarm();
      }
    };

    alarmCheckRef.current = window.setInterval(checkAlarm, 500);

    return () => {
      if (alarmCheckRef.current) {
        clearInterval(alarmCheckRef.current);
      }
    };
  }, [alarmHour, alarmMinute, isAlarmTriggered]);

  // Calculate hand rotations based on current time
  const getHourRotation = useCallback(() => {
    if (isSettingMode) {
      // Hour hand position based on setting time (moves with minutes)
      return (settingHour * 30) + (settingMinute * 0.5);
    }
    const hours = currentTime.getHours() % 12;
    const minutes = currentTime.getMinutes();
    return (hours * 30) + (minutes * 0.5);
  }, [currentTime, isSettingMode, settingHour, settingMinute]);

  const getMinuteRotation = useCallback(() => {
    if (isSettingMode) return settingMinute * 6;
    return currentTime.getMinutes() * 6;
  }, [currentTime, isSettingMode, settingMinute]);

  const getSecondRotation = useCallback(() => {
    if (isSettingMode) return currentTime.getSeconds() * 6;
    return currentTime.getSeconds() * 6;
  }, [currentTime, isSettingMode]);

  const triggerAlarm = () => {
    setIsAlarmTriggered(true);
    startAlarm((level) => {
      console.log('Volume level:', level);
    });
  };

  const handleAlarmCorrect = () => {
    stopAlarm();
    setIsAlarmTriggered(false);
    clearAlarm();
  };

  const startSettingMode = () => {
    setIsSettingMode(true);
    // Initialize setting time to current time
    setSettingHour(currentTime.getHours() % 12);
    setSettingMinute(currentTime.getMinutes());
  };

  // Handle hour hand rotation - updates both hour and minute proportionally
  const handleHourRotate = (angle: number) => {
    const normalizedAngle = ((angle % 360) + 360) % 360;
    const totalHourValue = normalizedAngle / 30; // e.g., 2.5 = 2:30
    const hour = Math.floor(totalHourValue) % 12;
    const minute = Math.round((totalHourValue % 1) * 60);
    setSettingHour(hour);
    setSettingMinute(minute);
  };

  // Handle minute hand rotation - updates minute, hour follows
  const handleMinuteRotate = (angle: number) => {
    const normalizedAngle = ((angle % 360) + 360) % 360;
    const minute = Math.round(normalizedAngle / 6);
    setSettingMinute(minute);
  };

  const confirmAlarm = () => {
    // Convert setting time to 24-hour format alarm
    const currentHour = currentTime.getHours();
    const period = Math.floor(currentHour / 12);
    const alarmH = settingHour === 0 ? period * 12 : (period * 12 + settingHour);

    setAlarmHour(alarmH);
    setAlarmMinute(settingMinute);
    setAlarmTimeDisplay(`${alarmH.toString().padStart(2, '0')}:${settingMinute.toString().padStart(2, '0')}`);
    setIsSettingMode(false);
  };

  const clearAlarm = () => {
    setAlarmHour(null);
    setAlarmMinute(null);
    setAlarmTimeDisplay('');
  };

  const cancelSetting = () => {
    setIsSettingMode(false);
  };

  // Convert setting time to display
  const getHandTimeDisplay = () => {
    const currentHour = currentTime.getHours();
    const period = Math.floor(currentHour / 12);
    const hour24 = settingHour === 0 ? period * 12 : (period * 12 + settingHour);

    return `${hour24.toString().padStart(2, '0')}:${settingMinute.toString().padStart(2, '0')}`;
  };

  // Format current time for display
  const formatCurrentTime = () => {
    return currentTime.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  // Clock opacity based on mode
  const clockOpacity = isSettingMode ? 0.5 : 1;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-kawaii-bg via-kawaii-mint-light to-purple-100 p-8">
      {/* Floating decorations */}
      <div className="fixed top-10 left-10 text-3xl opacity-60 animate-bounce" style={{ animationDuration: '3s' }}>☆</div>
      <div className="fixed top-20 right-20 text-3xl opacity-60 animate-bounce" style={{ animationDuration: '4s' }}>♥</div>
      <div className="fixed bottom-20 left-20 text-3xl opacity-60 animate-bounce" style={{ animationDuration: '3.5s' }}>✦</div>
      <div className="fixed bottom-10 right-10 text-3xl opacity-60 animate-bounce" style={{ animationDuration: '4.5s' }}>♡</div>

      {/* Main Clock */}
      <motion.div
        className="relative"
        animate={isAlarmTriggered ? {
          x: [0, -5, 5, -5, 5, 0],
          rotate: [0, -1, 1, -1, 1, 0]
        } : {}}
        transition={{ duration: 0.3, repeat: isAlarmTriggered ? Infinity : 0 }}
      >
        {/* Clock face */}
        <div
          data-clock
          className={`relative w-[400px] h-[400px] rounded-full shadow-2xl transition-opacity duration-500 ${
            isAlarmTriggered ? 'bg-red-100' : 'bg-gradient-to-br from-pink-100 to-pink-200'
          }`}
          style={{
            opacity: clockOpacity,
            boxShadow: isAlarmTriggered
              ? '0 20px 60px rgba(255, 100, 100, 0.6), inset 0 10px 30px rgba(255, 255, 255, 0.8)'
              : '0 20px 60px rgba(255, 150, 180, 0.4), inset 0 10px 30px rgba(255, 255, 255, 0.8)',
            border: '12px solid #FFC0CB'
          }}
        >
          {/* Clock numbers */}
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => {
            const angle = (num - 3) * 30;
            const radius = 165;
            const x = 200 + radius * Math.cos(angle * Math.PI / 180);
            const y = 200 + radius * Math.sin(angle * Math.PI / 180);

            return (
              <div
                key={num}
                className="absolute font-Fredoka text-2xl text-kawaii-plum font-bold"
                style={{
                  left: x,
                  top: y,
                  transform: 'translate(-50%, -50%)'
                }}
              >
                {num}
              </div>
            );
          })}

          {/* Kawaii face */}
          <div className="absolute top-16 left-1/2 -translate-x-1/2 flex gap-24">
            <div className="w-6 h-7 bg-amber-900 rounded-full relative">
              <div className="absolute top-1 left-1 w-2.5 h-2.5 bg-white rounded-full"></div>
              <div className="absolute top-0 right-0.5 text-white text-xs">✦</div>
            </div>
            <div className="w-6 h-7 bg-amber-900 rounded-full relative">
              <div className="absolute top-1 left-1 w-2.5 h-2.5 bg-white rounded-full"></div>
              <div className="absolute top-0 right-0.5 text-white text-xs">✦</div>
            </div>
          </div>

          {/* Blush */}
          <div className="absolute top-20 left-16 w-8 h-4 bg-kawaii-pink rounded-full opacity-60"></div>
          <div className="absolute top-20 right-16 w-8 h-4 bg-kawaii-pink rounded-full opacity-60"></div>

          {/* Mouth */}
          <motion.div
            className={`absolute top-24 left-1/2 -translate-x-1/2 w-5 h-2.5 border-b-4 border-amber-900 rounded-b-full ${
              isAlarmTriggered ? 'w-8 h-4 rounded-full' : ''
            }`}
          />

          {/* Clock hands */}
          <ClockHand
            type="hour"
            rotation={getHourRotation()}
            isDraggable={isSettingMode}
            onRotate={handleHourRotate}
            isSettingMode={isSettingMode}
          />
          <ClockHand
            type="minute"
            rotation={getMinuteRotation()}
            isDraggable={isSettingMode}
            onRotate={handleMinuteRotate}
            isSettingMode={isSettingMode}
          />
          <ClockHand
            type="second"
            rotation={getSecondRotation()}
            isDraggable={false}
            onRotate={() => {}}
            isSettingMode={isSettingMode}
          />

          {/* Center cap */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-kawaii-pink rounded-full shadow-md z-20"></div>

          {/* Sparkles */}
          <div className="absolute top-4 left-8 text-kawaii-pink animate-pulse">✦</div>
          <div className="absolute top-8 right-10 text-kawaii-mint animate-pulse" style={{ animationDelay: '0.5s' }}>✧</div>
          <div className="absolute bottom-8 left-12 text-kawaii-plum animate-pulse" style={{ animationDelay: '1s' }}>★</div>
          <div className="absolute bottom-4 right-8 text-kawaii-pink animate-pulse" style={{ animationDelay: '0.3s' }}>☆</div>
        </div>
      </motion.div>

      {/* Time Display */}
      <div className="mt-8 bg-gradient-to-br from-kawaii-cream to-yellow-100 px-8 py-4 rounded-3xl shadow-lg flex items-center gap-6">
        <div className="font-Fredoka text-3xl text-kawaii-plum">
          {formatCurrentTime()}
        </div>
        {(alarmTimeDisplay || isSettingMode) && (
          <>
            <div className="text-kawaii-pink text-2xl">⏰</div>
            <div className="font-Fredoka text-2xl text-kawaii-pink">
              {isSettingMode ? getHandTimeDisplay() : alarmTimeDisplay}
            </div>
            <div className="text-kawaii-mint text-xl animate-pulse">♥</div>
          </>
        )}
      </div>

      {/* Buttons */}
      <div className="mt-6 flex gap-4">
        {!isSettingMode ? (
          <>
            {alarmTimeDisplay ? (
              <button
                onClick={clearAlarm}
                className="px-8 py-3 bg-gradient-to-br from-kawaii-pink to-pink-300 text-white font-Fredoka rounded-2xl shadow-md hover:shadow-lg transition-all hover:scale-105"
              >
                Clear Alarm ✕
              </button>
            ) : (
              <button
                onClick={startSettingMode}
                className="px-8 py-3 bg-gradient-to-br from-kawaii-mint to-green-300 text-green-800 font-Fredoka rounded-2xl shadow-md hover:shadow-lg transition-all hover:scale-105"
              >
                Set Alarm ☆
              </button>
            )}
          </>
        ) : (
          <>
            <button
              onClick={cancelSetting}
              className="px-8 py-3 bg-gradient-to-br from-gray-300 to-gray-400 text-gray-700 font-Fredoka rounded-2xl shadow-md hover:shadow-lg transition-all hover:scale-105"
            >
              Cancel
            </button>
            <button
              onClick={confirmAlarm}
              className="px-8 py-3 bg-gradient-to-br from-kawaii-mint to-green-300 text-green-800 font-Fredoka rounded-2xl shadow-md hover:shadow-lg transition-all hover:scale-105"
            >
              Confirm ✓
            </button>
          </>
        )}
      </div>

      {/* Helper text */}
      <div className="mt-4 text-kawaii-pink text-sm">
        {isSettingMode ? 'Drag the hands to set your wake-up time!' : 'Rotate the dials to set your wake-up time!'}
      </div>

      {/* Pi Overlay */}
      <PiOverlay
        isOpen={isAlarmTriggered}
        alarmHour={alarmHour}
        alarmMinute={alarmMinute}
        onCorrect={handleAlarmCorrect}
      />
    </div>
  );
}
