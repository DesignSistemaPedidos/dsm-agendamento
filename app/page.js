'use client';

import Link from 'next/link';
import { useAuth } from './context/AuthContext';

export default function Home() {
    const { user, loading, isAdmin, isBarber } = useAuth();

    // Determine Dashboard Link
    const getDashboardLink = () => {
        if (isAdmin) return '/admin';
        if (isBarber) return '/barbeiro';
        return '/agendar'; // Client dashboard (to be built) or booking
    };

    return (
        <div className="page" style={{ paddingTop: 0 }}>
            {/* Navbar Overlay */}
            <nav className="navbar">
                <div className="navbar-inner">
                    <div className="navbar-logo">
                        ✂️ <span>DSM Barber</span>
                    </div>
                    <div className="navbar-links">
                        <Link href="#servicos">Serviços</Link>
                        <Link href="#barbeiros">Barbeiros</Link>

                        {!loading && user ? (
                            <Link href={getDashboardLink()} className="text-gold font-medium">
                                Minha Conta
                            </Link>
                        ) : (
                            <Link href="/login" className="text-white">
                                Login
                            </Link>
                        )}

                        <Link href="/agendar" className="btn btn-sm btn-primary">Agendar Agora</Link>
                    </div>
                    <button className="mobile-menu-btn">☰</button>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="container" style={{ minHeight: '90vh', display: 'flex', alignItems: 'center', paddingTop: '80px' }}>
                <div className="grid-2" style={{ alignItems: 'center' }}>
                    <div>
                        <div className="badge badge-gold mb-4">🏆 A melhor barbearia da região</div>
                        <h1 className="text-gradient mb-4">Estilo e Tradição <br /> em cada corte.</h1>
                        <p className="text-gray mb-8" style={{ fontSize: '1.2rem', maxWidth: '500px' }}>
                            Cuidamos do seu visual com profissionais experientes e ambiente premium. Agende seu horário em segundos.
                        </p>
                        <div className="flex-center" style={{ justifyContent: 'flex-start', gap: '1rem' }}>
                            <Link href="/agendar" className="btn btn-lg btn-primary">
                                Agendar Horário
                            </Link>
                            <Link href="#servicos" className="btn btn-lg btn-outline">
                                Ver Serviços
                            </Link>
                        </div>
                    </div>
                    <div className="hide-mobile flex-center">
                        {/* Placeholder for Hero Image */}
                        <div style={{
                            width: '100%',
                            height: '500px',
                            background: 'linear-gradient(135deg, var(--dark-800), var(--dark-700))',
                            borderRadius: '2rem',
                            position: 'relative',
                            overflow: 'hidden',
                            border: '1px solid var(--glass-border)'
                        }}>
                            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.2 }}>
                                <span style={{ fontSize: '5rem' }}>💈</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Services Section */}
            <section id="servicos" className="container mb-8" style={{ paddingBottom: '4rem' }}>
                <div className="flex-between mb-6">
                    <h2 className="text-gradient">Nossos Serviços</h2>
                    <Link href="/agendar" className="text-gold font-medium">Ver todos &rarr;</Link>
                </div>

                <div className="grid-3">
                    {/* Card 1 */}
                    <div className="card">
                        <div className="flex-between mb-4">
                            <span style={{ fontSize: '2rem' }}>✂️</span>
                            <span className="badge badge-gold">Popular</span>
                        </div>
                        <h3 className="mb-2">Corte Masculino</h3>
                        <p className="text-gray text-sm mb-4">Corte completo com lavagem e finalização com pomada premium.</p>
                        <div className="flex-between" style={{ marginTop: 'auto' }}>
                            <div>
                                <span className="text-xs text-gray">30 min</span>
                                <div className="font-bold text-gold">R$ 45,00</div>
                            </div>
                            <Link href="/agendar" className="btn btn-sm btn-secondary">Agendar</Link>
                        </div>
                    </div>

                    {/* Card 2 */}
                    <div className="card">
                        <div className="flex-between mb-4">
                            <span style={{ fontSize: '2rem' }}>🪒</span>
                        </div>
                        <h3 className="mb-2">Barba Completa</h3>
                        <p className="text-gray text-sm mb-4">Barba modelada com toalha quente e hidratação com óleos essenciais.</p>
                        <div className="flex-between" style={{ marginTop: 'auto' }}>
                            <div>
                                <span className="text-xs text-gray">25 min</span>
                                <div className="font-bold text-gold">R$ 35,00</div>
                            </div>
                            <Link href="/agendar" className="btn btn-sm btn-secondary">Agendar</Link>
                        </div>
                    </div>

                    {/* Card 3 */}
                    <div className="card">
                        <div className="flex-between mb-4">
                            <span style={{ fontSize: '2rem' }}>✨</span>
                            <span className="badge badge-gold">Combo</span>
                        </div>
                        <h3 className="mb-2">Corte + Barba</h3>
                        <p className="text-gray text-sm mb-4">A experiência completa. Renove seu visual com desconto especial.</p>
                        <div className="flex-between" style={{ marginTop: 'auto' }}>
                            <div>
                                <span className="text-xs text-gray">50 min</span>
                                <div className="font-bold text-gold">R$ 70,00</div>
                            </div>
                            <Link href="/agendar" className="btn btn-sm btn-secondary">Agendar</Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Barbers Section */}
            <section id="barbeiros" className="container mb-8" style={{ paddingBottom: '4rem' }}>
                <h2 className="text-gradient mb-6">Nossos Profissionais</h2>
                <div className="grid-4">
                    <div className="card text-center">
                        <div className="avatar avatar-xl mb-4" style={{ margin: '0 auto' }}>
                            <img src="https://ui-avatars.com/api/?name=Joao+Silva&background=D4A853&color=0F0F0F" alt="João" />
                        </div>
                        <h3 className="mb-1">João Silva</h3>
                        <p className="text-gold text-sm mb-3">Especialista em Degradê</p>
                        <Link href="/agendar" className="btn btn-sm btn-outline w-full">Agendar com João</Link>
                    </div>

                    <div className="card text-center">
                        <div className="avatar avatar-xl mb-4" style={{ margin: '0 auto' }}>
                            <img src="https://ui-avatars.com/api/?name=Pedro+Santos&background=D4A853&color=0F0F0F" alt="Pedro" />
                        </div>
                        <h3 className="mb-1">Pedro Santos</h3>
                        <p className="text-gold text-sm mb-3">Barba e Bigode</p>
                        <Link href="/agendar" className="btn btn-sm btn-outline w-full">Agendar com Pedro</Link>
                    </div>

                    <div className="card text-center">
                        <div className="avatar avatar-xl mb-4" style={{ margin: '0 auto' }}>
                            <img src="https://ui-avatars.com/api/?name=Marcos+Costa&background=D4A853&color=0F0F0F" alt="Marcos" />
                        </div>
                        <h3 className="mb-1">Marcos Costa</h3>
                        <p className="text-gold text-sm mb-3">Cortes Clássicos</p>
                        <Link href="/agendar" className="btn btn-sm btn-outline w-full">Agendar com Marcos</Link>
                    </div>
                </div>
            </section>

        </div>
    );
}
