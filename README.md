
# 🚀 Guida alla Sincronizzazione in Ufficio

Per far sì che tutti gli operatori vedano gli stessi dati istantaneamente:

1. **Crea Progetto**: Vai su [Supabase.com](https://supabase.com) e crea un progetto.
2. **Crea Tabelle**: Clicca su "SQL Editor" e incolla il codice fornito:

```sql
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS configurazioni_email (
  operatore_email TEXT PRIMARY KEY,
  provider TEXT DEFAULT 'local',
  fromName TEXT,
  smtpServer TEXT DEFAULT 'smtp.gmail.com',
  smtpPort TEXT DEFAULT '465',
  smtpUser TEXT,
  smtpPass TEXT
);

CREATE TABLE IF NOT EXISTS agenti (
  id TEXT PRIMARY KEY, nome TEXT, email TEXT, operatore_email TEXT, telefono TEXT, zona TEXT
);

CREATE TABLE IF NOT EXISTS operatori (
  id TEXT PRIMARY KEY, nome TEXT, email TEXT UNIQUE, password TEXT, role TEXT
);

-- REPLICA IDENTITY FULL E DISABILITA RLS (PER SEMPLICITÀ UFFICIO)
ALTER TABLE vendite REPLICA IDENTITY FULL;
ALTER TABLE agenti REPLICA IDENTITY FULL;
ALTER TABLE operatori REPLICA IDENTITY FULL;
ALTER TABLE configurazioni_email REPLICA IDENTITY FULL;
ALTER TABLE vendite DISABLE ROW LEVEL SECURITY;
ALTER TABLE agenti DISABLE ROW LEVEL SECURITY;
ALTER TABLE operatori DISABLE ROW LEVEL SECURITY;
ALTER TABLE configurazioni_email DISABLE ROW LEVEL SECURITY;

GRANT ALL ON TABLE vendite TO anon;
GRANT ALL ON TABLE agenti TO anon;
GRANT ALL ON TABLE operatori TO anon;
GRANT ALL ON TABLE configurazioni_email TO anon;
```

3. **Ottieni Chiavi**: Vai in `Settings` -> `API` e copia `Project URL` e `anon public key`.
4. **Collega l'App**: Apri questa app, vai in **Impostazioni** e incolla i due valori.
5. **Configura Email Personale**: Ogni operatore deve andare in **Impostazioni** e inserire la propria Password per le App Google.
