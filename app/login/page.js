
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
    const { signIn, signUp } = useAuth();
    const router = useRouter();

    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        name: '',
        phone: ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccessMessage(null);

        try {
            if (isLogin) {
                // Login
                const { user } = await signIn(formData.email, formData.password);

                // Check role for redirect
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .single();

                if (profile?.role === 'admin') {
                    router.push('/admin');
                } else if (profile?.role === 'barber') {
                    router.push('/barbeiro');
                } else {
                    router.push('/');
                }
            } else {
                // Cadastro
                const { user, session } = await signUp(formData.email, formData.password, {
                    full_name: formData.name,
                    phone: formData.phone,
                    role: 'client' // Default role
                });

                if (user && !session) {
                    // Confirmação de e-mail necessária
                    setSuccessMessage('Conta criada! Verifique seu e-mail para confirmar.');
                    setIsLogin(true);
                } else {
                    // Login automático (se e-mail confirm estiver desligado)
                    router.push('/');
                }
            }
        } catch (err) {
            console.error('Erro de autenticação:', err);
            setError(err.message || 'Ocorreu um erro. Verifique suas credenciais.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page container flex-center" style={{ minHeight: '100vh', paddingTop: '0' }}>
            <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
                <div className="text-center mb-8">
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✂️</div>
                    <h1 className="text-gradient mb-2">DSM Barber</h1>
                    <p className="text-gray">
                        {isLogin ? 'Bem-vindo de volta!' : 'Crie sua conta grátis'}
                    </p>
                </div>

                {error && (
                    <div className="alert-error mb-4 text-center text-red p-3 bg-red-900/20 rounded border border-red-500/30">
                        {error}
                    </div>
                )}

                {successMessage && (
                    <div className="alert-success mb-4 text-center text-green p-3 bg-green-900/20 rounded border border-green-500/30">
                        {successMessage}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    {!isLogin && (
                        <>
                            <div className="input-group mb-4">
                                <label>Nome Completo</label>
                                <input
                                    type="text"
                                    className="input"
                                    placeholder="Seu nome"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="input-group mb-4">
                                <label>Telefone</label>
                                <input
                                    type="tel"
                                    className="input"
                                    placeholder="(00) 00000-0000"
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    required
                                />
                            </div>
                        </>
                    )}

                    <div className="input-group mb-4">
                        <label>E-mail</label>
                        <input
                            type="email"
                            className="input"
                            placeholder="seu@email.com"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            required
                        />
                    </div>

                    <div className="input-group mb-6">
                        <label>Senha</label>
                        <input
                            type="password"
                            className="input"
                            placeholder="******"
                            value={formData.password}
                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary w-full mb-4"
                        disabled={loading}
                    >
                        {loading ? 'Carregando...' : (isLogin ? 'Entrar' : 'Criar Conta')}
                    </button>
                </form>

                <div className="text-center">
                    <p className="text-gray text-sm">
                        {isLogin ? 'Não tem uma conta?' : 'Já tem uma conta?'}
                        <button
                            className="text-gold font-bold ml-2"
                            onClick={() => {
                                setIsLogin(!isLogin);
                                setError(null);
                                setSuccessMessage(null);
                            }}
                        >
                            {isLogin ? 'Cadastre-se' : 'Fazer Login'}
                        </button>
                    </p>
                </div>

                <div className="mt-6 pt-6 text-center" style={{ borderTop: '1px solid var(--glass-border)' }}>
                    <button
                        className="btn btn-secondary w-full flex-center gap-2"
                        onClick={() => alert('Login com Google em breve!')}
                    >
                        <img src="https://www.svgrepo.com/show/475656/google-color.svg" width="20" alt="Google" />
                        Continuar com Google
                    </button>
                </div>
            </div>
        </div>
    );
}
