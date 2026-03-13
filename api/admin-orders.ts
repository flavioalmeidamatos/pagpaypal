import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim();
const SUPABASE_SERVICE_ROLE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
const ADMIN_READ_KEY = (process.env.ADMIN_READ_KEY || process.env.PAYPAL_CLIENT_SECRET || '').trim();

interface ApiRequest {
    method?: string;
    query: {
        date?: string;
    };
    headers?: Record<string, string | string[] | undefined>;
}

interface ApiResponse {
    setHeader: (name: string, value: string) => void;
    status: (code: number) => {
        json: (body: unknown) => void;
        end: () => void;
    };
}

function getHeaderValue(value: string | string[] | undefined) {
    if (Array.isArray(value)) {
        return (value[0] || '').trim();
    }

    return (value || '').trim();
}

function getDateRange(rawDate?: string) {
    const date = (rawDate || '2026-03-13').trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        throw new Error('INVALID_DATE');
    }

    const [year, month, day] = date.split('-').map(Number);
    const nextDay = new Date(Date.UTC(year, month - 1, day));
    nextDay.setUTCDate(nextDay.getUTCDate() + 1);
    const nextDate = nextDay.toISOString().slice(0, 10);

    return {
        date,
        from: `${date}T00:00:00-03:00`,
        to: `${nextDate}T00:00:00-03:00`
    };
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Key');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'GET') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    if (!ADMIN_READ_KEY || getHeaderValue(req.headers?.['x-admin-key']) !== ADMIN_READ_KEY) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
        res.status(500).json({ error: 'Supabase admin credentials unavailable' });
        return;
    }

    try {
        const range = getDateRange(req.query.date);
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
            auth: {
                persistSession: false,
                autoRefreshToken: false
            }
        });

        const { data, error } = await supabase
            .from('pedidos')
            .select('id,paypal_order_id,status,valor_total,moeda,email_cliente,criado_em')
            .gte('criado_em', range.from)
            .lt('criado_em', range.to)
            .order('criado_em', { ascending: false });

        if (error) {
            res.status(500).json({
                error: 'Supabase query failed',
                details: error.message
            });
            return;
        }

        res.status(200).json({
            date: range.date,
            count: data?.length || 0,
            pedidos: data || []
        });
    } catch (error) {
        if (error instanceof Error && error.message === 'INVALID_DATE') {
            res.status(400).json({ error: 'date must use YYYY-MM-DD' });
            return;
        }

        res.status(500).json({ error: 'Unexpected admin read failure' });
    }
}
