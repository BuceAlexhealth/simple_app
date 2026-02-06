import { useCallback, useEffect, useRef, useState } from "react";

// ============================================================================
// ADVANCED TYPESCRIPT PATTERNS
// ============================================================================

type MetricType = "orders" | "revenue" | "inventory" | "customers";
type TimeRange = "1h" | "24h" | "7d" | "30d";
type DataStatus = "connecting" | "live" | "paused" | "error";

// Discriminated union for different metric events
interface BaseMetricEvent {
  timestamp: number;
  metricType: MetricType;
}

interface OrderEvent extends BaseMetricEvent {
  metricType: "orders";
  data: {
    orderId: string;
    amount: number;
    status: "pending" | "completed" | "cancelled";
    pharmacyId: string;
  };
}

interface RevenueEvent extends BaseMetricEvent {
  metricType: "revenue";
  data: {
    current: number;
    previous: number;
    currency: string;
    breakdown: Record<string, number>;
  };
}

interface InventoryEvent extends BaseMetricEvent {
  metricType: "inventory";
  data: {
    lowStock: number;
    outOfStock: number;
    totalItems: number;
    categories: Record<string, number>;
  };
}

interface CustomerEvent extends BaseMetricEvent {
  metricType: "customers";
  data: {
    active: number;
    new: number;
    returning: number;
    satisfaction: number;
  };
}

type MetricEvent = OrderEvent | RevenueEvent | InventoryEvent | CustomerEvent;

// Type guards for runtime type checking
export const isOrderEvent = (event: MetricEvent): event is OrderEvent =>
  event.metricType === "orders";

export const isRevenueEvent = (event: MetricEvent): event is RevenueEvent =>
  event.metricType === "revenue";

export const isInventoryEvent = (event: MetricEvent): event is InventoryEvent =>
  event.metricType === "inventory";

export const isCustomerEvent = (event: MetricEvent): event is CustomerEvent =>
  event.metricType === "customers";

// Generic state management interface
interface DataStreamState<T extends MetricEvent> {
  data: T["data"][];
  status: DataStatus;
  lastUpdate: number | null;
  error: Error | null;
}

interface UseRealtimeAnalyticsOptions {
  timeRange: TimeRange;
  enabledMetricTypes: MetricType[];
  updateInterval?: number;
  onError?: (error: Error) => void;
}

// ============================================================================
// SIMULATED REAL-TIME DATA STREAM
// ============================================================================

const generateMockData = <T extends MetricEvent>(
  metricType: MetricType
): T["data"] => {
  const baseData: Record<MetricType, MetricEvent["data"]> = {
    orders: {
      orderId: `ord-${Math.random().toString(36).substr(2, 9)}`,
      amount: Math.floor(Math.random() * 500) + 20,
      status: ["pending", "completed", "cancelled"][
        Math.floor(Math.random() * 3)
      ] as "pending" | "completed" | "cancelled",
      pharmacyId: `pharm-${Math.floor(Math.random() * 5) + 1}`,
    },
    revenue: {
      current: Math.floor(Math.random() * 10000) + 5000,
      previous: Math.floor(Math.random() * 10000) + 5000,
      currency: "USD",
      breakdown: {
        prescriptions: Math.floor(Math.random() * 5000),
        overTheCounter: Math.floor(Math.random() * 3000),
        supplements: Math.floor(Math.random() * 2000),
      },
    },
    inventory: {
      lowStock: Math.floor(Math.random() * 50),
      outOfStock: Math.floor(Math.random() * 20),
      totalItems: Math.floor(Math.random() * 1000) + 500,
      categories: {
        antibiotics: Math.floor(Math.random() * 100),
        painRelief: Math.floor(Math.random() * 100),
        vitamins: Math.floor(Math.random() * 100),
        diabetes: Math.floor(Math.random() * 100),
      },
    },
    customers: {
      active: Math.floor(Math.random() * 500) + 100,
      new: Math.floor(Math.random() * 50),
      returning: Math.floor(Math.random() * 200) + 50,
      satisfaction: Number((Math.random() * 2 + 3).toFixed(2)),
    },
  };

  return baseData[metricType] as T["data"];
};

// ============================================================================
// CUSTOM HOOK: REAL-TIME ANALYTICS
// ============================================================================

export const useRealtimeAnalytics = ({
  timeRange,
  enabledMetricTypes,
  updateInterval = 2000,
  onError,
}: UseRealtimeAnalyticsOptions) => {
  const [streams, setStreams] = useState<
    Record<MetricType, DataStreamState<MetricEvent>>
  >({
    orders: { data: [], status: "connecting", lastUpdate: null, error: null },
    revenue: { data: [], status: "connecting", lastUpdate: null, error: null },
    inventory: {
      data: [],
      status: "connecting",
      lastUpdate: null,
      error: null,
    },
    customers: {
      data: [],
      status: "connecting",
      lastUpdate: null,
      error: null,
    },
  });

  const intervalRefs = useRef<Record<MetricType, NodeJS.Timeout | null>>({
    orders: null,
    revenue: null,
    inventory: null,
    customers: null,
  });

  const pauseStream = useCallback((metricType: MetricType) => {
    setStreams((prev) => ({
      ...prev,
      [metricType]: { ...prev[metricType], status: "paused" as DataStatus },
    }));

    if (intervalRefs.current[metricType]) {
      clearInterval(intervalRefs.current[metricType]!);
      intervalRefs.current[metricType] = null;
    }
  }, []);

  const resumeStream = useCallback(
    (metricType: MetricType) => {
      setStreams((prev) => ({
        ...prev,
        [metricType]: { ...prev[metricType], status: "live" as DataStatus },
      }));

      // Restart the interval
      intervalRefs.current[metricType] = setInterval(() => {
        setStreams((prev) => {
          const newData = generateMockData<MetricEvent>(metricType);
          const currentData = prev[metricType].data;
          const maxDataPoints =
            timeRange === "1h" ? 60 : timeRange === "24h" ? 24 : 30;

          return {
            ...prev,
            [metricType]: {
              ...prev[metricType],
              data: [...currentData.slice(-maxDataPoints + 1), newData],
              lastUpdate: Date.now(),
            },
          };
        });
      }, updateInterval);
    },
    [timeRange, updateInterval]
  );

  // Initialize data streams
  useEffect(() => {
    enabledMetricTypes.forEach((metricType) => {
      // Initial data population
      const initialDataPoints =
        timeRange === "1h" ? 60 : timeRange === "24h" ? 24 : 30;
      const initialData = Array.from({ length: initialDataPoints }, () =>
        generateMockData<MetricEvent>(metricType)
      );

      setStreams((prev) => ({
        ...prev,
        [metricType]: {
          ...prev[metricType],
          data: initialData,
          status: "live",
          lastUpdate: Date.now(),
        },
      }));

      // Start real-time updates
      resumeStream(metricType);
    });

    return () => {
      Object.values(intervalRefs.current).forEach((interval) => {
        if (interval) clearInterval(interval);
      });
    };
  }, [timeRange, enabledMetricTypes, resumeStream]);

  // Aggregate metrics with memoization potential
  const aggregateMetrics = useCallback(() => {
    const orders = streams.orders.data as OrderEvent["data"][];
    const revenue = streams.revenue.data as RevenueEvent["data"][];
    const inventory = streams.inventory.data as InventoryEvent["data"][];
    const customers = streams.customers.data as CustomerEvent["data"][];

    return {
      totalOrders: orders.length,
      completedOrders: orders.filter((o) => o.status === "completed").length,
      totalRevenue: revenue.length > 0 ? revenue[revenue.length - 1].current : 0,
      revenueChange:
        revenue.length > 0
          ? (
              ((revenue[revenue.length - 1].current -
                revenue[revenue.length - 1].previous) /
                revenue[revenue.length - 1].previous) *
              100
            ).toFixed(1)
          : "0",
      lowStockItems:
        inventory.length > 0 ? inventory[inventory.length - 1].lowStock : 0,
      outOfStockItems:
        inventory.length > 0 ? inventory[inventory.length - 1].outOfStock : 0,
      activeCustomers:
        customers.length > 0 ? customers[customers.length - 1].active : 0,
      satisfactionScore:
        customers.length > 0
          ? customers[customers.length - 1].satisfaction
          : 0,
    };
  }, [streams]);

  return {
    streams,
    aggregateMetrics,
    pauseStream,
    resumeStream,
    isLive: Object.values(streams).some((s) => s.status === "live"),
  };
};

export type { MetricEvent, MetricType, TimeRange, DataStatus, DataStreamState };
