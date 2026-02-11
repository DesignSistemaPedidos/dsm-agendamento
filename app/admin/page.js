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
            router.push('/');
        }
    }, [user, isAdmin, authLoading, router]);

    // Load Data
    const loadStats = async () => {
        setLoading(true);
        const today = new Date().toISOString().split('T')[0];
        const startOfWeek = new Date();
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        const startOfMonthStr = startOfMonth.toISOString().split('T')[0];

        // 1. Agendamentos
        const { count: dailyCount } = await supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('date', today);
        const { count: weeklyCount } = await supabase.from('appointments').select('*', { count: 'exact', head: true }).gte('date', startOfWeek.toISOString().split('T')[0]);

        // 2. Financeiro Mês (Receitas e Despesas - DETALHADO)
        const { data: monthTransactions } = await supabase
            .from('transactions')
            .select('*')
            .gte('date', startOfMonthStr)
            .order('date');

        const monthlyRevenue = monthTransactions
            ?.filter(t => t.type === 'income')
            .reduce((acc, curr) => acc + (curr.amount || 0), 0) || 0;

        const monthlyExpenses = monthTransactions
            ?.filter(t => t.type === 'expense')
            .reduce((acc, curr) => acc + (curr.amount || 0), 0) || 0;

        // Processar Dados para Gráfico de Receita vs Despesas
        const revenueByDate = {};
        monthTransactions?.forEach(t => {
            const date = new Date(t.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
            if (!revenueByDate[date]) revenueByDate[date] = { date, income: 0, expense: 0 };
            if (t.type === 'income') revenueByDate[date].income += t.amount;
            else revenueByDate[date].expense += t.amount;
        });
        const revenueChartData = Object.values(revenueByDate).sort((a, b) => a.date.localeCompare(b.date));

        // Processar Dados para Gráfico de Despesas por Categoria
        const expenseByCategory = {};
        monthTransactions?.filter(t => t.type === 'expense').forEach(t => {
            if (!expenseByCategory[t.category]) expenseByCategory[t.category] = 0;
            expenseByCategory[t.category] += t.amount;
        });
        const expenseChartData = Object.entries(expenseByCategory).map(([name, value]) => ({ name, value }));

        // 3. Barber Performance (Agendamentos do Mês)
        const { data: barberApps } = await supabase
            .from('appointments')
            .select('price, barbers(name)')
            .gte('date', startOfMonthStr)
            .in('status', ['completed', 'confirmed']);

        const barberStats = {};
        barberApps?.forEach(app => {
            const barberName = app.barbers?.name || 'Desconhecido';
            if (!barberStats[barberName]) barberStats[barberName] = { name: barberName, revenue: 0, appointments: 0 };
            barberStats[barberName].revenue += (app.price || 0);
            barberStats[barberName].appointments += 1;
        });
        const barberChartData = Object.values(barberStats);

        // 4. Barbeiros e Categorias
        const { count: barberCount } = await supabase.from('barbers').select('*', { count: 'exact', head: true }).eq('is_active', true);
        const { data: catList } = await supabase.from('expense_categories').select('*').order('name');
        setCategories(catList || []);

        setMetrics({
            dailyAppointments: dailyCount || 0,
            weeklyAppointments: weeklyCount || 0,
            monthlyRevenue,
            monthlyExpenses,
            balance: monthlyRevenue - monthlyExpenses,
            activeBarbers: barberCount || 0
        });

        setChartData({
            revenue: revenueChartData,
            barber: barberChartData,
            expenses: expenseChartData
        });

        // 5. Transações Recentes
        const { data: recentTransactions } = await supabase
            .from('transactions')
            .select('*')
            .order('date', { ascending: false })
            .limit(20);

        if (recentTransactions) setTransactions(recentTransactions);

        // 6. Lista de Barbeiros
        const { data: barbersList } = await supabase.from('barbers').select('*').order('name');
        if (barbersList) setBarbers(barbersList);

        setLoading(false);
    };

    useEffect(() => {
        if (user && isAdmin) loadStats();
    }, [user, isAdmin, activeView]);

    const handleSaveTransaction = async (e) => {
        e.preventDefault();
        const { error } = await supabase.from('transactions').insert([{
            ...formData,
            amount: parseFloat(formData.amount)
        }]);

        if (error) {
            alert('Erro ao salvar transação: ' + error.message);
        } else {
            setShowModal(false);
            setFormData({ ...formData, description: '', amount: '' });
            loadStats(); // Recarregar dados
        }
    };

    return (
        <div className="page container">
            <div className="page-header">
                <h1>Painel Administrativo</h1>
                <p>Visão geral e configurações da barbearia.</p>
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
