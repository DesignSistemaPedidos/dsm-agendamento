'use client';

import { RevenueChart, BarberPerformanceChart, ExpenseBreakdownChart } from '@/app/components/AdminCharts';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
    const { user, isAdmin, loading: authLoading } = useAuth();
    const router = useRouter();

    const [activeView, setActiveView] = useState('dashboard');
    const [metrics, setMetrics] = useState({
        dailyAppointments: 0,
        weeklyAppointments: 0,
        monthlyRevenue: 0,
        monthlyExpenses: 0,
        balance: 0,
        activeBarbers: 0
    });

    // Chart State
    const [chartData, setChartData] = useState({
        revenue: [],
        barber: [],
        expenses: []
    });
    const [transactions, setTransactions] = useState([]);
    const [barbers, setBarbers] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [categories, setCategories] = useState([]);
    const [targetProfit, setTargetProfit] = useState(5000); // Meta padrão
    const [formData, setFormData] = useState({
        type: 'expense',
        category: '',
        description: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        payment_method: 'pix'
    });

    // Protect Route
    useEffect(() => {
        if (!authLoading && (!user || !isAdmin)) {
            router.push('/login');
        }
    }, [user, isAdmin, authLoading, router]);

    const handleLogout = async () => {
        const { signOut } = await import('../context/AuthContext'); // Dynamic import to avoid circular dep if needed, or just use context
        await supabase.auth.signOut();
        router.push('/login');
    };

    // ... inside component render

    return (
        <div className="page container">
            <div className="flex-between page-header">
                <div>
                    <h1>Painel Administrativo</h1>
                    <p>Visão geral e configurações da barbearia.</p>
                </div>
                <button
                    onClick={async () => {
                        await supabase.auth.signOut();
                        router.push('/login');
                    }}
                    className="btn btn-sm btn-outline text-red border-red-500 hover:bg-red-900/20"
                >
                    Sair
                </button>
            </div>

            {/* Admin Nav */}
            <div className="tabs mb-8" style={{ overflowX: 'auto' }}>
                <button className={`tab ${activeView === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveView('dashboard')}>📊 Dashboard</button>
                <button className={`tab ${activeView === 'financeiro' ? 'active' : ''}`} onClick={() => setActiveView('financeiro')}>💰 Financeiro</button>
                <button className={`tab ${activeView === 'barbeiros' ? 'active' : ''}`} onClick={() => setActiveView('barbeiros')}>👥 Barbeiros</button>
            </div>

            {loading && <div className="text-center p-8">Carregando dados...</div>}

            {!loading && activeView === 'dashboard' && (
                <div className="animate-fade-in">
                    <div className="grid-3 mb-8">
                        <div className="stat-card">
                            <span className="stat-label">Agendamentos Hoje</span>
                            <div className="stat-value">{metrics.dailyAppointments}</div>
                        </div>
                        <div className="stat-card">
                            <span className="stat-label">Agendamentos Semana</span>
                            <div className="stat-value">{metrics.weeklyAppointments}</div>
                        </div>
                        <div className="stat-card">
                            <span className="stat-label">Equipe Ativa</span>
                            <div className="stat-value">{metrics.activeBarbers}</div>
                        </div>
                        <div className="stat-card">
                            <span className="stat-label">Receita Mês</span>
                            <div className="stat-value text-gold">R$ {metrics.monthlyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                        </div>
                        <div className="stat-card">
                            <span className="stat-label">Despesas Mês</span>
                            <div className="stat-value text-red">R$ {metrics.monthlyExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                        </div>
                        <div className="stat-card">
                            <span className="stat-label">Saldo</span>
                            <div className={`stat-value ${metrics.balance >= 0 ? 'text-green' : 'text-red'}`}>R$ {metrics.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                        </div>
                    </div>

                    <div className="grid-2 gap-8 mb-8">
                        <div className="card">
                            <h3 className="mb-4">Desempenho da Equipe</h3>
                            <BarberPerformanceChart data={chartData.barber} />
                        </div>
                        <div className="card">
                            <h3 className="mb-4">Receita vs Despesas</h3>
                            <RevenueChart data={chartData.revenue} />
                        </div>
                    </div>

                    <div className="card">
                        <h3 className="mb-4">Últimas Movimentações</h3>
                        <TransactionTable transactions={transactions} />
                    </div>
                </div>
            )}

            {!loading && activeView === 'financeiro' && (
                <div className="animate-fade-in">
                    <div className="flex-between mb-6">
                        <h2>Gestão Financeira</h2>
                        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Nova Transação</button>
                    </div>

                    <div className="grid-3 mb-8">
                        <div className="card p-6" style={{ background: 'rgba(34, 197, 94, 0.05)', borderColor: 'var(--green-500)' }}>
                            <span className="text-sm font-bold text-green">RECEITAS (MÊS)</span>
                            <div className="text-2xl font-bold mt-2 text-white">R$ {metrics.monthlyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                        </div>
                        <div className="card p-6" style={{ background: 'rgba(239, 68, 68, 0.05)', borderColor: 'var(--red-500)' }}>
                            <span className="text-sm font-bold text-red">DESPESAS (MÊS)</span>
                            <div className="text-2xl font-bold mt-2 text-white">R$ {metrics.monthlyExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                        </div>
                        <div className="card p-6" style={{ background: 'rgba(212, 168, 83, 0.05)', borderColor: 'var(--gold-500)' }}>
                            <span className="text-sm font-bold text-gold">SALDO</span>
                            <div className="text-2xl font-bold mt-2 text-white">R$ {metrics.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                        </div>
                    </div>

                    <div className="grid-2 gap-8 mb-8">
                        <div className="card">
                            <h3 className="mb-4">Receita vs Despesas (Evolução)</h3>
                            <RevenueChart data={chartData.revenue} />
                        </div>
                        <div className="card">
                            <h3 className="mb-4">Distribuição de Despesas</h3>
                            <ExpenseBreakdownChart data={chartData.expenses} />
                        </div>
                    </div>

                    {/* Projeções Financeiras */}
                    <div className="card mb-8">
                        <h3 className="mb-4">🎯 Projeções e Metas</h3>
                        <div className="grid-2 gap-8">
                            <div>
                                <h4 className="text-gold mb-2">Ponto de Equilíbrio</h4>
                                <p className="text-sm text-gray mb-4">
                                    Quanto você precisa faturar para pagar todas as despesas fixas e variáveis atuais.
                                </p>
                                <div className="stat-value text-white mb-2">
                                    {metrics.averageTicket > 0
                                        ? Math.ceil(metrics.monthlyExpenses / metrics.averageTicket)
                                        : 0} <span className="text-sm font-normal text-gray">atendimentos/mês</span>
                                </div>
                                <p className="text-xs text-gray">
                                    Baseado no Ticket Médio de R$ {metrics.averageTicket?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
                                </p>
                            </div>

                            <div style={{ borderLeft: '1px solid #333', paddingLeft: '2rem' }}>
                                <h4 className="text-green mb-2">Meta de Lucro</h4>
                                <div className="flex gap-2 items-center mb-4">
                                    <label className="text-sm">Meta de Lucro Líquido (R$):</label>
                                    <input
                                        type="number"
                                        className="input py-1 px-2 w-32"
                                        value={targetProfit}
                                        onChange={(e) => setTargetProfit(Number(e.target.value))}
                                    />
                                </div>
                                <div className="stat-value text-white mb-2">
                                    {metrics.averageTicket > 0
                                        ? Math.ceil((metrics.monthlyExpenses + targetProfit) / metrics.averageTicket)
                                        : 0} <span className="text-sm font-normal text-gray">atendimentos totais/mês</span>
                                </div>
                                <p className="text-xs text-gray">
                                    Você precisa de <strong>{metrics.averageTicket > 0 ? (Math.ceil((metrics.monthlyExpenses + targetProfit) / metrics.averageTicket) - metrics.monthlyAppointments) : 0}</strong> atendimentos adicionais aos {metrics.monthlyAppointments} já realizados este mês.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Projeções Financeiras */}
                    <div className="card mb-8">
                        <h3 className="mb-4">🎯 Projeções e Metas</h3>
                        <div className="grid-2 gap-8">
                            <div>
                                <h4 className="text-gold mb-2">Ponto de Equilíbrio</h4>
                                <p className="text-sm text-gray mb-4">
                                    Quanto você precisa faturar para pagar todas as despesas fixas e variáveis atuais.
                                </p>
                                <div className="stat-value text-white mb-2">
                                    {metrics.averageTicket > 0
                                        ? Math.ceil(metrics.monthlyExpenses / metrics.averageTicket)
                                        : 0} <span className="text-sm font-normal text-gray">atendimentos/mês</span>
                                </div>
                                <p className="text-xs text-gray">
                                    Baseado no Ticket Médio de R$ {metrics.averageTicket?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
                                </p>
                            </div>

                            <div style={{ borderLeft: '1px solid #333', paddingLeft: '2rem' }}>
                                <h4 className="text-green mb-2">Meta de Lucro</h4>
                                <div className="flex gap-2 items-center mb-4">
                                    <label className="text-sm">Meta de Lucro Líquido (R$):</label>
                                    <input
                                        type="number"
                                        className="input py-1 px-2 w-32"
                                        value={targetProfit}
                                        onChange={(e) => setTargetProfit(Number(e.target.value))}
                                    />
                                </div>
                                <div className="stat-value text-white mb-2">
                                    {metrics.averageTicket > 0
                                        ? Math.ceil((metrics.monthlyExpenses + targetProfit) / metrics.averageTicket)
                                        : 0} <span className="text-sm font-normal text-gray">atendimentos totais/mês</span>
                                </div>
                                <p className="text-xs text-gray">
                                    Você precisa de <strong>{metrics.averageTicket > 0 ? (Math.ceil((metrics.monthlyExpenses + targetProfit) / metrics.averageTicket) - metrics.monthlyAppointments) : 0}</strong> atendimentos adicionais aos {metrics.monthlyAppointments} já realizados este mês.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <h3 className="mb-4">Extrato Completo</h3>
                        <TransactionTable transactions={transactions} />
                    </div>
                </div>
            )}

            {!loading && activeView === 'barbeiros' && (
                <div className="animate-fade-in">
                    <div className="flex-between mb-6">
                        <h2>Equipe</h2>
                        <button className="btn btn-primary" onClick={() => alert('Em breve')}>+ Novo Profissional</button>
                    </div>
                    <div className="grid-2">
                        {barbers.map(barber => (
                            <div key={barber.id} className="card flex-between">
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                    <img src={barber.avatar_url} alt={barber.name} className="avatar" />
                                    <div>
                                        <h3>{barber.name}</h3>
                                        <span className="text-gray text-sm">{barber.specialty}</span>
                                    </div>
                                </div>
                                <div className="flex-center gap-2">
                                    <span className={`badge ${barber.is_active ? 'badge-green' : 'badge-red'}`}>
                                        {barber.is_active ? 'Ativo' : 'Inativo'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Modal Nova Transação */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal">
                        <div className="flex-between mb-4">
                            <h3>Nova Transação</h3>
                            <button onClick={() => setShowModal(false)} className="text-gray">✕</button>
                        </div>
                        <form onSubmit={handleSaveTransaction} className="grid-1 gap-4">
                            <div>
                                <label className="label">Tipo</label>
                                <select
                                    className="input"
                                    value={formData.type}
                                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                                >
                                    <option value="income">Receita (Entrada)</option>
                                    <option value="expense">Despesa (Saída)</option>
                                </select>
                            </div>

                            <div>
                                <label className="label">Categoria</label>
                                {formData.type === 'expense' ? (
                                    <select
                                        className="input"
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                        required
                                    >
                                        <option value="">Selecione...</option>
                                        {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                        <option value="Outros">Outros</option>
                                    </select>
                                ) : (
                                    <input
                                        type="text"
                                        className="input"
                                        value="Serviço"
                                        readOnly
                                    />
                                )}
                            </div>

                            <div>
                                <label className="label">Descrição</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Ex: Conta de Luz"
                                    required
                                />
                            </div>

                            <div className="grid-2 gap-4">
                                <div>
                                    <label className="label">Valor (R$)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="input"
                                        value={formData.amount}
                                        onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="label">Data</label>
                                    <input
                                        type="date"
                                        className="input"
                                        value={formData.date}
                                        onChange={e => setFormData({ ...formData, date: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <button type="submit" className="btn btn-primary w-100 mt-2">Salvar Transação</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function TransactionTable({ transactions }) {
    if (!transactions || transactions.length === 0) {
        return <div className="text-center p-8 text-gray">Nenhuma transação encontrada.</div>;
    }
    return (
        <div className="table-wrapper">
            <table className="table">
                <thead>
                    <tr>
                        <th>Data</th>
                        <th>Descrição</th>
                        <th>Categoria</th>
                        <th>Tipo</th>
                        <th className="text-right">Valor</th>
                    </tr>
                </thead>
                <tbody>
                    {transactions.map(t => (
                        <tr key={t.id}>
                            <td>{new Date(t.date).toLocaleDateString('pt-BR')}</td>
                            <td>{t.description}</td>
                            <td>{t.category}</td>
                            <td>
                                <span className={`badge ${t.type === 'income' ? 'badge-green' : 'badge-red'}`}>
                                    {t.type === 'income' ? 'Receita' : 'Despesa'}
                                </span>
                            </td>
                            <td className={`text-right font-bold ${t.type === 'income' ? 'text-green' : 'text-red'}`}>
                                {t.type === 'expense' ? '- ' : '+ '}
                                R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
