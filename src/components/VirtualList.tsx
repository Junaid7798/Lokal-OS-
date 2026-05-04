import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from 'react';

interface VirtualListProps<T> {
  items: T[];
  height?: number | string;
  width?: number | string;
  itemSize?: number;
  overscanCount?: number;
  renderItem: (
    item: T,
    index: number,
    style: React.CSSProperties
  ) => React.ReactNode;
  keyExtractor: (item: T, index: number) => string;
  className?: string;
}

export function VirtualList<T>({
  items,
  height = 400,
  width = '100%',
  itemSize = 60,
  overscanCount = 5,
  renderItem,
  keyExtractor,
  className,
}: VirtualListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height:
            typeof height === 'number' ? height : entry.contentRect.height,
        });
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, [height]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const totalHeight = items.length * itemSize;
  const startIndex = Math.max(
    0,
    Math.floor(scrollTop / itemSize) - overscanCount
  );
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + dimensions.height) / itemSize) + overscanCount
  );

  const visibleItems = useMemo(() => {
    const result: Array<{
      item: T;
      index: number;
      style: React.CSSProperties;
    }> = [];
    for (let i = startIndex; i <= endIndex; i++) {
      if (items[i]) {
        result.push({
          item: items[i],
          index: i,
          style: {
            position: 'absolute' as const,
            top: i * itemSize,
            left: 0,
            right: 0,
            height: itemSize,
          },
        });
      }
    }
    return result;
  }, [items, startIndex, endIndex, itemSize]);

  if (items.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ height, width, overflow: 'auto', position: 'relative' }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visibleItems.map(({ item, index, style }) => (
          <div key={keyExtractor(item, index)} style={style}>
            {renderItem(item, index, style)}
          </div>
        ))}
      </div>
    </div>
  );
}

interface AutoSizerProps {
  children: (size: { width: number; height: number }) => React.ReactNode;
  defaultHeight?: number;
}

export function AutoSizer({ children, defaultHeight = 400 }: AutoSizerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: defaultHeight });

  useEffect(() => {
    if (!ref.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height || defaultHeight,
        });
      }
    });

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [defaultHeight]);

  return (
    <div ref={ref} style={{ width: '100%', height: '100%' }}>
      {size.width > 0 ? children(size) : null}
    </div>
  );
}

interface VirtualTableProps<T> {
  data: T[];
  columns: Array<{
    key: string;
    width: number;
    header: string;
    render?: (item: T) => React.ReactNode;
  }>;
  height?: number;
  rowHeight?: number;
  onRowClick?: (item: T) => void;
  keyExtractor: (item: T) => string;
}

export function VirtualTable<T>({
  data,
  columns,
  height = 400,
  rowHeight = 48,
  onRowClick,
  keyExtractor,
}: VirtualTableProps<T>) {
  const totalWidth = columns.reduce((sum, col) => sum + col.width, 0);

  const renderRow = useCallback(
    (item: T, index: number, style: React.CSSProperties) => (
      <div
        className="flex items-center border-b hover:bg-muted/50 cursor-pointer transition-colors"
        style={{ ...style, width: totalWidth }}
        onClick={() => onRowClick?.(item)}
      >
        {columns.map((col) => (
          <div
            key={col.key}
            style={{ width: col.width }}
            className="px-3 truncate text-sm"
          >
            {col.render
              ? col.render(item)
              : String((item as Record<string, unknown>)[col.key] ?? '')}
          </div>
        ))}
      </div>
    ),
    [columns, onRowClick, totalWidth]
  );

  return (
    <VirtualList
      items={data}
      height={height}
      itemSize={rowHeight}
      renderItem={renderRow}
      keyExtractor={keyExtractor}
      className="border rounded-lg overflow-hidden"
    />
  );
}
