"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Variants } from "framer-motion";
import {
  TrendingUp,
  ShoppingCart,
  Users,
  Package,
  Activity,
  Pause,
  Play,
  Download,
  RefreshCw,
  BarChart3,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  useRealtimeAnalytics,
  MetricType,
  TimeRange,
  isOrderEvent,
  isRevenueEvent,
  isInventoryEvent,
} from "@/hooks/useRealtimeAnalytics";
import {
  AnimatedBarChart,
  AnimatedLineChart,
  CircularProgress,
  LiveMetricCard,
} from "@/components/analytics/AnimatedCharts";

// ============================================================================
// PHARMACY ANALYTICS DASHBOARD
// ============================================================================

const METRIC_TYPES: { value: MetricType; label: string; icon: typeof Activity }[] = [
  { value: "orders", label: "Orders", icon: ShoppingCart },
  { value: "revenue", label: "Revenue", icon: TrendingUp },
  { value: "inventory", label: "Inventory", icon: Package },
  { value: "customers", label: "Customers", icon: Users },
];

const TIME_RANGES: { value: TimeRange; label: string }[] = [
  { value: "1h", label: "Last Hour" },
  { value: "24h", label: "Last 24 Hours" },
  { value: "7d", label: "Last 7 Days" },
  { value: "30d", label: "Last 30 Days" },
];

export default function PharmacyAnalyticsPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>("24h");
  const [selectedMetrics, setSelectedMetrics] = useState<MetricType[]>([
    "orders",
    "revenue",
    "inventory",
    "customers",
  ]);

  const { streams, aggregateMetrics, pauseStream, resumeStream, isLive } =
    useRealtimeAnalytics({
      timeRange,
      enabledMetricTypes: selectedMetrics,
      updateInterval: 2000,
    });

  const metrics = useMemo(() => aggregateMetrics(), [aggregateMetrics]);

  // Transform data for charts with memoization
  const chartData = useMemo(() => {
    const revenueData = streams.revenue.data.map((d: any, i: number) => ({
      value: d.current,
      label: i % 4 === 0 ? `${i}:00` : "",
    }));

    const orderStatusData = [
      {
        label: "Completed",
        value: streams.orders.data.filter((d: any) => d.status === "completed").length,
        color: "var(--success)",
      },
      {
        label: "Pending",
        value: streams.orders.data.filter((d: any) => d.status === "pending").length,
        color: "var(--warning)",
      },
      {
        label: "Cancelled",
        value: streams.orders.data.filter((d: any) => d.status === "cancelled").length,
        color: "var(--error)",
      },
    ];

    const lastInventoryData = streams.inventory.data[streams.inventory.data.length - 1];
    const inventoryCategories = lastInventoryData && 'categories' in lastInventoryData
      ? Object.entries(lastInventoryData.categories).map(
          ([key, value]) => ({
            label: key.charAt(0).toUpperCase() + key.slice(1),
            value: value as number,
            color: `hsl(${Math.random() * 360}, 70%, 50%)`,
          })
        )
      : [];

    return { revenueData, orderStatusData, inventoryCategories };
  }, [streams]);

  const toggleMetric = useCallback((metric: MetricType) => {
    setSelectedMetrics((prev) =>
      prev.includes(metric)
        ? prev.filter((m) => m !== metric)
        : [...prev, metric]
    );
  }, []);

  const exportData = useCallback(() => {
    const data = {
      timestamp: new Date().toISOString(),
      timeRange,
      metrics: {
        totalOrders: metrics.totalOrders,
        totalRevenue: metrics.totalRevenue,
        activeCustomers: metrics.activeCustomers,
        satisfactionScore: metrics.satisfactionScore,
      },
      streams: Object.fromEntries(
        Object.entries(streams).map(([key, value]) => [key, value.data])
      ),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
  }, [metrics, streams, timeRange]);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  };

  return (
    <div className="min-h-screen bg-[var(--app-bg)]">
      <main className="min-h-screen">
        <div className="p-6 lg:p-8 max-w-[1600px] mx-auto">
          {/* Header */}
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-[var(--text-main)] mb-2">
                  Analytics Dashboard
                </h1>
                <p className="text-[var(--text-muted)]">
                  Real-time insights into your pharmacy performance
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* Time Range Selector */}
                <div className="flex bg-[var(--surface-bg)] rounded-xl border border-[var(--border)] p-1">
                  {TIME_RANGES.map((range) => (
                    <button
                      key={range.value}
                      onClick={() => setTimeRange(range.value)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        timeRange === range.value
                          ? "bg-[var(--primary)] text-white shadow-lg"
                          : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
                      }`}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>

                {/* Live Toggle */}
                <Button
                  variant={isLive ? "default" : "outline"}
                  size="sm"
                  onClick={() =>
                    isLive
                      ? selectedMetrics.forEach(pauseStream)
                      : selectedMetrics.forEach(resumeStream)
                  }
                  className="gap-2"
                >
                  {isLive ? (
                    <>
                      <Pause className="w-4 h-4" /> Pause
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" /> Resume
                    </>
                  )}
                </Button>

                <Button variant="outline" size="sm" onClick={exportData} className="gap-2">
                  <Download className="w-4 h-4" /> Export
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Metric Type Filters */}
          <motion.div
            className="flex flex-wrap gap-2 mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {METRIC_TYPES.map((metric) => {
              const Icon = metric.icon;
              const isSelected = selectedMetrics.includes(metric.value);
              
              return (
                <motion.button
                  key={metric.value}
                  onClick={() => toggleMetric(metric.value)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${
                    isSelected
                      ? "bg-[var(--primary)] text-white border-[var(--primary)] shadow-lg shadow-[var(--primary-glow)]"
                      : "bg-[var(--surface-bg)] text-[var(--text-muted)] border-[var(--border)] hover:border-[var(--primary)]"
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{metric.label}</span>
                  {isSelected && streams[metric.value].status === "live" && (
                    <motion.div
                      className="w-2 h-2 rounded-full bg-white"
                      animate={{ scale: [1, 1.2, 1], opacity: [1, 0.5, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  )}
                </motion.button>
              );
            })}
          </motion.div>

          {/* Key Metrics Grid */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={itemVariants}>
              <LiveMetricCard
                title="Total Orders"
                value={metrics.totalOrders.toLocaleString()}
                subtitle="Across all pharmacies"
                trend={{ value: 12.5, isPositive: true }}
                icon={<ShoppingCart className="w-6 h-6" />}
                color="var(--primary)"
                isLive={selectedMetrics.includes("orders") && streams.orders.status === "live"}
              />
            </motion.div>

            <motion.div variants={itemVariants}>
              <LiveMetricCard
                title="Revenue"
                value={`$${metrics.totalRevenue.toLocaleString()}`}
                subtitle={`${Number(metrics.revenueChange) > 0 ? "+" : ""}${metrics.revenueChange}% vs last period`}
                trend={{ value: Number(metrics.revenueChange), isPositive: Number(metrics.revenueChange) > 0 }}
                icon={<TrendingUp className="w-6 h-6" />}
                color="var(--success)"
                isLive={selectedMetrics.includes("revenue") && streams.revenue.status === "live"}
              />
            </motion.div>

            <motion.div variants={itemVariants}>
              <LiveMetricCard
                title="Inventory Alerts"
                value={metrics.lowStockItems + metrics.outOfStockItems}
                subtitle={`${metrics.lowStockItems} low stock, ${metrics.outOfStockItems} out of stock`}
                trend={{ value: -5.2, isPositive: false }}
                icon={<Package className="w-6 h-6" />}
                color={metrics.lowStockItems + metrics.outOfStockItems > 10 ? "var(--error)" : "var(--warning)"}
                isLive={selectedMetrics.includes("inventory") && streams.inventory.status === "live"}
              />
            </motion.div>

            <motion.div variants={itemVariants}>
              <LiveMetricCard
                title="Active Customers"
                value={metrics.activeCustomers.toLocaleString()}
                subtitle={`Satisfaction: ${metrics.satisfactionScore}/5.0`}
                trend={{ value: 8.3, isPositive: true }}
                icon={<Users className="w-6 h-6" />}
                color="var(--info)"
                isLive={selectedMetrics.includes("customers") && streams.customers.status === "live"}
              />
            </motion.div>
          </motion.div>

          {/* Charts Grid */}
          <motion.div
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Revenue Chart */}
            <motion.div variants={itemVariants}>
              <Card className="h-[400px]">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[var(--success-bg)] rounded-lg">
                      <TrendingUp className="w-5 h-5 text-[var(--success)]" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Revenue Trends</CardTitle>
                      <p className="text-sm text-[var(--text-muted)]">
                        Real-time revenue monitoring
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                    <Clock className="w-4 h-4" />
                    Updated: {streams.revenue.lastUpdate
                      ? new Date(streams.revenue.lastUpdate).toLocaleTimeString()
                      : "Never"}
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  <AnimatedLineChart
                    data={chartData.revenueData}
                    height={280}
                    strokeColor="var(--success)"
                    showArea={true}
                  />
                </CardContent>
              </Card>
            </motion.div>

            {/* Order Status Chart */}
            <motion.div variants={itemVariants}>
              <Card className="h-[400px]">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[var(--primary-bg)] rounded-lg">
                      <BarChart3 className="w-5 h-5 text-[var(--primary)]" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Order Status</CardTitle>
                      <p className="text-sm text-[var(--text-muted)]">
                        Distribution by status
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="grid grid-cols-2 gap-4 h-full">
                    <div className="flex items-center justify-center">
                      <CircularProgress
                        value={metrics.completedOrders}
                        max={Math.max(metrics.totalOrders, 1)}
                        size={150}
                        color="var(--success)"
                        label="Completion Rate"
                      />
                    </div>
                    <div className="flex items-center">
                      <AnimatedBarChart
                        data={chartData.orderStatusData}
                        height={200}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Inventory Breakdown */}
            <motion.div variants={itemVariants}>
              <Card className="h-[400px]">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[var(--warning-bg)] rounded-lg">
                      <Package className="w-5 h-5 text-[var(--warning)]" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Inventory by Category</CardTitle>
                      <p className="text-sm text-[var(--text-muted)]">
                        Stock levels across categories
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  <AnimatedBarChart
                    data={chartData.inventoryCategories}
                    height={280}
                    barColor="var(--warning)"
                  />
                </CardContent>
              </Card>
            </motion.div>

            {/* System Status */}
            <motion.div variants={itemVariants}>
              <Card className="h-[400px]">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[var(--info-bg)] rounded-lg">
                      <Activity className="w-5 h-5 text-[var(--info)]" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">System Status</CardTitle>
                      <p className="text-sm text-[var(--text-muted)]">
                        Data stream health
                      </p>
                    </div>
                  </div>
                  <motion.div
                    className="flex items-center gap-2"
                    animate={isLive ? { opacity: [1, 0.5, 1] } : {}}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <div
                      className={`w-3 h-3 rounded-full ${
                        isLive ? "bg-[var(--success)]" : "bg-[var(--error)]"
                      }`}
                    />
                    <span className="text-sm font-medium">
                      {isLive ? "All Systems Operational" : "Paused"}
                    </span>
                  </motion.div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {METRIC_TYPES.map((metric) => {
                      const stream = streams[metric.value];
                      const Icon = metric.icon;

                      return (
                        <motion.div
                          key={metric.value}
                          className="flex items-center justify-between p-4 rounded-xl bg-[var(--surface-bg)] border border-[var(--border)]"
                          whileHover={{ scale: 1.02 }}
                        >
                          <div className="flex items-center gap-3">
                            <Icon className="w-5 h-5 text-[var(--text-muted)]" />
                            <span className="font-medium">{metric.label}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-[var(--text-muted)]">
                              {stream.data.length} data points
                            </span>
                            <motion.div
                              className={`w-2 h-2 rounded-full ${
                                stream.status === "live"
                                  ? "bg-[var(--success)]"
                                  : stream.status === "paused"
                                  ? "bg-[var(--warning)]"
                                  : "bg-[var(--error)]"
                              }`}
                              animate={
                                stream.status === "live"
                                  ? { scale: [1, 1.2, 1] }
                                  : {}
                              }
                              transition={{ duration: 1.5, repeat: Infinity }}
                            />
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
