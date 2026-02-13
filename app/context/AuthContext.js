'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // Verificar sessão atual
        const checkUser = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();
                if (error) throw error;

                if (session?.user) {
                    console.log('AUTH DEBUG: Session found for', session.user.email);
                    setUser(session.user);
                    await fetchProfile(session.user.id);
                } else {
                    console.log('AUTH DEBUG: No active session');
                    setLoading(false);
                }
            } catch (err) {
                console.error('AUTH DEBUG: Error checking session:', err);
                setLoading(false);
            }
        };

        checkUser();

        // Escutar mudanças na auth
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('AUTH DEBUG: Auth state change event:', event);
            if (session?.user) {
                setUser(session.user);
                await fetchProfile(session.user.id);
            } else {
                setUser(null);
                setProfile(null);
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchProfile = async (userId) => {
        try {
            console.log('Fetching profile for:', userId);
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                console.warn('Profile fetch warning:', error.message);
            }

            if (data) {
                console.log('Profile loaded:', data.role);
                setProfile(data);
            } else {
                console.warn('No profile found. Creating default client profile disabled here (handled by trigger/admin).');
            }
        } catch (error) {
            console.error('Erro crítico ao buscar perfil:', error);
        } finally {
            setLoading(false);
        }
    };

    const signIn = async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        if (error) throw error;
        return data;
    };

    const signUp = async (email, password, metadata) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: metadata // { full_name, phone, etc. }
            }
        });
        if (error) throw error;
        return data;
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    const value = {
        user,
        profile,
        loading,
        signIn,
        signUp,
        signOut,
        isAdmin: profile?.role === 'admin',
        isBarber: profile?.role === 'barber',
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
            {loading && (
                <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#050508', color: '#D4A853' }}>
                    <div className="text-xl">Carregando...</div>
                </div>
            )}
        </AuthContext.Provider>
    );
};
