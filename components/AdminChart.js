"use client";

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";

export default function AdminCharts({ data }) {
    return (
        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 shadow-xs mt-6">
            <h2 className="text-sm font-bold mb-6 text-gray-900 dark:text-white">New Users (Last 30 Days)</h2>

            <ResponsiveContainer width="100%" height={320}>
                <LineChart data={data} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:hidden" />
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" className="hidden dark:block" />
                    <XAxis 
                        dataKey="_id" 
                        stroke="#94a3b8" 
                        fontSize={11} 
                        tickLine={false} 
                        axisLine={false} 
                        dy={10}
                    />
                    <YAxis 
                        stroke="#94a3b8" 
                        fontSize={11} 
                        tickLine={false} 
                        axisLine={false} 
                        dx={-10}
                    />
                    <Tooltip 
                        contentStyle={{ 
                            backgroundColor: '#0f172a', 
                            border: '1px solid #1e293b', 
                            borderRadius: '12px',
                            fontSize: '12px',
                            color: '#f8fafc'
                        }}
                        itemStyle={{ color: '#818cf8' }}
                        labelStyle={{ color: '#94a3b8' }}
                        cursor={{ stroke: '#334155', strokeWidth: 1 }}
                    />
                    <Legend 
                        verticalAlign="top" 
                        height={36} 
                        iconType="circle"
                        iconSize={8}
                        wrapperStyle={{ fontSize: '12px', paddingBottom: '20px' }}
                    />
                    <Line 
                        type="monotone" 
                        dataKey="count" 
                        name="Registrations"
                        stroke="#6366f1" 
                        strokeWidth={3} 
                        dot={{ stroke: '#6366f1', strokeWidth: 2, r: 4, fill: '#fff' }}
                        activeDot={{ r: 6, strokeWidth: 0 }} 
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
