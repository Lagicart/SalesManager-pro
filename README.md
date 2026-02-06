
# 🚀 Guida alla Sincronizzazione Cloud (Lagicart)

Per far sì che tutti gli operatori vedano gli stessi dati e possano inviare mail con la propria configurazione:

1. **Crea Progetto**: Vai su [Supabase.com](https://supabase.com).
2. **Crea Tabelle**: Clicca sulla sezione **SQL Editor** -> **New Query** e incolla questo script aggiornato:

```sql
-- 1. Tabella Vendite
CREATE TABLE IF NOT EXISTS vendite (
  id TEXT PRIMARY KEY,
  data DATE DEFAULT CURRENT_DATE,
  cliente TEXT,
  importo DECIMAL,
  metodo_pagamento TEXT,
  sconto TEXT,
  agente TEXT,
  operatore_email TEXT,
  incassato BOOLEAN DEFAULT FALSE,
  verificare_pagamento BOOLEAN DEFAULT FALSE,
  pagamento_verificato BOOLEAN DEFAULT FALSE,
  note_amministrazione TEXT,
  notizie TEXT,
  nuove_notizie BOOLEAN DEFAULT FALSE,
  ultimo_mittente TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  ultima_modifica_da TEXT,
  ultima_modifica_at TIMESTAMP WITH TIME ZONE
);

-- 2. Tabella Configurazione Email
CREATE TABLE IF NOT EXISTS configurazioni_email (
  operatore_email TEXT PRIMARY KEY,
  provider TEXT DEFAULT 'local',
  from_name TEXT,
  smtp_server TEXT DEFAULT 'smtp.gmail.com',
  smtp_port TEXT DEFAULT '465',
  smtp_user TEXT,
  smtp_pass TEXT
);

-- 3. Tabella Agenti
CREATE TABLE IF NOT EXISTS agenti (
  id TEXT PRIMARY KEY, 
  nome TEXT, 
  email TEXT, 
  operatore_email TEXT, 
  telefono TEXT, 
  zona TEXT
);

-- 4. Tabella Operatori
CREATE TABLE IF NOT EXISTS operatori (
  id TEXT PRIMARY KEY, 
  nome TEXT, 
  email TEXT UNIQUE, 
  password TEXT, 
  role TEXT
);

-- 5. DISABILITA RLS (Per uso ufficio semplificato)
ALTER TABLE vendite DISABLE ROW LEVEL SECURITY;
ALTER TABLE agenti DISABLE ROW LEVEL SECURITY;
ALTER TABLE operatori DISABLE ROW LEVEL SECURITY;
ALTER TABLE configurazioni_email DISABLE ROW LEVEL SECURITY;

GRANT ALL ON TABLE vendite TO anon;
GRANT ALL ON TABLE agenti TO anon;
GRANT ALL ON TABLE operatori TO anon;
GRANT ALL ON TABLE configurazioni_email TO anon;
```

3. **Collega l'App**: 
   - Vai in `Settings` -> `API` su Supabase.
   - Copia `Project URL` e `anon public key`.
   - Incolla questi dati nella sezione **Impostazioni** dell'app Lagicart.
4. **Configura Gmail**:
   - Ogni operatore deve generare la propria **"Password per le App"** nelle impostazioni Google.
   - Inseriscila in **Impostazioni** -> **Direct SMTP**.
