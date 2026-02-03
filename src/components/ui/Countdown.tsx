'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface CountdownTimerProps {
  targetDate: string;
  onExpire?: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calculateTimeLeft(targetDate: string): TimeLeft | null {
  const target = new Date(targetDate).getTime();
  const now = Date.now();
  const difference = target - now;

  if (difference <= 0) {
    return null;
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((difference % (1000 * 60)) / 1000),
  };
}

export function CountdownTimer({
  targetDate,
  onExpire,
  className = '',
  size = 'md',
  showLabels = true,
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(calculateTimeLeft(targetDate));

  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = calculateTimeLeft(targetDate);
      
      if (!remaining) {
        clearInterval(timer);
        onExpire?.();
      }
      
      setTimeLeft(remaining);
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate, onExpire]);

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-2xl md:text-3xl',
  };

  const digitSizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14 md:w-16 md:h-16',
  };

  if (!timeLeft) {
    return (
      <div className={`text-red-400 font-bold ${className}`}>
        Expired
      </div>
    );
  }

  const timeUnits = [
    { value: timeLeft.days, label: 'Days' },
    { value: timeLeft.hours, label: 'Hrs' },
    { value: timeLeft.minutes, label: 'Mins' },
    { value: timeLeft.seconds, label: 'Secs' },
  ].filter(unit => size === 'sm' ? true : unit.value > 0 || unit.label === 'Secs');

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {timeUnits.map((unit, index) => (
        <div key={unit.label} className="flex items-center">
          <div className="flex flex-col items-center">
            <motion.div
              key={unit.value}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`
                ${digitSizeClasses[size]}
                bg-gray-800 rounded-lg flex items-center justify-center
                font-bold font-mono tabular-nums
                ${sizeClasses[size]}
                ${unit.value <= 5 && unit.label === 'Secs' ? 'text-red-400' : 'text-white'}
              `}
            >
              {String(unit.value).padStart(2, '0')}
            </motion.div>
            {showLabels && (
              <span className="text-xs text-gray-500 mt-1">{unit.label}</span>
            )}
          </div>
          {index < timeUnits.length - 1 && (
            <span className={`text-gray-600 font-bold ${size === 'lg' ? 'text-2xl mx-1' : 'mx-1'}`}>
              :
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

// Compact version for cards
export function CountdownCompact({ 
  targetDate, 
  className = '' 
}: { 
  targetDate: string; 
  className?: string;
}) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(calculateTimeLeft(targetDate));

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(targetDate));
    }, 60000);
    return () => clearInterval(timer);
  }, [targetDate]);

  if (!timeLeft) {
    return <span className="text-red-400">Ended</span>;
  }

  const formatted = timeLeft.days > 0 
    ? `${timeLeft.days}d ${timeLeft.hours}h`
    : timeLeft.hours > 0 
    ? `${timeLeft.hours}h ${timeLeft.minutes}m`
    : `${timeLeft.minutes}m`;

  return (
    <span className={`tabular-nums ${className}`}>
      {formatted}
    </span>
  );
}

// Live pulse indicator
export function LiveIndicator({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="relative flex h-3 w-3">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
      </span>
      <span className="text-xs font-medium text-green-400 uppercase tracking-wider">Live</span>
    </div>
  );
}
