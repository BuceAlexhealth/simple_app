"use client";

import { motion, AnimatePresence } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { LoadingState, EmptyState } from "@/components/layout/PageComponents";

interface AnimatedListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T) => string;
  loading?: boolean;
  emptyIcon: LucideIcon;
  emptyTitle: string;
  emptyDescription: string;
  emptyAction?: React.ReactNode;
  searchTerm?: string;
  onClearSearch?: () => void;
  filterActive?: boolean;
  filterEmptyTitle?: string;
  filterEmptyDescription?: string;
  className?: string;
}

export function AnimatedList<T>({
  items,
  renderItem,
  keyExtractor,
  loading = false,
  emptyIcon,
  emptyTitle,
  emptyDescription,
  emptyAction,
  searchTerm,
  onClearSearch,
  filterActive,
  filterEmptyTitle,
  filterEmptyDescription,
  className = "space-y-4"
}: AnimatedListProps<T>) {
  if (loading && items.length === 0) {
    return <LoadingState />;
  }

  if (items.length === 0) {
    const title = filterActive && filterEmptyTitle ? filterEmptyTitle : emptyTitle;
    const description = filterActive && filterEmptyDescription ? filterEmptyDescription : emptyDescription;
    return (
      <EmptyState
        icon={emptyIcon}
        title={title}
        description={description}
        action={emptyAction}
        searchTerm={searchTerm}
        onClearSearch={onClearSearch}
      />
    );
  }

  return (
    <div className={className}>
      <AnimatePresence mode="popLayout">
        {items.map((item, index) => (
          <motion.div
            key={keyExtractor(item)}
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ delay: index * 0.05 }}
          >
            {renderItem(item, index)}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

interface CardListProps<T> {
  items: T[];
  renderContent: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T) => string;
  className?: string;
  cardClassName?: string;
}

export function CardList<T>({
  items,
  renderContent,
  keyExtractor,
  className = "space-y-4",
  cardClassName = ""
}: CardListProps<T>) {
  return (
    <div className={className}>
      <AnimatePresence mode="popLayout">
        {items.map((item, index) => (
          <motion.div
            key={keyExtractor(item)}
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className={cardClassName}>
              <CardContent className="p-5">
                {renderContent(item, index)}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

interface GridListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T) => string;
  columns?: 1 | 2 | 3 | 4;
  className?: string;
}

export function GridList<T>({
  items,
  renderItem,
  keyExtractor,
  columns = 2,
  className = ""
}: GridListProps<T>) {
  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
  };

  return (
    <div className={`grid ${gridCols[columns]} gap-4 ${className}`}>
      <AnimatePresence mode="popLayout">
        {items.map((item, index) => (
          <motion.div
            key={keyExtractor(item)}
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ delay: index * 0.05 }}
          >
            {renderItem(item, index)}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
