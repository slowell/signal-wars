'use client';

import { motion, AnimatePresence } from 'framer-motion';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'card';
  width?: string | number;
  height?: string | number;
  count?: number;
}

export function Skeleton({ 
  className = '', 
  variant = 'text',
  width,
  height,
  count = 1 
}: SkeletonProps) {
  const baseClasses = 'bg-gray-800 animate-pulse';
  
  const variantClasses = {
    text: 'rounded h-4',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
    card: 'rounded-xl',
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={`${baseClasses} ${variantClasses[variant]} ${className}`}
          style={style}
        />
      ))}
    </>
  );
}

export function AgentCardSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 bg-gray-900/50 border border-gray-800 rounded-xl">
      <Skeleton variant="text" width={48} height={32} />
      <Skeleton variant="circular" width={56} height={56} />
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton width={120} />
          <Skeleton width={80} />
        </div>
        <div className="flex gap-4">
          <Skeleton width={100} />
          <Skeleton width={80} />
        </div>
      </div>
      <div className="flex gap-6">
        <Skeleton width={60} height={40} />
        <Skeleton width={60} height={40} />
      </div>
      <div className="flex gap-2">
        <Skeleton width={80} height={36} />
        <Skeleton width={80} height={36} />
      </div>
    </div>
  );
}

export function DuelCardSkeleton() {
  return (
    <div className="p-6 bg-gray-900/50 rounded-xl border border-gray-800">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Skeleton width={150} />
          <Skeleton width={60} height={24} />
        </div>
        <Skeleton width={100} height={32} />
      </div>
      <div className="flex items-center justify-center gap-4">
        <div className="flex-1 p-4 bg-gray-800/50 rounded-xl space-y-3">
          <div className="flex items-center gap-3">
            <Skeleton variant="circular" width={48} height={48} />
            <div className="space-y-1">
              <Skeleton width={100} />
              <Skeleton width={60} />
            </div>
          </div>
          <Skeleton width="100%" height={40} />
          <Skeleton width="100%" height={36} />
        </div>
        <Skeleton width={48} height={48} />
        <div className="flex-1 p-4 bg-gray-800/50 rounded-xl space-y-3">
          <div className="flex items-center gap-3">
            <Skeleton variant="circular" width={48} height={48} />
            <div className="space-y-1">
              <Skeleton width={100} />
              <Skeleton width={60} />
            </div>
          </div>
          <Skeleton width="100%" height={40} />
          <Skeleton width="100%" height={36} />
        </div>
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl border border-gray-800 bg-gray-900/30">
        <div className="flex items-start gap-6">
          <Skeleton variant="circular" width={96} height={96} />
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-3">
              <Skeleton width={200} height={36} />
              <Skeleton width={100} height={28} />
            </div>
            <Skeleton width={300} />
            <div className="flex gap-6">
              <Skeleton width={80} height={48} />
              <Skeleton width={80} height={48} />
              <Skeleton width={80} height={48} />
              <Skeleton width={80} height={48} />
            </div>
          </div>
        </div>
        <div className="mt-6 pt-6 border-t border-gray-800">
          <div className="flex justify-between mb-2">
            <Skeleton width={100} />
            <Skeleton width={100} />
          </div>
          <Skeleton width="100%" height={12} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Skeleton variant="card" height={200} />
        <Skeleton variant="card" height={200} />
      </div>
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="p-6 bg-gray-900/50 rounded-xl border border-gray-800">
      <Skeleton width={200} height={24} className="mb-4" />
      <Skeleton variant="rectangular" width="100%" height={250} />
    </div>
  );
}

export function AchievementSkeleton() {
  return (
    <div className="p-4 bg-gray-900/50 rounded-xl border border-gray-800 text-center space-y-2">
      <Skeleton variant="circular" width={48} height={48} className="mx-auto" />
      <Skeleton width={100} className="mx-auto" />
      <Skeleton width={140} className="mx-auto" />
      <Skeleton width={80} className="mx-auto" />
    </div>
  );
}

export function LeaderboardSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      <div className="flex gap-2 mb-6">
        <Skeleton width={100} height={36} />
        <Skeleton width={100} height={36} />
        <Skeleton width={120} height={36} className="ml-auto" />
      </div>
      {Array.from({ length: count }).map((_, i) => (
        <AgentCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function FadeIn({ 
  children, 
  delay = 0,
  direction = 'up'
}: { 
  children: React.ReactNode;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
}) {
  const directionOffset = {
    up: { y: 20 },
    down: { y: -20 },
    left: { x: 20 },
    right: { x: -20 },
  };

  return (
    <motion.div
      initial={{ opacity: 0, ...directionOffset[direction] }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ 
        duration: 0.4, 
        delay,
        ease: [0.25, 0.1, 0.25, 1]
      }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerContainer({ 
  children,
  staggerDelay = 0.1,
  className = ''
}: { 
  children: React.ReactNode;
  staggerDelay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { 
          opacity: 1, 
          y: 0,
          transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }
        },
      }}
    >
      {children}
    </motion.div>
  );
}
