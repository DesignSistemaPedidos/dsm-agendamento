'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import { getBarberByProfileId, getAppointmentsByBarber } from '@/lib/supabase';

export default function BarberConfigPage() {
    const { user, isBarber, isAdmin, loading: authLoading } = useAuth();
    const router = useRouter();

    const [activeTab, setActiveTab] = useState('agenda');
    const [barberProfile, setBarberProfile] = useState(null);
    const [appointments, setAppointments] = useState([]);
    const [loadingData, setLoadingData] = useState(true);
    const [stats, setStats] = useState({ count: 0, revenue: 0 });

    // Protect Route
    useEffect(() => {
        if (!authLoading && (!user || !(isBarber || isAdmin))) {
            router.push('/login');
        }
    }, [user, isBarber, isAdmin, authLoading, router]);

    // Fetch Data
    useEffect(() => {
        if (!user) return;

        async function loadBarberData() {
            setLoadingData(true);
            try {
                // 1. Encontrar ID do barbeiro através do perfil
                // Se for admin, poderia ver todos, mas por hora foca no próprio
                const barber = await getBarberByProfileId(user.id);

                if (barber) {
                    setBarberProfile(barber);

                    // 2. Buscar agendamentos de hoje
                    const today = new Date().toISOString().split('T')[0];
                    const apps = await getAppointmentsByBarber(barber.id, today);
                    setAppointments(apps || []);

                    // 3. Calcular Stats
                    const revenue = (apps || [])
                        .filter(a => a.status === 'completed' || a.status === 'confirmed')
                        .reduce((acc, curr) => acc + (curr.services?.price || curr.price || 0), 0);

                    setStats({
                        count: apps?.length || 0,
                        revenue
                    });
                }
            } catch (error) {
                console.error('Erro ao carregar painel do barbeiro:', error);
            } finally {
                setLoadingData(false);
            }
        }

        if (user) loadBarberData();

    }, [user]);

    if (authLoading || !user || !(isBarber || isAdmin)) return null;

    if (loadingData) {
        return <div className="page container flex-center" style={{ height: '80vh' }}>Carregando...</div>;
    }

    if (!barberProfile) {
        return (
            <div className="page container text-center pt-8">
                <h1 className="text-2xl mb-4">Perfil de Barbeiro não encontrado.</h1>
                <p>Peça para o administrador vincular seu usuário a um cadastro de barbeiro.</p>
                <button
                    onClick={async () => {
                        await supabase.auth.signOut();
                        router.push('/login');
                    }}
                    className="btn btn-sm btn-outline mt-4"
                >
                    Sair
                </button>
            </div>
        );
    }

    return (
        <div className="page container">
            {/* Header */}
            <div className="flex-between mb-8 page-header">
                <div>
                    <h1>Olá, {barberProfile.name.split(' ')[0]} 👋</h1>
                    <p>Confira sua agenda de hoje.</p>
                </div>
                <div className="flex-center gap-4">
                    <div className="avatar avatar-lg">
                        {barberProfile.avatar_url ? (
                            <img src={barberProfile.avatar_url} alt="Perfil" />
                        ) : (
                            <span style={{ fontSize: '2rem' }}>✂️</span>
                        )}
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
            </div>

            {/* Tabs */}
            <div className="tabs mb-8" style={{ display: 'inline-flex' }}>
                <button
                    className={`tab ${activeTab === 'agenda' ? 'active' : ''}`}
                    onClick={() => setActiveTab('agenda')}
                >
                    📅 Minha Agenda
                </button>
                <button
                    className={`tab ${activeTab === 'config' ? 'active' : ''}`}
                    onClick={() => setActiveTab('config')}
                >
                    ⚙️ Configurações
                </button>
            </div>

            {/* Agenda Tab */}
            {activeTab === 'agenda' && (
                <div className="animate-fade-in">
                    {/* Stats Row */}
                    <div className="grid-3 mb-8">
                        <div className="stat-card">
                            <div className="flex-between mb-2">
                                <span className="stat-label">Agendamentos</span>
                                <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#60A5FA' }}>📅</div>
                            </div>
                            <div className="stat-value">{stats.count}</div>
                            <span className="text-xs text-green">Hoje</span>
                        </div>

                        <div className="stat-card">
                            <div className="flex-between mb-2">
                                <span className="stat-label">Faturamento Previsto</span>
                                <div className="stat-icon" style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#4ADE80' }}>💰</div>
                            </div>
                            <div className="stat-value text-gold">R$ {stats.revenue.toFixed(2)}</div>
                            <span className="text-xs text-green">Hoje</span>
                        </div>
                    </div>

                    <h3 className="mb-4 text-gradient">Agenda de Hoje</h3>

                    {appointments.length === 0 ? (
                        <div className="card text-center p-8">
                            <p className="text-gray mb-4">Nenhum agendamento para hoje ainda.</p>
                        </div>
                    ) : (
                        <div className="grid-1 gap-4">
                            {appointments.map(app => (
                                <div key={app.id} className="card flex-between" style={{ padding: '1.25rem' }}>
                                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                        <div style={{
                                            padding: '0.5rem 1rem',
                                            background: 'var(--dark-700)',
                                            borderRadius: '0.5rem',
                                            fontWeight: 'bold',
                                            textAlign: 'center'
                                        }}>
                                            {app.start_time.slice(0, 5)}
                                        </div>
                                        <div>
                                            <h4 className="mb-1">{app.client_name || 'Cliente'}</h4>
                                            <span className="text-sm text-gray">
                                                {app.services?.name || 'Serviço'} • {app.services?.duration_minutes || 30}min
                                            </span>
                                        </div>
                                    </div>

                                    <div style={{ textAlign: 'right' }}>
                                        <div className="font-bold text-gold mb-1">
                                            R$ {app.price?.toFixed(2) || app.services?.price?.toFixed(2)}
                                        </div>
                                        {/* Status Badge */}
                                        <span className={`badge ${app.status === 'confirmed' ? 'badge-green' :
                                            app.status === 'completed' ? 'badge-blue' :
                                                app.status === 'cancelled' ? 'badge-red' : 'badge-amber'
                                            }`}>
                                            {app.status === 'confirmed' ? 'Confirmado' :
                                                app.status === 'completed' ? 'Concluído' :
                                                    app.status === 'cancelled' ? 'Cancelado' :
                                                        app.status === 'pending' ? 'Pendente' : app.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Config Tab */}
            {activeTab === 'config' && (
                <div className="animate-fade-in card">
                    <h3 className="mb-6">Seus Horários</h3>
                    <p className="text-gray mb-4">Gerencie os dias que você atende.</p>
                    <div className="text-center p-8 border border-dashed border-gray-700 rounded-lg">
                        🚧 Em desenvolvimento: Edição de horários.
                    </div>
                </div>
            )}
        </div>
    );
}
