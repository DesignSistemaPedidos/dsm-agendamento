'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ServiceCard from '../components/ServiceCard';
import BarberCard from '../components/BarberCard';
import Calendar from '../components/Calendar';
import TimeSlotPicker from '../components/TimeSlotPicker';
import { getServices, getBarbers, getAvailableSlots, createAppointment } from '@/lib/supabase';
import { useAuth } from '../context/AuthContext';

// Fallback Mock Data
const MOCK_SERVICES = [
    { id: '1', name: 'Corte Masculino', description: 'Corte completo com lavagem e finalização.', duration: 30, price: 45.00, icon: '✂️' },
    { id: '2', name: 'Barba Completa', description: 'Barba modelada com toalha quente.', duration: 25, price: 35.00, icon: '🪒' },
    { id: '3', name: 'Corte + Barba', description: 'Combo completo para um visual renovado.', duration: 50, price: 70.00, icon: '✨' },
    { id: '4', name: 'Pezinho / Acabamento', description: 'Apenas manutenção dos contornos.', duration: 15, price: 20.00, icon: '📏' },
];

const MOCK_BARBERS = [
    { id: '1', name: 'João Silva', specialty: 'Degradê', avatar: 'https://ui-avatars.com/api/?name=Joao+Silva&background=D4A853&color=0F0F0F' },
    { id: '2', name: 'Pedro Santos', specialty: 'Barba', avatar: 'https://ui-avatars.com/api/?name=Pedro+Santos&background=D4A853&color=0F0F0F' },
    { id: '3', name: 'Marcos Costa', specialty: 'Clássico', avatar: 'https://ui-avatars.com/api/?name=Marcos+Costa&background=D4A853&color=0F0F0F' },
    { id: '4', name: 'Sem Preferência', specialty: 'Qualquer profissional', avatar: 'https://ui-avatars.com/api/?name=Sem+Preferencia&background=333333&color=FFFFFF' },
];

const DEFAULT_TIME_SLOTS = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30', '18:00', '18:30'
];

export default function AgendarPage() {
    const { user, profile } = useAuth();

    const [step, setStep] = useState(1);
    const [services, setServices] = useState(MOCK_SERVICES);
    const [barbers, setBarbers] = useState(MOCK_BARBERS);
    const [availableSlots, setAvailableSlots] = useState(DEFAULT_TIME_SLOTS);

    const [selectedService, setSelectedService] = useState(null);
    const [selectedBarber, setSelectedBarber] = useState(null);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [clientData, setClientData] = useState({ name: '', phone: '', email: '' });

    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    // Auto-preenchimento para usuários logados
    useEffect(() => {
        if (profile) {
            setClientData({
                name: profile.full_name || '',
                phone: profile.phone || '',
                email: profile.email || user.email || ''
            });
        }
    }, [profile, user]);

    // Carregar dados reais do Supabase
    useEffect(() => {
        const loadData = async () => {
            const [s, b] = await Promise.all([getServices(), getBarbers()]);
            if (s && s.length > 0) setServices(s);
            if (b && b.length > 0) setBarbers(b);
        };
        loadData();
    }, []);

    // Atualizar horários disponíveis quando mudar data/barbeiro
    useEffect(() => {
        const updateSlots = async () => {
            if (selectedBarber && selectedDate) {
                // Se for "Sem Preferência" (mock id 4), não busca no banco específico
                if (selectedBarber.id === '4') {
                    setAvailableSlots(DEFAULT_TIME_SLOTS);
                    return;
                }

                const slots = await getAvailableSlots(selectedBarber.id, selectedDate);
                if (slots && slots.length > 0) {
                    setAvailableSlots(slots);
                } else {
                    // Fallback se a função retornar vazio (ex: tabela schedules vazia)
                    // Para evitar travar o fluxo se o DB estiver incompleto
                    setAvailableSlots(DEFAULT_TIME_SLOTS);
                }
            }
        };
        updateSlots();
    }, [selectedBarber, selectedDate]);

    const nextStep = () => setStep(step + 1);
    const prevStep = () => setStep(step - 1);

    const handleConfirm = async () => {
        setLoading(true);
        try {
            // 1. Criar agendamento no Supabase
            // Formatar data: YYYY-MM-DD
            const dateStr = selectedDate.toISOString().split('T')[0];

            // Calcular horário final
            const [h, m] = selectedSlot.split(':').map(Number);
            const endDate = new Date(selectedDate);
            endDate.setHours(h, m + (selectedService?.duration || 30));
            const endTime = `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;

            const appointmentData = {
                service_id: selectedService?.id !== '1' && selectedService?.id !== '2' && selectedService?.id !== '3' && selectedService?.id !== '4' ? selectedService.id : null, // Só usa UUID se não for mock
                barber_id: selectedBarber?.id !== '1' && selectedBarber?.id !== '2' && selectedBarber?.id !== '3' && selectedBarber?.id !== '4' ? selectedBarber.id : null,
                date: dateStr,
                start_time: selectedSlot,
                end_time: endTime,
                client_name: clientData.name,
                client_phone: clientData.phone,
                client_id: user?.id || null, // VINCULAR AO USUÁRIO LOGADO
                status: 'pending', // Aguardando confirmação (ou confirmado direto)
                source: 'app',
                price: selectedService?.price
            };

            // Tenta salvar no Supabase, mas não bloqueia se falhar (modo híbrido dev)
            let appointmentId = null;
            try {
                const newApp = await createAppointment(appointmentData);
                if (newApp) appointmentId = newApp.id;
            } catch (dbErr) {
                console.warn('Erro ao salvar no banco (ignorando para demo):', dbErr);
            }

            // 2. Enviar e-mail de confirmação via Resend
            const res = await fetch('/api/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: clientData.email,
                    clientName: clientData.name,
                    serviceName: selectedService?.name,
                    barberName: selectedBarber?.name,
                    date: selectedDate.toLocaleDateString('pt-BR'),
                    time: selectedSlot,
                    price: selectedService?.price.toFixed(2),
                    appointmentId: appointmentId
                }),
            });

            const data = await res.json();
            if (!res.ok) console.error('Email error:', data);

        } catch (err) {
            console.error('Falha geral no agendamento:', err);
        }

        setLoading(false);
        setSuccess(true);
    };

    if (success) {
        return (
            <div className="container flex-col-center" style={{ minHeight: '80vh', textAlign: 'center' }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
                <h1 className="text-gradient mb-4">Agendamento Confirmado!</h1>
                <p className="text-gray mb-8">
                    Enviamos os detalhes para seu e-mail e WhatsApp.<br />
                    Te esperamos lá!
                </p>
                <div className="card mb-8" style={{ width: '100%', maxWidth: '400px', textAlign: 'left' }}>
                    <div className="flex-between mb-2">
                        <span className="text-gray">Serviço:</span>
                        <span className="font-bold">{selectedService?.name}</span>
                    </div>
                    <div className="flex-between mb-2">
                        <span className="text-gray">Profissional:</span>
                        <span className="font-bold">{selectedBarber?.name}</span>
                    </div>
                    <div className="flex-between mb-2">
                        <span className="text-gray">Data:</span>
                        <span className="font-bold">{selectedDate.toLocaleDateString('pt-BR')} às {selectedSlot}</span>
                    </div>
                    <div className="flex-between mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                        <span className="text-gray">Total:</span>
                        <span className="text-gold font-bold text-lg">R$ {Number(selectedService?.price).toFixed(2)}</span>
                    </div>
                </div>
                <Link href="/" className="btn btn-primary">Voltar ao Início</Link>
            </div>
        );
    }

    return (
        <div className="page container">
            <div className="page-header text-center">
                <h1>Agendar Horário</h1>
                <p>Preencha os dados e garanta seu visual.</p>
            </div>

            {/* Stepper */}
            <div className="stepper">
                <div className={`stepper-step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
                    <div className="stepper-circle">{step > 1 ? '✓' : '1'}</div>
                    <span className="stepper-label">Serviço</span>
                </div>
                <div className={`stepper-line ${step > 1 ? 'completed' : ''}`}></div>

                <div className={`stepper-step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
                    <div className="stepper-circle">{step > 2 ? '✓' : '2'}</div>
                    <span className="stepper-label">Profissional</span>
                </div>
                <div className={`stepper-line ${step > 2 ? 'completed' : ''}`}></div>

                <div className={`stepper-step ${step >= 3 ? 'active' : ''} ${step > 3 ? 'completed' : ''}`}>
                    <div className="stepper-circle">{step > 3 ? '✓' : '3'}</div>
                    <span className="stepper-label">Data e Hora</span>
                </div>
                <div className={`stepper-line ${step > 3 ? 'completed' : ''}`}></div>

                <div className={`stepper-step ${step >= 4 ? 'active' : ''}`}>
                    <div className="stepper-circle">4</div>
                    <span className="stepper-label">Confirmar</span>
                </div>
            </div>

            {/* Steps Content */}
            <div className="mb-8 p-4 bg-dark-800 rounded-lg p-6 border border-glass animate-fade-in" style={{ minHeight: '400px' }}>

                {/* Step 1: Serviços */}
                {step === 1 && (
                    <div className="animate-slide-up">
                        <h2 className="mb-6">Escolha o serviço</h2>
                        <div className="grid-2">
                            {services.map(service => (
                                <ServiceCard
                                    key={service.id}
                                    service={service}
                                    selected={selectedService?.id === service.id}
                                    onSelect={setSelectedService}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Step 2: Barbeiros */}
                {step === 2 && (
                    <div className="animate-slide-up">
                        <h2 className="mb-6">Escolha o profissional</h2>
                        <div className="grid-4">
                            {barbers.map(barber => (
                                <BarberCard
                                    key={barber.id}
                                    barber={barber}
                                    selected={selectedBarber?.id === barber.id}
                                    onSelect={setSelectedBarber}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Step 3: Data e Hora */}
                {step === 3 && (
                    <div className="animate-slide-up">
                        <h2 className="mb-6">Data e horário</h2>
                        <div className="grid-2" style={{ alignItems: 'start' }}>
                            <Calendar selectedDate={selectedDate} onSelectDate={setSelectedDate} />
                            <div>
                                <h4 className="mb-4">Horários disponíveis para {selectedDate.toLocaleDateString('pt-BR')}</h4>
                                <TimeSlotPicker
                                    slots={availableSlots}
                                    selectedSlot={selectedSlot}
                                    onSelectSlot={setSelectedSlot}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 4: Confirmação */}
                {step === 4 && (
                    <div className="animate-slide-up">
                        <h2 className="mb-6">Revise e confirme</h2>
                        <div className="grid-2">
                            <div className="card">
                                <h3 className="mb-4">Resumo do Agendamento</h3>
                                <div className="flex-between mb-3 pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <span className="text-gray">Serviço</span>
                                    <span className="font-medium">{selectedService?.name}</span>
                                </div>
                                <div className="flex-between mb-3 pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <span className="text-gray">Profissional</span>
                                    <span className="font-medium">{selectedBarber?.name}</span>
                                </div>
                                <div className="flex-between mb-3 pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <span className="text-gray">Data</span>
                                    <span className="font-medium">{selectedDate.toLocaleDateString('pt-BR')}</span>
                                </div>
                                <div className="flex-between mb-3 pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <span className="text-gray">Horário</span>
                                    <span className="font-medium">{selectedSlot}</span>
                                </div>
                                <div className="flex-between mt-4">
                                    <span className="text-gray">Total a pagar</span>
                                    <span className="text-gold font-bold text-lg">R$ {Number(selectedService?.price).toFixed(2)}</span>
                                </div>
                            </div>

                            <div>
                                <h3 className="mb-4">Seus Dados</h3>
                                <div className="input-group mb-4">
                                    <label>Nome Completo</label>
                                    <input
                                        type="text"
                                        className="input"
                                        placeholder="Seu nome"
                                        value={clientData.name}
                                        onChange={(e) => setClientData({ ...clientData, name: e.target.value })}
                                    />
                                </div>
                                <div className="input-group mb-4">
                                    <label>Telefone (WhatsApp)</label>
                                    <input
                                        type="tel"
                                        className="input"
                                        placeholder="(00) 00000-0000"
                                        value={clientData.phone}
                                        onChange={(e) => setClientData({ ...clientData, phone: e.target.value })}
                                    />
                                </div>
                                <div className="input-group mb-4">
                                    <label>E-mail (para confirmação)</label>
                                    <input
                                        type="email"
                                        className="input"
                                        placeholder="seu@email.com"
                                        value={clientData.email}
                                        onChange={(e) => setClientData({ ...clientData, email: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Navigation Buttons */}
            <div className="flex-between">
                {step > 1 ? (
                    <button className="btn btn-secondary" onClick={prevStep}>Voltar</button>
                ) : (
                    <div></div> // Spacer
                )}

                {step === 1 && (
                    <button
                        className="btn btn-primary"
                        disabled={!selectedService}
                        onClick={nextStep}
                    >
                        Próximo
                    </button>
                )}
                {step === 2 && (
                    <button
                        className="btn btn-primary"
                        disabled={!selectedBarber}
                        onClick={nextStep}
                    >
                        Próximo
                    </button>
                )}
                {step === 3 && (
                    <button
                        className="btn btn-primary"
                        disabled={!selectedSlot}
                        onClick={nextStep}
                    >
                        Próximo
                    </button>
                )}
                {step === 4 && (
                    <button
                        className="btn btn-primary btn-lg"
                        disabled={!clientData.name || !clientData.phone || !clientData.email || loading}
                        onClick={handleConfirm}
                    >
                        {loading ? 'Confirmando...' : 'Confirmar Agendamento'}
                    </button>
                )}
            </div>
        </div>
    );
}
