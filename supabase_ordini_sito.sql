-- ==============================================================================
-- STRUTTURA DATABASE SEPARATA PER IL MODULO: "ORDINI SITO"
-- Questo script crea una tabella dedicata 'ordini_sito' completamente isolata
-- dalla contabilità preesistente (Sales Manager, vendite, provvigioni agenti).
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.ordini_sito (
    id TEXT PRIMARY KEY,
    cliente TEXT NOT NULL,
    importo NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    mese_riferimento TEXT NOT NULL, -- formato 'YYYY-MM' (es. '2025-05')
    data_inserimento TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    operatore_nome TEXT NOT NULL,
    operatore_email TEXT NOT NULL,
    importo_originale NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    storico_modifiche JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indice per ottimizzare la consultazione e il filtro per mese di riferimento
CREATE INDEX IF NOT EXISTS idx_ordini_sito_mese ON public.ordini_sito (mese_riferimento);

-- Indice per ordinamento temporale di inserimento
CREATE INDEX IF NOT EXISTS idx_ordini_sito_data_ins ON public.ordini_sito (data_inserimento DESC);

-- Abilitazione Row Level Security (RLS)
ALTER TABLE public.ordini_sito ENABLE ROW LEVEL SECURITY;

-- Policy: Tutti gli operatori autenticati/connessi all'applicazione aziendale possono leggere tutti gli ordini sito
CREATE POLICY "Tutti gli operatori possono consultare gli ordini sito"
ON public.ordini_sito
FOR SELECT
TO anon, authenticated
USING (true);

-- Policy: Tutti gli operatori possono inserire ordini sito
CREATE POLICY "Tutti gli operatori possono inserire ordini sito"
ON public.ordini_sito
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Policy: Tutti gli operatori possono modificare gli ordini sito (con audit trail)
CREATE POLICY "Tutti gli operatori possono aggiornare ordini sito"
ON public.ordini_sito
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);
