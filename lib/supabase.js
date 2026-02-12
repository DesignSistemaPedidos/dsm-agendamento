import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Avoid initialization error during build if envs are missing
const isBuild = !supabaseUrl || !supabaseAnonKey;

const mockClient = {
    from: () => ({
        select: () => ({
            eq: () => ({
                single: () => ({ data: null, error: null }),
                order: () => ({ data: [], error: null }),
                in: () => ({ data: [], error: null }),
            }),
            order: () => ({
                limit: () => ({ data: [], error: null }),
                data: [],
                error: null
            }),
            gte: () => ({
                in: () => ({ data: [], error: null }),
                order: () => ({ data: [], error: null }),
            }),
            insert: () => ({ select: () => ({ single: () => ({ data: null, error: null }) }) }),
            update: () => ({ eq: () => ({ select: () => ({ single: () => ({ data: null, error: null }) }) }) }),
        }),
        insert: () => ({ select: () => ({ single: () => ({ data: null, error: null }) }) }),
    }),
    auth: {
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } }),
        signInWithPassword: () => Promise.resolve({ data: null, error: { message: 'Mock client: env vars missing' } }),
        signUp: () => Promise.resolve({ data: null, error: { message: 'Mock client: env vars missing' } }),
        signOut: () => Promise.resolve({ error: null }),
    }
};

export const supabase = isBuild
    ? mockClient
    : createClient(supabaseUrl, supabaseAnonKey);

// ========== SERVICES ==========
export async function getServices() {
    const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
    if (error) { console.error('getServices error:', error); return []; }
    return data;
}

// ========== BARBERS ==========
export async function getBarbers() {
    const { data, error } = await supabase
        .from('barbers')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
    if (error) { console.error('getBarbers error:', error); return []; }
    return data;
}

export async function getBarberByProfileId(profileId) {
    const { data, error } = await supabase
        .from('barbers')
        .select('*')
        .eq('profile_id', profileId)
        .single();
    if (error) { console.error('getBarberByProfileId error:', error); return null; }
    return data;
}

// ========== APPOINTMENTS ==========
export async function getAvailableSlots(barberId, date, durationMinutes = 30) {
    // Fetch barber schedule for the day
    const dayOfWeek = new Date(date).getDay();
    const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0];

    const { data: schedule } = await supabase
        .from('barber_schedules')
        .select('*')
        .eq('barber_id', barberId)
        .eq('day_of_week', dayOfWeek)
        .eq('is_available', true)
        .single();

    if (!schedule) return [];

    // Fetch existing appointments for that day
    const { data: appointments } = await supabase
        .from('appointments')
        .select('start_time, end_time')
        .eq('barber_id', barberId)
        .eq('date', dateStr)
        .in('status', ['pending', 'confirmed']);

    // Fetch time blocks
    const { data: blocks } = await supabase
        .from('time_blocks')
        .select('*')
        .eq('barber_id', barberId)
        .eq('date', dateStr);

    // Generate slots
    const slots = [];
    const start = timeToMinutes(schedule.start_time);
    const end = timeToMinutes(schedule.end_time);

    for (let t = start; t + durationMinutes <= end; t += 30) {
        const slotStart = minutesToTime(t);
        const slotEnd = minutesToTime(t + durationMinutes);

        const isBooked = (appointments || []).some(a =>
            timesOverlap(slotStart, slotEnd, a.start_time, a.end_time)
        );

        const isBlocked = (blocks || []).some(b => {
            if (b.all_day) return true;
            return timesOverlap(slotStart, slotEnd, b.start_time, b.end_time);
        });

        if (!isBooked && !isBlocked) {
            slots.push(slotStart);
        }
    }

    return slots;
}

export async function createAppointment(appointment) {
    const { data, error } = await supabase
        .from('appointments')
        .insert([appointment])
        .select()
        .single();
    if (error) { console.error('createAppointment error:', error); return null; }
    return data;
}

export async function getAppointmentsByBarber(barberId, date) {
    const { data, error } = await supabase
        .from('appointments')
        .select('*, services(name, price, duration_minutes)')
        .eq('barber_id', barberId)
        .eq('date', date)
        .order('start_time');
    if (error) { console.error(error); return []; }
    return data;
}

export async function updateAppointmentStatus(appointmentId, status) {
    const { data, error } = await supabase
        .from('appointments')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', appointmentId)
        .select()
        .single();
    if (error) { console.error(error); return null; }
    return data;
}

// ========== FINANCE ==========
export async function getTransactions(filters = {}) {
    let query = supabase.from('transactions').select('*').order('date', { ascending: false });
    if (filters.type) query = query.eq('type', filters.type);
    if (filters.dateFrom) query = query.gte('date', filters.dateFrom);
    if (filters.dateTo) query = query.lte('date', filters.dateTo);
    const { data, error } = await query;
    if (error) { console.error(error); return []; }
    return data;
}

export async function createTransaction(transaction) {
    const { data, error } = await supabase
        .from('transactions')
        .insert([transaction])
        .select()
        .single();
    if (error) { console.error(error); return null; }
    return data;
}

export async function getRevenueProjection() {
    // Sum of confirmed/pending future appointments
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
        .from('appointments')
        .select('*, services(price)')
        .gte('date', today)
        .in('status', ['pending', 'confirmed']);
    if (error) { console.error(error); return { daily: 0, weekly: 0, monthly: 0 }; }

    const now = new Date();
    const endOfDay = new Date(now); endOfDay.setHours(23, 59, 59);
    const endOfWeek = new Date(now); endOfWeek.setDate(now.getDate() + (7 - now.getDay()));
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    let daily = 0, weekly = 0, monthly = 0;
    (data || []).forEach(a => {
        const d = new Date(a.date);
        const price = a.services?.price || 0;
        if (d <= endOfDay) daily += Number(price);
        if (d <= endOfWeek) weekly += Number(price);
        if (d <= endOfMonth) monthly += Number(price);
    });

    return { daily, weekly, monthly };
}

// ========== HELPERS ==========
function timeToMinutes(time) {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
}

function minutesToTime(minutes) {
    const h = Math.floor(minutes / 60).toString().padStart(2, '0');
    const m = (minutes % 60).toString().padStart(2, '0');
    return `${h}:${m}`;
}

function timesOverlap(s1, e1, s2, e2) {
    return timeToMinutes(s1) < timeToMinutes(e2) && timeToMinutes(e1) > timeToMinutes(s2);
}
