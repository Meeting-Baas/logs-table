"use client"

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
    ChartTooltip,
} from "@/components/ui/chart"
import { Download } from "lucide-react"
import { useMemo } from "react"
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { Button } from "../ui/button"

interface SoundViewerProps {
    soundData: Array<{ timestamp: string, level: number }>
    logsUrl?: string
}

interface ChartDataPoint {
    timestamp: string
    time: string
    level: number
}

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
                                {typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value}
                            </span>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

const soundChartConfig = {
    level: {
        label: "Sound Level",
        color: "#06b6d4", // Cyan
    },
} satisfies ChartConfig

export function SoundViewer({ soundData, logsUrl }: SoundViewerProps) {
    const chartData = useMemo(() => {
        return soundData.map((item): ChartDataPoint => {
            const date = new Date(item.timestamp)
            return {
                timestamp: item.timestamp,
                time: date.toLocaleTimeString(),
                level: item.level
            }
        })
    }, [soundData])

    const handleDownloadLogs = () => {
        if (logsUrl) {
            window.open(logsUrl, "_blank")
        }
    }

    if (soundData.length === 0) {
        return (
            <div className="flex h-96 items-center justify-center text-muted-foreground">
                No sound data available
            </div>
        )
    }

    // Compute summary statistics
    const soundStats = useMemo(() => {
        if (chartData.length === 0) {
            return {
                max: 0,
                avg: 0,
                min: 0,
                hasSound: false,
            }
        }
        const levels = chartData.map(d => d.level)
        const max = Math.max(...levels)
        const min = Math.min(...levels)
        const avg = levels.reduce((sum, v) => sum + v, 0) / chartData.length
        const hasSound = levels.some(v => v > 0)
        return { max, avg, min, hasSound }
    }, [chartData])

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
                    Download Raw Sound Logs
                </Button>
            </div>

            {/* Sound Level Chart */}
            <Card className="w-full">
                <CardHeader>
                    <CardTitle>Sound Level Over Time</CardTitle>
                    <CardDescription>
                        Sound level measurements captured during the bot session
                    </CardDescription>
                </CardHeader>
                <CardContent className="w-full p-0">
                    <div className="w-full h-[600px] px-6 pb-6">
                        <ChartContainer config={soundChartConfig} className="w-full h-full">
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
                                        <linearGradient id="soundLevelGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.1} />
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
                                        tick={{ fontSize: 12 }}
                                        tickLine={false}
                                        axisLine={false}
                                        label={{ value: 'Sound Level', angle: -90, position: 'insideLeft' }}
                                    />
                                    <ChartTooltip
                                        content={<CustomTooltip config={soundChartConfig} />}
                                    />

                                    <Area
                                        type="monotone"
                                        dataKey="level"
                                        stroke="#06b6d4"
                                        fill="url(#soundLevelGradient)"
                                        strokeWidth={2}
                                        name="Sound Level"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                    </div>
                </CardContent>
            </Card>

            {/* Summary Stats */}
            <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base">Maximum</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1 text-sm">
                        <div>Max Level: {soundStats.max.toFixed(2)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base">Average</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1 text-sm">
                        <div>Avg Level: {soundStats.avg.toFixed(2)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base">Minimum</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1 text-sm">
                        <div>Min Level: {soundStats.min.toFixed(2)}</div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
} 