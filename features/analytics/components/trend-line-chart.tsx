import { useMemo, useState } from 'react';
import { type LayoutChangeEvent,StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/theme';

type ChartPoint = {
  x: number;
  y: number;
  value: number;
};

type TrendLineChartProps = {
  data: number[];
  labels?: string[];
  height?: number;
  lineColor?: string;
  lastPointColor?: string;
  chartBackgroundColor?: string;
  gridColor?: string;
};

export function TrendLineChart({
  data,
  labels,
  height = 136,
  lineColor = Colors.primaryStrong,
  lastPointColor = Colors.secondary,
  chartBackgroundColor = Colors.surfaceAccent,
  gridColor = 'rgba(166, 183, 190, 0.12)',
}: TrendLineChartProps) {
  const [chartWidth, setChartWidth] = useState(0);

  const points = useMemo<ChartPoint[]>(() => {
    if (!data.length || chartWidth <= 0) {
      return [];
    }

    const maxValue = Math.max(...data);
    const minValue = Math.min(...data);
    const range = Math.max(maxValue - minValue, 1);
    const stepX = data.length > 1 ? chartWidth / (data.length - 1) : 0;

    return data.map((value, index) => ({
      x: stepX * index,
      y: ((maxValue - value) / range) * (height - 14) + 7,
      value,
    }));
  }, [chartWidth, data, height]);

  const lineSegments = useMemo(
    () =>
      points.slice(0, -1).map((point, index) => {
        const nextPoint = points[index + 1];
        const dx = nextPoint.x - point.x;
        const dy = nextPoint.y - point.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);

        return {
          id: `segment-${index}`,
          left: (point.x + nextPoint.x) / 2 - length / 2,
          top: (point.y + nextPoint.y) / 2 - 1,
          width: length,
          angle,
        };
      }),
    [points]
  );

  function handleLayout(event: LayoutChangeEvent) {
    const nextWidth = event.nativeEvent.layout.width;
    if (nextWidth !== chartWidth) {
      setChartWidth(nextWidth);
    }
  }

  return (
    <View style={styles.shell}>
      <View
        onLayout={handleLayout}
        style={[styles.chart, { backgroundColor: chartBackgroundColor, height }]}>
        <View style={[styles.gridLine, styles.gridTop, { backgroundColor: gridColor }]} />
        <View style={[styles.gridLine, styles.gridMiddle, { backgroundColor: gridColor }]} />
        <View style={[styles.gridLine, styles.gridBottom, { backgroundColor: gridColor }]} />

        {lineSegments.map((segment) => (
          <View
            key={segment.id}
            style={[
              styles.lineSegment,
              { backgroundColor: lineColor },
              {
                left: segment.left,
                top: segment.top,
                width: segment.width,
                transform: [{ rotateZ: `${segment.angle}rad` }],
              },
            ]}
          />
        ))}

        {points.map((point, index) => {
          const isLast = index === points.length - 1;
          return (
            <View
              key={`point-${index}`}
              style={[
                styles.point,
                {
                  backgroundColor: isLast ? lastPointColor : lineColor,
                },
                {
                  left: point.x - 5,
                  top: point.y - 5,
                },
              ]}
            />
          );
        })}
      </View>

      {labels && labels.length === data.length ? (
        <View style={styles.labelsRow}>
          {labels.map((label) => (
            <Text key={label} style={styles.labelText}>
              {label}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    gap: Spacing.sm,
  },
  chart: {
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  gridLine: {
    backgroundColor: 'rgba(166, 183, 190, 0.12)',
    height: 1,
    left: Spacing.md,
    position: 'absolute',
    right: Spacing.md,
  },
  gridTop: {
    top: Spacing.md,
  },
  gridMiddle: {
    top: '50%',
  },
  gridBottom: {
    bottom: Spacing.md,
  },
  lineSegment: {
    borderRadius: Radius.full,
    height: 2,
    position: 'absolute',
  },
  point: {
    borderColor: Colors.background,
    borderRadius: Radius.full,
    borderWidth: 2,
    height: 10,
    position: 'absolute',
    width: 10,
  },
  labelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xs,
  },
  labelText: {
    color: Colors.textSubtle,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
