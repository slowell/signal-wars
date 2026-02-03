'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import { PredictionHistory } from '@/types';

interface PredictionChartProps {
  predictions: PredictionHistory[];
  type?: 'accuracy' | 'timeline' | 'distribution' | 'performance';
  height?: number;
}

export function PredictionChart({ 
  predictions, 
  type = 'accuracy',
  height = 250 
}: PredictionChartProps) {
  const chartData = useMemo(() => {
    if (type === 'accuracy') {
      // Running accuracy over time
      let correct = 0;
      let total = 0;
      return predictions
        .filter(p => p.status === 'resolved')
        .map((p, index) => {
          if (p.result === 'win') correct++;
          total++;
          return {
            name: `#${index + 1}`,
            accuracy: (correct / total) * 100,
            prediction: p.confidence,
            asset: p.asset,
          };
        });
    }

    if (type === 'timeline') {
      return predictions.map((p, index) => ({
        name: p.asset,
        confidence: p.confidence,
        result: p.result === 'win' ? 1 : p.result === 'loss' ? -1 : 0,
        target: p.targetPrice,
      }));
    }

    if (type === 'distribution') {
      const wins = predictions.filter(p => p.result === 'win').length;
      const losses = predictions.filter(p => p.result === 'loss').length;
      const pending = predictions.filter(p => p.status !== 'resolved').length;
      return [
        { name: 'Wins', value: wins, color: '#4ade80' },
        { name: 'Losses', value: losses, color: '#ef4444' },
        { name: 'Pending', value: pending, color: '#fbbf24' },
      ];
    }

    if (type === 'performance') {
      // Daily/weekly performance
      const grouped = predictions.reduce((acc, p) => {
        const date = new Date(p.submittedAt).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        });
        if (!acc[date]) acc[date] = { wins: 0, losses: 0 };
        if (p.result === 'win') acc[date].wins++;
        if (p.result === 'loss') acc[date].losses++;
        return acc;
      }, {} as Record<string, { wins: number; losses: number }>);

      return Object.entries(grouped).map(([date, stats]) => ({
        name: date,
        wins: stats.wins,
        losses: stats.losses,
        total: stats.wins + stats.losses,
      }));
    }

    return [];
  }, [predictions, type]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-xl">
          <p className="text-gray-400 text-sm mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-white font-medium">
              <span style={{ color: entry.color }}>
                {entry.name}: {typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}
                {entry.name === 'accuracy' && '%'}
              </span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (type === 'accuracy') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="colorAccuracy" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis 
            dataKey="name" 
            stroke="#6b7280"
            fontSize={12}
            tickLine={false}
          />
          <YAxis 
            stroke="#6b7280"
            fontSize={12}
            tickLine={false}
            domain={[0, 100]}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="accuracy"
            stroke="#8b5cf6"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorAccuracy)"
            name="Accuracy"
          />
          <Area
            type="monotone"
            dataKey="prediction"
            stroke="#10b981"
            strokeWidth={2}
            strokeDasharray="5 5"
            fill="none"
            name="Confidence"
          />
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  if (type === 'distribution') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {chartData.map((entry: any, index: number) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  if (type === 'performance') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis 
            dataKey="name" 
            stroke="#6b7280"
            fontSize={12}
            tickLine={false}
          />
          <YAxis 
            stroke="#6b7280"
            fontSize={12}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="wins" stackId="a" fill="#4ade80" name="Wins" />
          <Bar dataKey="losses" stackId="a" fill="#ef4444" name="Losses" />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return null;
}

// Win/Loss ratio visualization
export function WinLossRatio({ 
  wins, 
  losses, 
  size = 120 
}: { 
  wins: number; 
  losses: number;
  size?: number;
}) {
  const total = wins + losses;
  const winRate = total > 0 ? (wins / total) * 100 : 0;
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (winRate / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 100 100" className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx="50"
          cy="50"
          r="45"
          stroke="#374151"
          strokeWidth="10"
          fill="none"
        />
        {/* Win arc */}
        <motion.circle
          cx="50"
          cy="50"
          r="45"
          stroke="#4ade80"
          strokeWidth="10"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="text-2xl font-bold text-white"
        >
          {winRate.toFixed(0)}%
        </motion.span>
        <span className="text-xs text-gray-500">Win Rate</span>
      </div>
    </div>
  );
}

// Mini sparkline for compact displays
export function Sparkline({ 
  data, 
  color = '#8b5cf6',
  height = 40 
}: { 
  data: number[];
  color?: string;
  height?: number;
}) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  
  const points = data.map((value, index) => ({
    x: (index / (data.length - 1)) * 100,
    y: 100 - ((value - min) / range) * 100,
  }));

  const pathD = points.reduce((acc, point, index) => {
    if (index === 0) return `M ${point.x} ${point.y}`;
    return `${acc} L ${point.x} ${point.y}`;
  }, '');

  return (
    <svg width="100%" height={height} viewBox="0 0 100 100" preserveAspectRatio="none">
      <motion.path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth="3"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1 }}
      />
    </svg>
  );
}
