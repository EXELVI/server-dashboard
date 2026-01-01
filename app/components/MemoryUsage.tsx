'use client'

import React from 'react'
import { BarChart, Bar, CartesianGrid, XAxis, YAxis } from 'recharts'
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { LoadingState } from './utilities/LoadingState'
import { EmptyState } from './utilities/EmptyState'
import { getTranslations } from '@/lib/translations'

const translations = getTranslations(process.env.NEXT_PUBLIC_LOCALE || undefined)

const chartConfig = {
  used: {
    label: translations.memory.labels.used,
    color: "var(--chart-1)",
  },
  cache: {
    label: translations.memory.labels.cache,
    color: "var(--chart-2)",
  },
  free: {
    label: translations.memory.labels.free,
    color: "var(--chart-unused)",
  },
} satisfies ChartConfig


const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload || !payload.length) return null
  
  return (
    <div className="rounded-lg border bg-background p-2 shadow-sm">
      <div className="grid gap-2">
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2">
            <div 
              className="h-3 w-3 shrink-0 rounded-[2px]" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-xs text-muted-foreground">
              {entry.name}: {entry.value >= 1024 
                ? `${(entry.value / 1024).toFixed(2)} GB` 
                : `${entry.value.toFixed(2)} MB`}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

const swapChartConfig = {
  used: {
    label: translations.memory.labels.used,
    color: "var(--chart-1)",
  },
  free: {
    label: translations.memory.labels.free,
    color: "var(--chart-unused)",
  },
} satisfies ChartConfig

interface MemoryData {
  total: string
  used: string
  cache: string
  free: string
}

interface SwapData {
  total: string
  used: string
  free: string
}

interface MemoryUsageProps {
  memory?: MemoryData
  swap?: SwapData
  loading?: boolean
}

const MemoryUsage = ({ memory, swap, loading }: MemoryUsageProps) => {
  if (loading) {
    return (
      <LoadingState message={translations.memory.loading} height="h-full"/>
    )
  }

  if (!memory || !swap) {
    return (
      <EmptyState message={translations.memory.empty} height="h-full"/>
    )
  }

  const totalMemory = parseFloat(memory.total)
  const usedMemory = parseFloat(memory.used)
  const cacheMemory = parseFloat(memory.cache)
  const freeMemory = parseFloat(memory.free)

  const memUsagePercent = Math.min(100, (usedMemory / totalMemory) * 100).toFixed(1)
  const cachePercent = Math.min(100, (cacheMemory / totalMemory) * 100).toFixed(1)
  const freePercent = Math.min(100, (freeMemory / totalMemory) * 100).toFixed(1)

  const swapTotal = parseFloat(swap.total)
  const swapUsed = parseFloat(swap.used)
  const swapFree = parseFloat(swap.free)

  const swapUsagePercent= swapTotal > 0 ? Math.min(100, (swapUsed / swapTotal) * 100).toFixed(1) : '0'

  const barData = [
    {
      name: translations.memory.labels.ram,
      used: usedMemory,
      cache: cacheMemory,
      free: freeMemory,
    },
  ]

  const swapBarData = [
    {
      name: translations.memory.labels.swap,
      used: swapUsed,
      free: swapFree,
    },
  ]

  return (
  
      <div className="flex flex-col h-full">
        <div className="grid grid-cols-3 gap-4 mb-4">
          <MemoryMetric
            label={translations.memory.labels.ram}
            used={`${usedMemory.toFixed(1)} MB`}
            total={`${totalMemory.toFixed(1)} MB`}
            percent={parseFloat(memUsagePercent)}
            color="chart-1"
          />
          <MemoryMetric
            label={translations.memory.labels.cache}
            used={`${cacheMemory.toFixed(1)} MB`}
            total={`${totalMemory.toFixed(1)} MB`}
            percent={parseFloat(cachePercent)}
            color="chart-2"
          />
          <MemoryMetric
            label={translations.memory.labels.swap}
            used={`${swapUsed.toFixed(1)} MB`}
            total={`${swapTotal.toFixed(1)} MB`}
            percent={parseFloat(swapUsagePercent)}
            color="chart-3"
          />
        </div>

        <div className="flex-1 w-full grid grid-cols-2 h-full">
          <ChartContainer config={chartConfig} className="w-full h-full">
            <BarChart data={barData}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="name" />
              <YAxis domain={[0, Math.floor(totalMemory)]} />
              <ChartTooltip
                cursor={false}
                content={<CustomTooltip config={chartConfig} />}
              />
              <Bar dataKey="used" stackId="a" fill="var(--color-used)" radius={[0, 0, 0, 0]} />
              <Bar dataKey="cache" stackId="a" fill="var(--color-cache)" radius={[0, 0, 0, 0]} />
              <Bar dataKey="free" stackId="a" fill="var(--color-free)" radius={[0, 0, 0, 0]} />
              <ChartLegend />
            </BarChart>
          </ChartContainer>
          <ChartContainer config={chartConfig} className="w-full h-full">
            <BarChart data={swapBarData}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="name" />
              <YAxis domain={[0, swapTotal]} />
              <ChartTooltip
              cursor={false}
              content={<CustomTooltip config={swapChartConfig} />}
              />
              <Bar dataKey="used" stackId="a" fill="var(--color-used)" radius={[0, 0, 0, 0]} />
              <Bar dataKey="free" stackId="a" fill="var(--color-free)" radius={[0, 0, 0, 0]} />
              <ChartLegend />
            </BarChart>
          </ChartContainer>
        </div>
      </div> 
  )
}

interface MemoryMetricProps {
  label: string
  used: string
  total: string
  percent: number
  color: string
}

const MemoryMetric = ({ label, used, total, percent, color }: MemoryMetricProps) => {
  const colorMap = {
    'chart-1': 'bg-chart-1',
    'chart-2': 'bg-chart-2',
    'chart-unused': 'bg-chart-3',
  }

  const colorClass = colorMap[color as keyof typeof colorMap] || 'bg-primary'

  return (
    <div className="bg-muted p-3 rounded">
      <div className="flex justify-between items-center mb-1">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-xs font-semibold">{percent.toFixed(1)}%</div>
      </div>
      <div className="bg-muted-foreground/20 h-2 rounded-full overflow-hidden mb-2">
        <div
          className={`h-full ${colorClass}`}
          style={{ width: `${percent}%` }}
        ></div>
      </div>
      <div className="text-xs text-muted-foreground flex justify-between">
        <span>{used}</span>
        <span>{translations.memory.labels.of} {total}</span>
      </div>
    </div>
  )
}

export default MemoryUsage
