import { sendConfirmationEmail } from '@/lib/email';
import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const body = await request.json();
        const { to, clientName, serviceName, barberName, date, time, price, appointmentId } = body;

        if (!to || !clientName || !serviceName) {
            return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 });
        }

        const result = await sendConfirmationEmail({
            to,
            clientName,
            serviceName,
            barberName,
            date,
            time,
            price,
            appointmentId,
        });

        if (!result.success) {
            console.error('Resend Error:', result.error);
            return NextResponse.json({ error: result.error.message || 'Falha ao enviar e-mail' }, { status: 500 });
        }

        return NextResponse.json({ success: true, id: result.data.id });
    } catch (error) {
        console.error('API send-email error:', error);
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}
