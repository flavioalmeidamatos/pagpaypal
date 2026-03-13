import { createClient } from '@supabase/supabase-js';
import { Client } from 'pg';

const SUPABASE_URL = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim();
const SUPABASE_SERVICE_ROLE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || '').trim();
const SUPABASE_DB_PASSWORD = (process.env.SUPABASE_DB_PASSWORD || '').trim();
const SUPABASE_POOLER_URL = (process.env.SUPABASE_POOLER_URL || '').trim();
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

function getDbConnectionString() {
    if (!SUPABASE_POOLER_URL || !SUPABASE_DB_PASSWORD) {
        return null;
    }

    return SUPABASE_POOLER_URL.replace(
        'postgresql://',
        'postgresql://'
    ).replace(/postgresql:\/\/([^@]+)@/, `postgresql://$1:${SUPABASE_DB_PASSWORD}@`);
}

async function listOrdersViaPostgres(rawDate?: string) {
    const range = getDateRange(rawDate);
    const connectionString = getDbConnectionString();

    if (!connectionString) {
        throw new Error('POSTGRES_FALLBACK_UNAVAILABLE');
    }

    const client = new Client({
        connectionString,
        ssl: {
            rejectUnauthorized: false
        },
        connectionTimeoutMillis: 5000
    });

    await client.connect();

    try {
        const query = `
            select
                id,
                paypal_order_id,
                status,
                valor_total,
                moeda,
                email_cliente,
                criado_em
            from public.pedidos
            where criado_em >= $1::timestamptz
              and criado_em < $2::timestamptz
            order by criado_em desc
        `;

        const result = await client.query(query, [range.from, range.to]);

        return {
            date: range.date,
            count: result.rows.length,
            pedidos: result.rows
        };
    }
    finally {
        await client.end();
    }
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
            if (error.message.includes("Could not find the table 'public.pedidos' in the schema cache")) {
                const fallback = await listOrdersViaPostgres(req.query.date);
                res.status(200).json({
                    ...fallback,
                    source: 'postgres-fallback'
                });
                return;
            }

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
