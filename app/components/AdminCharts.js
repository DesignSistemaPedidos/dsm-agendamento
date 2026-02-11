'use client';

import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
    LineChart, Line, PieChart, Pie, Cell
} from 'recharts';

const COLORS = ['#D4A853', '#22C55E', '#EF4444', '#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B'];

export function RevenueChart({ data }) {
    return (
        <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
                <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="date" stroke="#9CA3AF" tick={{ fill: '#9CA3AF' }} />
                    <YAxis stroke="#9CA3AF" tick={{ fill: '#9CA3AF' }} />
                    <Tooltip
                        contentStyle={{ background: '#1A1A2E', border: '1px solid #333', color: '#FFF' }}
                        itemStyle={{ color: '#FFF' }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="income" name="Receitas" stroke="#22C55E" strokeWidth={2} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="expense" name="Despesas" stroke="#EF4444" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}

export function BarberPerformanceChart({ data }) {
    return (
        <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
                <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={false} />
                    <XAxis type="number" stroke="#9CA3AF" tick={{ fill: '#9CA3AF' }} />
                    <YAxis dataKey="name" type="category" width={100} stroke="#9CA3AF" tick={{ fill: '#9CA3AF' }} />
                    <Tooltip
                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                        contentStyle={{ background: '#1A1A2E', border: '1px solid #333', color: '#FFF' }}
                    />
                    <Legend />
                    <Bar dataKey="revenue" name="Faturamento (R$)" fill="#D4A853" radius={[0, 4, 4, 0]} barSize={20} />
                    <Bar dataKey="appointments" name="Agendamentos" fill="#3B82F6" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

export function ExpenseBreakdownChart({ data }) {
    if (!data || data.length === 0) return <div className="text-gray text-center p-8">Sem despesas registradas.</div>;

    return (
        <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip
                        contentStyle={{ background: '#1A1A2E', border: '1px solid #333', color: '#FFF' }}
                    />
                    <Legend
                        layout="vertical"
                        verticalAlign="middle"
                        align="right"
                        wrapperStyle={{ color: '#FFF' }}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}
