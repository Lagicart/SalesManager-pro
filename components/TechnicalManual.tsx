
import React from 'react';
import { Printer, BookOpen, Database, Cloud, Layout, ShieldCheck, Zap, Layers, AlertTriangle, Globe } from 'lucide-react';

const TechnicalManual: React.FC = () => {
  const handlePrint = () => {
    window.print();
  };

  const sqlCode = `-- TABELLE PRINCIPALI
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
  note_amministrazione TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS agenti (
  id TEXT PRIMARY KEY,
  nome TEXT,
  email TEXT,
  operatore_email TEXT,
  telefono TEXT,
  zona TEXT
);

CREATE TABLE IF NOT EXISTS operatori (
  id TEXT PRIMARY KEY,
  nome TEXT,
  email TEXT UNIQUE,
  password TEXT,
  role TEXT
);

CREATE TABLE IF NOT EXISTS notifiche (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  to_email TEXT,
  message TEXT,
  from_user TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- REPLICA IDENTITY FULL (OBBLIGATORIO PER REALTIME NOTIFICHE)
ALTER TABLE vendite REPLICA IDENTITY FULL;
ALTER TABLE agenti REPLICA IDENTITY FULL;
ALTER TABLE operatori REPLICA IDENTITY FULL;
ALTER TABLE notifiche REPLICA IDENTITY FULL;

-- DISABILITAZIONE RLS
ALTER TABLE vendite DISABLE ROW LEVEL SECURITY;
ALTER TABLE agenti DISABLE ROW LEVEL SECURITY;
ALTER TABLE operatori DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifiche DISABLE ROW LEVEL SECURITY;

GRANT ALL ON TABLE vendite TO anon;
GRANT ALL ON TABLE agenti TO anon;
GRANT ALL ON TABLE operatori TO anon;
GRANT ALL ON TABLE notifiche TO anon;

-- CONFIGURAZIONE REALTIME
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime SET TABLE vendite, agenti, operatori, notifiche;
  ELSE
    CREATE PUBLICATION supabase_realtime FOR TABLE vendite, agenti, operatori, notifiche;
  END IF;
END $$;`;

  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-5xl mx-auto pb-20">
      <style>{`
        @media print {
          aside, header, .no-print, button { display: none !important; }
          body { background: white !important; }
          .print-section { 
            display: block !important; 
            margin: 0 !important; 
            padding: 1.5cm !important; 
          }
          pre { font-size: 8px !important; white-space: pre-wrap !important; }
          h1, h2, h3 { color: black !important; page-break-after: avoid; }
        }
      `}</style>

      {/* HEADER MANUALE */}
      <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-200 no-print">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-5">
            <div className="bg-amber-600 p-4 rounded-3xl text-white shadow-lg shadow-amber-600/20">
              <BookOpen className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Manuale Tecnico v1.5</h1>
              <p className="text-slate-500 font-medium">Guida tecnica per manutenzione e ripristino del sistema.</p>
            </div>
          </div>
          <button 
            onClick={handlePrint}
            className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center gap-3 hover:bg-black transition-all shadow-xl active:scale-95"
          >
            <Printer className="w-5 h-5" /> Stampa / Salva PDF
          </button>
        </div>
      </div>

      <div className="print-section space-y-12">
        <section className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-4">
            <Database className="w-6 h-6 text-[#32964D]" />
            <h2 className="text-xl font-black uppercase tracking-widest text-slate-900">1. Setup Database (SQL)</h2>
          </div>
          <p className="text-sm text-slate-600 mb-6 font-medium">Importante: Assicurarsi di eseguire il comando REPLICA IDENTITY FULL sulle tabelle per permettere alle notifiche di funzionare in tempo reale su tutti i dispositivi.</p>
          <div className="bg-slate-900 p-6 rounded-2xl relative shadow-2xl">
            <pre className="text-[11px] font-mono text-emerald-400 overflow-x-auto whitespace-pre-wrap leading-relaxed">
              {sqlCode}
            </pre>
          </div>
        </section>
      </div>
    </div>
  );
};

export default TechnicalManual;
