# Reusable Components Documentation

## Overview

These reusable components provide consistent styling, animations, and behavior across all pages. They handle common patterns like loading states, empty states, page headers, and lists with animations.

## Importing Components

```tsx
import {
  PageContainer,
  PageHeader,
  SectionHeader,
  SearchInput,
  StatsGrid,
  AnimatedList,
  GridList,
  LoadingState,
  EmptyState
} from "@/components";
```

## Components

### PageContainer

Wraps the entire page content with consistent max-width, spacing, and entry animation.

```tsx
<PageContainer>
  {/* Your page content */}
</PageContainer>
```

**Props:**
- `children`: ReactNode
- `className?`: string - Additional CSS classes

### PageHeader

Standard page header with icon, label, title, and optional subtitle.

```tsx
<PageHeader
  icon={Boxes}
  label="Inventory Management"
  title="Stock Control"
  subtitle="Manage your medicine availability and pricing"
>
  {/* Optional action buttons */}
  <Button>Add Product</Button>
</PageHeader>
```

**Props:**
- `icon`: LucideIcon
- `label`: string - Small text above title
- `title`: string - Main heading
- `subtitle?`: string - Description below title
- `children?`: ReactNode - Action buttons on the right

### SectionHeader

Smaller header for sections within a page.

```tsx
<SectionHeader
  icon={MessageCircle}
  title="Your Pharmacists"
  action={<Link href="/chats">View All</Link>}
/>
```

**Props:**
- `icon?`: LucideIcon
- `title`: string
- `action?`: ReactNode

### SearchInput

Consistent search input with icon and clear button.

```tsx
<SearchInput
  value={search}
  onChange={setSearch}
  placeholder="Search products..."
  showClear={true}
/>
```

**Props:**
- `value`: string
- `onChange`: (value: string) => void
- `placeholder?`: string
- `className?`: string
- `showClear?`: boolean

### StatsGrid

Grid of stat cards for dashboards.

```tsx
const stats = [
  { label: "Total", value: 100 },
  { label: "Active", value: 85, color: "success" },
  { label: "Warning", value: 10, color: "warning" },
  { label: "Error", value: 5, color: "error" }
];

<StatsGrid stats={stats} columns={4} />
```

**Props:**
- `stats`: Array of `{ label, value, color? }`
- `columns?`: 2 | 3 | 4

**Colors:**
- `default` - Standard text color
- `success` - Green (emerald-600)
- `warning` - Orange (amber-600)
- `error` - Red (red-600)

### AnimatedList

List with automatic loading states, empty states, and animations.

```tsx
<AnimatedList
  items={filteredItems}
  keyExtractor={(item) => item.id}
  renderItem={(item, index) => (
    <Card>
      <CardContent>{item.name}</CardContent>
    </Card>
  )}
  loading={loading}
  emptyIcon={Package}
  emptyTitle="No Items"
  emptyDescription="Start by adding your first item."
  searchTerm={search}
  onClearSearch={() => setSearch("")}
  emptyAction={<Button>Add Item</Button>}
/>
```

**Props:**
- `items`: T[]
- `keyExtractor`: (item: T) => string
- `renderItem`: (item: T, index: number) => ReactNode
- `loading?`: boolean
- `emptyIcon`: LucideIcon
- `emptyTitle`: string
- `emptyDescription`: string
- `emptyAction?`: ReactNode
- `searchTerm?`: string
- `onClearSearch?`: () => void
- `className?`: string

### GridList

Grid layout with animations.

```tsx
<GridList
  items={pharmacies}
  keyExtractor={(p) => p.id}
  columns={2}
  renderItem={(pharma) => (
    <Card>
      <CardContent>{pharma.name}</CardContent>
    </Card>
  )}
/>
```

**Props:**
- `items`: T[]
- `keyExtractor`: (item: T) => string
- `renderItem`: (item: T, index: number) => ReactNode
- `columns?`: 1 | 2 | 3 | 4
- `className?`: string

### LoadingState

Centered loading spinner with message.

```tsx
<LoadingState message="Loading inventory..." />
```

**Props:**
- `message?`: string

### EmptyState

Empty state with icon, title, description, and optional action.

```tsx
<EmptyState
  icon={Package}
  title="No Items Found"
  description="Add your first item to get started."
  action={<Button>Add Item</Button>}
/>
```

**Props:**
- `icon`: LucideIcon
- `title`: string
- `description`: string
- `action?`: ReactNode
- `searchTerm?`: string
- `onClearSearch?`: () => void

## Complete Page Example

```tsx
"use client";

import { Package, Plus } from "lucide-react";
import { useState, useMemo } from "react";
import { useInventory } from "@/hooks/useInventory";
import {
  PageContainer,
  PageHeader,
  SearchInput,
  StatsGrid,
  AnimatedList
} from "@/components";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";

export default function ExamplePage() {
  const { items, loading } = useInventory();
  const [search, setSearch] = useState("");

  const filteredItems = useMemo(() => 
    items.filter(i => i.name.includes(search)),
    [items, search]
  );

  const stats = useMemo(() => [
    { label: "Total", value: items.length },
    { label: "Active", value: items.filter(i => i.active).length, color: "success" as const }
  ], [items]);

  return (
    <PageContainer>
      <PageHeader
        icon={Package}
        label="Management"
        title="My Items"
        subtitle="Manage all your items here"
      >
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add New
        </Button>
      </PageHeader>

      {!loading && items.length > 0 && <StatsGrid stats={stats} />}

      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="Search items..."
      />

      <AnimatedList
        items={filteredItems}
        keyExtractor={(item) => item.id}
        renderItem={(item) => (
          <Card>
            <CardContent className="p-5">
              {item.name}
            </CardContent>
          </Card>
        )}
        loading={loading}
        emptyIcon={Package}
        emptyTitle="No Items"
        emptyDescription="Get started by adding your first item."
        searchTerm={search}
        onClearSearch={() => setSearch("")}
      />
    </PageContainer>
  );
}
```

## Benefits

1. **Consistency**: All pages use the same styling and patterns
2. **Less Code**: Reduce boilerplate in each page
3. **Easy Maintenance**: Change design in one place
4. **Type Safety**: Full TypeScript support
5. **Animations Included**: Automatic entry and list animations
6. **Loading States**: Built-in loading and empty states
7. **Search Support**: Automatic "no search results" handling

## Migration Guide

To migrate an existing page:

1. Replace `<motion.div initial... className="max-w-6xl...">` with `<PageContainer>`
2. Replace custom headers with `<PageHeader>`
3. Replace custom search inputs with `<SearchInput>`
4. Replace loading checks with `<LoadingState>` or use `AnimatedList`
5. Replace empty state JSX with `<EmptyState>`
6. Replace manual list animations with `AnimatedList` or `GridList`

The components handle all the common patterns automatically!
