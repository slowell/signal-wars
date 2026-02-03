'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  color?: 'default' | 'green' | 'red' | 'blue' | 'purple' | 'orange' | 'yellow';
  className?: string;
  delay?: number;
}

const colorClasses = {
  default: {
    bg: 'bg-gray-800/50',
    text: 'text-white',
    subtext: 'text-gray-400',
  },
  green: {
    bg: 'bg-green-500/10',
    text: 'text-green-400',
    subtext: 'text-green-500/70',
  },
  red: {
    bg: 'bg-red-500/10',
    text: 'text-red-400',
    subtext: 'text-red-500/70',
  },
  blue: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    subtext: 'text-blue-500/70',
  },
  purple: {
    bg: 'bg-purple-500/10',
    text: 'text-purple-400',
    subtext: 'text-purple-500/70',
  },
  orange: {
    bg: 'bg-orange-500/10',
    text: 'text-orange-400',
    subtext: 'text-orange-500/70',
  },
  yellow: {
    bg: 'bg-yellow-500/10',
    text: 'text-yellow-400',
    subtext: 'text-yellow-500/70',
  },
};

export function StatCard({
  label,
  value,
  subValue,
  change,
  changeLabel,
  icon,
  trend,
  color = 'default',
  className = '',
  delay = 0,
}: StatCardProps) {
  const colors = colorClasses[color];
  
  const getTrendIcon = () => {
    if (trend === 'up') return <TrendingUp className="w-4 h-4 text-green-400" />;
    if (trend === 'down') return <TrendingDown className="w-4 h-4 text-red-400" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const getTrendColor = () => {
    if (change === undefined) return 'text-gray-400';
    if (change > 0) return 'text-green-400';
    if (change < 0) return 'text-red-400';
    return 'text-gray-400';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      whileHover={{ scale: 1.02 }}
      className={`
        p-4 rounded-xl border border-gray-700/50
        ${colors.bg}
        ${className}
      `}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className={`text-sm ${colors.subtext}`}>{label}</p>
          <motion.p
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: delay + 0.1, type: 'spring' }}
            className={`text-2xl font-bold ${colors.text} mt-1`}
          >
            {value}
          </motion.p>
          
          {subValue && (
            <p className="text-xs text-gray-500 mt-1">{subValue}</p>
          )}
          
          {(change !== undefined || trend) && (
            <div className="flex items-center gap-1 mt-2">
              {getTrendIcon()}
              <span className={`text-sm font-medium ${getTrendColor()}`}>
                {change !== undefined && `${change > 0 ? '+' : ''}${change}%`}
              </span>
              {changeLabel && (
                <span className="text-xs text-gray-500">{changeLabel}</span>
              )}
            </div>
          )}
        </div>
        
        {icon && (
          <div className={`p-2 rounded-lg ${colors.bg} ${colors.text}`}>
            {icon}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// Mini stat for inline display
export function MiniStat({ 
  label, 
  value, 
  trend 
}: { 
  label: string; 
  value: string | number;
  trend?: 'up' | 'down' | 'neutral';
}) {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-gray-500">{label}</span>
      <div className="flex items-center gap-1">
        <span className="font-semibold text-white">{value}</span>
        {trend === 'up' && <TrendingUp className="w-3 h-3 text-green-400" />}
        {trend === 'down' && <TrendingDown className="w-3 h-3 text-red-400" />}
      </div>
    </div>
  );
}

// Stats row for compact layouts
export function StatsRow({ 
  stats 
}: { 
  stats: { label: string; value: string | number }[];
}) {
  return (
    <div className="flex items-center gap-6">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="text-center"
        >
          <p className="text-2xl font-bold text-white">{stat.value}</p>
          <p className="text-xs text-gray-500">{stat.label}</p>
        </motion.div>
      ))}
    </div>
  );
}
