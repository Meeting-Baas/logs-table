"use client"

import type { SystemMetrics } from "@/components/logs-table/types"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import type { ChartConfig } from "@/components/ui/chart"
import {
    ChartContainer,
    ChartLegend,
    ChartLegendContent,
    ChartTooltip,
} from "@/components/ui/chart"
import { cn } from "@/lib/utils"
import { Download } from "lucide-react"
import { useMemo, useState } from "react"
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { Button } from "../ui/button"

interface MemoryViewerProps {
    metrics: SystemMetrics[]
    logsUrl?: string
}

interface ChartDataPoint {
    timestamp: string
    time: string
    systemMemoryPercent: number
    chromeMemory: number
    ffmpegMemory: number
    chromeCpu: number
    chromeProcessCount: number
}

type SubTabType = "memory" | "performance"

interface TooltipPayloadEntry {
    dataKey: string
    color: string
    value: number | string
    name?: string
}

interface CustomTooltipProps {
    active?: boolean
    payload?: TooltipPayloadEntry[]
    label?: string
    config?: ChartConfig
}

// Custom tooltip component with larger fonts and size
const CustomTooltip = ({ active, payload, label, config }: CustomTooltipProps) => {
    if (!active || !payload || payload.length === 0) return null

    return (
        <div className="bg-background border rounded-lg shadow-lg p-4 min-w-[200px]">
            <p className="font-semibold text-base mb-3 text-foreground">{label}</p>
            <div className="space-y-2">
                {payload.map((entry: TooltipPayloadEntry, index: number) => {
                    const configItem = config?.[entry.dataKey]
                    const color = configItem?.color || entry.color
                    const label = configItem?.label || entry.dataKey

                    return (
                        <div key={index} className="flex items-center gap-2">
                            <div
                                className="w-3 h-3 rounded-full flex-shrink-0"
                                style={{ backgroundColor: color }}
                            />
                            <span className="text-sm font-medium text-foreground">
                                {label}:
                            </span>
                            <span className="text-sm font-bold text-foreground ml-auto">
                                {typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}
                            </span>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

// Using explicit colors that work well together
// TODO: Make this dynamic based on the theme
const colors = {
    systemMemoryPercent: "#3b82f6", // Blue
    chromeMemory: "#10b981", // Green  
    ffmpegMemory: "#f59e0b", // Amber
    chromeCpu: "#ef4444", // Red
    chromeProcessCount: "#8b5cf6", // Purple
}

const memoryChartConfig = {
    systemMemoryPercent: {
        label: "System Memory %",
        color: colors.systemMemoryPercent,
    },
    chromeMemory: {
        label: "Chrome Memory (GB)",
        color: colors.chromeMemory,
    },
    ffmpegMemory: {
        label: "FFmpeg Memory (GB)",
        color: colors.ffmpegMemory,
    },
} satisfies ChartConfig

const performanceChartConfig = {
    chromeCpu: {
        label: "Chrome CPU %",
        color: colors.chromeCpu,
    },
    chromeProcessCount: {
        label: "Chrome Processes",
        color: colors.chromeProcessCount,
    },
} satisfies ChartConfig

export function MemoryViewer({ metrics, logsUrl }: MemoryViewerProps) {
    const [activeSubTab, setActiveSubTab] = useState<SubTabType>("memory")

    const chartData = useMemo(() => {
        return metrics.map((metric): ChartDataPoint => {
            const date = new Date(metric.timestamp)
            const ffmpegMemory = metric.processes.ffmpeg.reduce((sum, process) => sum + process.memory, 0)

            return {
                timestamp: metric.timestamp,
                time: date.toLocaleTimeString(),
                systemMemoryPercent: metric.system.memoryPercent,
                chromeMemory: metric.processes.chrome.memory,
                ffmpegMemory,
                chromeCpu: metric.processes.chrome.cpu,
                chromeProcessCount: metric.processes.chrome.count
            }
        })
    }, [metrics])

    const handleDownloadLogs = () => {
        if (logsUrl) {
            window.open(logsUrl, "_blank")
        }
    }

    if (metrics.length === 0) {
        return (
            <div className="flex h-96 items-center justify-center text-muted-foreground">
                No system metrics data available
            </div>
        )
    }

    const subTabs = [
        { id: "memory", label: "Memory Usage", description: "Memory consumption in GB and system memory %" },
        { id: "performance", label: "Performance", description: "CPU usage % and process counts" }
    ] as const

    return (
        <div className="w-full space-y-4">
            {/* Download button */}
            <div className="flex justify-end">
                <Button
                    onClick={handleDownloadLogs}
                    variant="outline"
                    size="sm"
                    disabled={!logsUrl}
                >
                    <Download className="mr-2 h-4 w-4" />
                    Download Raw Logs
                </Button>
            </div>

            {/* Sub-tab Navigation */}
            <div className="flex border-b">
                {subTabs.map((tab) => (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveSubTab(tab.id)}
                        className={cn(
                            "flex flex-col items-start gap-1 px-4 py-3 text-sm border-b-2 transition-colors",
                            activeSubTab === tab.id
                                ? "border-primary text-primary"
                                : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground"
                        )}
                    >
                        <span className="font-medium">{tab.label}</span>
                        <span className="text-xs text-muted-foreground">{tab.description}</span>
                    </button>
                ))}
            </div>

            {/* Memory Usage Chart */}
            {activeSubTab === "memory" && (
                <Card className="w-full">
                    <CardHeader>
                        <CardTitle>Memory Usage Over Time</CardTitle>
                        <CardDescription>
                            System memory percentage and process memory usage in GB
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="w-full p-0">
                        <div className="w-full h-[600px] px-6 pb-6">
                            <ChartContainer config={memoryChartConfig} className="w-full h-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart
                                        data={chartData}
                                        margin={{
                                            top: 20,
                                            right: 60,
                                            left: 60,
                                            bottom: 60,
                                        }}
                                    >
                                        <defs>
                                            <linearGradient id="systemMemoryGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={colors.systemMemoryPercent} stopOpacity={0.3} />
                                                <stop offset="95%" stopColor={colors.systemMemoryPercent} stopOpacity={0.1} />
                                            </linearGradient>
                                            <linearGradient id="chromeMemoryGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={colors.chromeMemory} stopOpacity={0.3} />
                                                <stop offset="95%" stopColor={colors.chromeMemory} stopOpacity={0.1} />
                                            </linearGradient>
                                            <linearGradient id="ffmpegMemoryGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={colors.ffmpegMemory} stopOpacity={0.3} />
                                                <stop offset="95%" stopColor={colors.ffmpegMemory} stopOpacity={0.1} />
                                            </linearGradient>
                                        </defs>

                                        <XAxis
                                            dataKey="time"
                                            tickLine={false}
                                            axisLine={false}
                                            tickMargin={8}
                                            interval="preserveStartEnd"
                                            tick={{ fontSize: 12 }}
                                        />
                                        <YAxis
                                            yAxisId="memory"
                                            orientation="left"
                                            tick={{ fontSize: 12 }}
                                            tickLine={false}
                                            axisLine={false}
                                            label={{ value: 'Memory (GB)', angle: -90, position: 'insideLeft' }}
                                        />
                                        <YAxis
                                            yAxisId="percent"
                                            orientation="right"
                                            tick={{ fontSize: 12 }}
                                            tickLine={false}
                                            axisLine={false}
                                            label={{ value: 'System Memory %', angle: 90, position: 'insideRight' }}
                                        />
                                        <ChartTooltip
                                            content={<CustomTooltip config={memoryChartConfig} />}
                                        />
                                        <ChartLegend content={<ChartLegendContent />} />

                                        {/* Memory in GB on left axis */}
                                        <Area
                                            yAxisId="memory"
                                            type="monotone"
                                            dataKey="chromeMemory"
                                            stroke={colors.chromeMemory}
                                            fill="url(#chromeMemoryGradient)"
                                            strokeWidth={2}
                                            name="Chrome Memory (GB)"
                                        />
                                        <Area
                                            yAxisId="memory"
                                            type="monotone"
                                            dataKey="ffmpegMemory"
                                            stroke={colors.ffmpegMemory}
                                            fill="url(#ffmpegMemoryGradient)"
                                            strokeWidth={2}
                                            name="FFmpeg Memory (GB)"
                                        />

                                        {/* System memory percentage on right axis */}
                                        <Area
                                            yAxisId="percent"
                                            type="monotone"
                                            dataKey="systemMemoryPercent"
                                            stroke={colors.systemMemoryPercent}
                                            fill="url(#systemMemoryGradient)"
                                            strokeWidth={2}
                                            name="System Memory %"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </ChartContainer>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Performance Chart */}
            {activeSubTab === "performance" && (
                <Card className="w-full">
                    <CardHeader>
                        <CardTitle>Performance Metrics Over Time</CardTitle>
                        <CardDescription>
                            CPU usage percentage and Chrome process counts
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="w-full p-0">
                        <div className="w-full h-[600px] px-6 pb-6">
                            <ChartContainer config={performanceChartConfig} className="w-full h-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart
                                        data={chartData}
                                        margin={{
                                            top: 20,
                                            right: 60,
                                            left: 60,
                                            bottom: 60,
                                        }}
                                    >
                                        <defs>
                                            <linearGradient id="chromeCpuGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={colors.chromeCpu} stopOpacity={0.3} />
                                                <stop offset="95%" stopColor={colors.chromeCpu} stopOpacity={0.1} />
                                            </linearGradient>
                                            <linearGradient id="chromeProcessGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={colors.chromeProcessCount} stopOpacity={0.3} />
                                                <stop offset="95%" stopColor={colors.chromeProcessCount} stopOpacity={0.1} />
                                            </linearGradient>
                                        </defs>

                                        <XAxis
                                            dataKey="time"
                                            tickLine={false}
                                            axisLine={false}
                                            tickMargin={8}
                                            interval="preserveStartEnd"
                                            tick={{ fontSize: 12 }}
                                        />
                                        <YAxis
                                            yAxisId="cpu"
                                            orientation="left"
                                            tick={{ fontSize: 12 }}
                                            tickLine={false}
                                            axisLine={false}
                                            label={{ value: 'CPU %', angle: -90, position: 'insideLeft' }}
                                        />
                                        <YAxis
                                            yAxisId="processes"
                                            orientation="right"
                                            tick={{ fontSize: 12 }}
                                            tickLine={false}
                                            axisLine={false}
                                            label={{ value: 'Process Count', angle: 90, position: 'insideRight' }}
                                        />
                                        <ChartTooltip
                                            content={<CustomTooltip config={performanceChartConfig} />}
                                        />
                                        <ChartLegend content={<ChartLegendContent />} />

                                        {/* CPU percentage on left axis */}
                                        <Area
                                            yAxisId="cpu"
                                            type="monotone"
                                            dataKey="chromeCpu"
                                            stroke={colors.chromeCpu}
                                            fill="url(#chromeCpuGradient)"
                                            strokeWidth={2}
                                            name="Chrome CPU %"
                                        />

                                        {/* Process count on right axis */}
                                        <Area
                                            yAxisId="processes"
                                            type="monotone"
                                            dataKey="chromeProcessCount"
                                            stroke={colors.chromeProcessCount}
                                            fill="url(#chromeProcessGradient)"
                                            strokeWidth={2}
                                            name="Chrome Processes"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </ChartContainer>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Summary Stats */}
            <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base">Memory Usage</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1 text-sm">
                        <div>Max Chrome: {Math.max(...chartData.map(d => d.chromeMemory)).toFixed(2)} GB</div>
                        <div>Avg Chrome: {(chartData.reduce((sum, d) => sum + d.chromeMemory, 0) / chartData.length).toFixed(2)} GB</div>
                        <div>Max System: {Math.max(...chartData.map(d => d.systemMemoryPercent)).toFixed(1)}%</div>
                        {chartData.some(d => d.ffmpegMemory > 0) && (
                            <div>Max FFmpeg: {Math.max(...chartData.map(d => d.ffmpegMemory)).toFixed(2)} GB</div>
                        )}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base">CPU Usage</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1 text-sm">
                        <div>Max Chrome: {Math.max(...chartData.map(d => d.chromeCpu)).toFixed(1)}%</div>
                        <div>Avg Chrome: {(chartData.reduce((sum, d) => sum + d.chromeCpu, 0) / chartData.length).toFixed(1)}%</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base">Process Count</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1 text-sm">
                        <div>Max Processes: {Math.max(...chartData.map(d => d.chromeProcessCount))}</div>
                        <div>Avg Processes: {Math.round(chartData.reduce((sum, d) => sum + d.chromeProcessCount, 0) / chartData.length)}</div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
} 