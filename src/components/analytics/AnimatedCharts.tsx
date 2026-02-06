"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useMemo } from "react";

// ============================================================================
// ANIMATED CHART COMPONENTS WITH FRAMER MOTION
// ============================================================================

interface ChartDataPoint {
  value: number;
  label: string;
  color?: string;
}

interface BarChartProps {
  data: ChartDataPoint[];
  maxValue?: number;
  height?: number;
  animated?: boolean;
  barColor?: string;
}

export const AnimatedBarChart: React.FC<BarChartProps> = ({
  data,
  maxValue,
  height = 200,
  animated = true,
  barColor = "var(--primary)",
}) => {
  const computedMax = useMemo(() => {
    if (maxValue) return maxValue;
    return Math.max(...data.map((d) => d.value)) * 1.1;
  }, [data, maxValue]);

  return (
    <div className="w-full" style={{ height }}>
      <svg width="100%" height="100%" viewBox={`0 0 ${data.length * 60} ${height}`} preserveAspectRatio="none">
        <AnimatePresence>
          {data.map((point, index) => {
            const barHeight = (point.value / computedMax) * (height - 30);
            const x = index * 60 + 10;
            const y = height - barHeight - 20;

            return (
              <motion.g key={index}>
                {/* Bar */}
                <motion.rect
                  x={x}
                  y={height - 20}
                  width={40}
                  height={0}
                  fill={point.color || barColor}
                  rx={4}
                  initial={animated ? { height: 0, y: height - 20 } : false}
                  animate={{
                    height: barHeight,
                    y: y,
                  }}
                  transition={{
                    duration: 0.6,
                    delay: index * 0.05,
                    ease: [0.4, 0, 0.2, 1],
                  }}
                  style={{ opacity: 0.8 }}
                />
                
                {/* Value label */}
                <motion.text
                  x={x + 20}
                  y={y - 5}
                  textAnchor="middle"
                  fontSize="10"
                  fill="var(--text-main)"
                  initial={animated ? { opacity: 0 } : false}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.05 + 0.3 }}
                >
                  {point.value}
                </motion.text>

                {/* X-axis label */}
                <motion.text
                  x={x + 20}
                  y={height - 5}
                  textAnchor="middle"
                  fontSize="9"
                  fill="var(--text-muted)"
                  initial={animated ? { opacity: 0 } : false}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.05 + 0.4 }}
                >
                  {point.label}
                </motion.text>
              </motion.g>
            );
          })}
        </AnimatePresence>
      </svg>
    </div>
  );
};

interface LineChartProps {
  data: ChartDataPoint[];
  height?: number;
  strokeColor?: string;
  fillColor?: string;
  animated?: boolean;
  showArea?: boolean;
}

export const AnimatedLineChart: React.FC<LineChartProps> = ({
  data,
  height = 200,
  strokeColor = "var(--primary)",
  fillColor = "var(--primary-light)",
  animated = true,
  showArea = true,
}) => {
  const { path, areaPath, maxValue } = useMemo(() => {
    if (data.length === 0) return { path: "", areaPath: "", maxValue: 0 };

    const max = Math.max(...data.map((d) => d.value)) * 1.1;
    const min = Math.min(...data.map((d) => d.value)) * 0.9;
    const width = data.length * 50;
    const chartHeight = height - 40;

    const points = data.map((point, index) => {
      const x = (index / (data.length - 1 || 1)) * width;
      const y = chartHeight - ((point.value - min) / (max - min || 1)) * chartHeight;
      return { x, y, value: point.value };
    });

    // Create smooth curve using cubic bezier
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const current = points[i];
      const next = points[i + 1];
      const controlPointX1 = current.x + (next.x - current.x) / 3;
      const controlPointX2 = current.x + (2 * (next.x - current.x)) / 3;
      path += ` C ${controlPointX1} ${current.y}, ${controlPointX2} ${next.y}, ${next.x} ${next.y}`;
    }

    // Area path for gradient fill
    const areaPath = `${path} L ${points[points.length - 1].x} ${chartHeight} L ${points[0].x} ${chartHeight} Z`;

    return { path, areaPath, maxValue: max };
  }, [data, height]);

  if (data.length === 0) return null;

  const width = data.length * 50;

  return (
    <div className="w-full overflow-hidden" style={{ height }}>
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={strokeColor} stopOpacity="0.3" />
            <stop offset="100%" stopColor={strokeColor} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((tick, i) => (
          <motion.line
            key={i}
            x1={0}
            y1={(height - 40) * tick}
            x2={width}
            y2={(height - 40) * tick}
            stroke="var(--border-subtle)"
            strokeDasharray="4 4"
            initial={animated ? { opacity: 0 } : false}
            animate={{ opacity: 0.5 }}
            transition={{ delay: i * 0.1 }}
          />
        ))}

        {/* Area fill */}
        {showArea && (
          <motion.path
            d={areaPath}
            fill="url(#areaGradient)"
            initial={animated ? { opacity: 0 } : false}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
          />
        )}

        {/* Line */}
        <motion.path
          d={path}
          fill="none"
          stroke={strokeColor}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={animated ? { pathLength: 0, opacity: 0 } : false}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1] }}
        />

        {/* Data points */}
        {data.map((point, index) => {
          const x = (index / (data.length - 1 || 1)) * width;
          const min = Math.min(...data.map((d) => d.value)) * 0.9;
          const y = (height - 40) - ((point.value - min) / (maxValue - min || 1)) * (height - 40);

          return (
            <motion.g key={index}>
              <motion.circle
                cx={x}
                cy={y}
                r={4}
                fill="var(--surface-bg)"
                stroke={strokeColor}
                strokeWidth={2}
                initial={animated ? { scale: 0, opacity: 0 } : false}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.02 + 0.8 }}
                whileHover={{ scale: 1.5, r: 6 }}
              />
              <title>{`${point.label}: ${point.value}`}</title>
            </motion.g>
          );
        })}
      </svg>
    </div>
  );
};

interface CircularProgressProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  bgColor?: string;
  animated?: boolean;
  label?: string;
  showPercentage?: boolean;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  value,
  max = 100,
  size = 120,
  strokeWidth = 8,
  color = "var(--primary)",
  bgColor = "var(--border-subtle)",
  animated = true,
  label,
  showPercentage = true,
}) => {
  const percentage = Math.min((value / max) * 100, 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={bgColor}
          strokeWidth={strokeWidth}
        />
        
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={animated ? { strokeDashoffset: circumference } : false}
          animate={{ strokeDashoffset }}
          transition={{
            duration: 1.2,
            ease: [0.4, 0, 0.2, 1],
          }}
        />
      </svg>
      
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {showPercentage && (
          <motion.span
            className="text-2xl font-bold text-[var(--text-main)]"
            initial={animated ? { opacity: 0, scale: 0.5 } : false}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            {Math.round(percentage)}%
          </motion.span>
        )}
        {label && (
          <motion.span
            className="text-xs text-[var(--text-muted)]"
            initial={animated ? { opacity: 0 } : false}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {label}
          </motion.span>
        )}
      </div>
    </div>
  );
};

// Metric card with live pulse animation
interface LiveMetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  isLive?: boolean;
  icon?: React.ReactNode;
  color?: string;
}

export const LiveMetricCard: React.FC<LiveMetricCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  isLive = true,
  icon,
  color = "var(--primary)",
}) => {
  return (
    <motion.div
      className="relative p-6 rounded-2xl bg-[var(--surface-bg)] border border-[var(--border)] overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
    >
      {/* Live indicator */}
      {isLive && (
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Live</span>
          <motion.div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: color }}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [1, 0.7, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>
      )}

      {/* Icon */}
      {icon && (
        <motion.div
          className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
          style={{ backgroundColor: `${color}20` }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        >
          <div style={{ color }}>{icon}</div>
        </motion.div>
      )}

      {/* Value */}
      <motion.div
        className="text-3xl font-bold text-[var(--text-main)] mb-1"
        key={value}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {value}
      </motion.div>

      {/* Title */}
      <div className="text-sm text-[var(--text-muted)] mb-2">{title}</div>

      {/* Trend */}
      {trend && (
        <motion.div
          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
            trend.isPositive
              ? "bg-[var(--success-bg)] text-[var(--success)]"
              : "bg-[var(--error-bg)] text-[var(--error)]"
          }`}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
        </motion.div>
      )}

      {/* Subtitle */}
      {subtitle && (
        <div className="text-xs text-[var(--text-muted)] mt-2">{subtitle}</div>
      )}
    </motion.div>
  );
};
