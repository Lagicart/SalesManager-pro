
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
  note_amministrazione TEXT
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

-- NUOVA TABELLA NOTIFICHE REALTIME
CREATE TABLE IF NOT EXISTS notifiche (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  to_email TEXT,
  message TEXT,
  from_user TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- DISABILITAZIONE RLS
ALTER TABLE vendite DISABLE ROW LEVEL SECURITY;
ALTER TABLE agenti DISABLE ROW LEVEL SECURITY;
ALTER TABLE operatori DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifiche DISABLE ROW LEVEL SECURITY;

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
              <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Documentazione per il Futuro</h1>
              <p className="text-slate-500 font-medium">Guida tecnica per modifiche, manutenzione e ripristino del sistema.</p>
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
        {/* SEZIONE 1: ARCHITETTURA */}
        <section className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-4">
            <Layers className="w-6 h-6 text-[#32964D]" />
            <h2 className="text-xl font-black uppercase tracking-widest text-slate-900">1. Architettura del Sistema</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" /> Frontend (Vite + React)
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                L'app è costruita su **React** con compilatore **Vite**. La gestione dei dati è "Offline-First": tutto ciò che viene salvato finisce istantaneamente nel <code>LocalStorage</code> del browser (persistenza locale). Se il Cloud è configurato, una funzione di sincronizzazione (Supabase) allinea i dati remoti.
              </p>
            </div>
            <div className="space-y-4">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Cloud className="w-4 h-4 text-sky-500" /> Backend (Supabase)
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Supabase funge da database PostgreSQL. Non usiamo l'autenticazione standard di Supabase per velocità e semplicità, ma una tabella <code>operatori</code> personalizzata gestita direttamente dal codice in <code>App.tsx</code>.
              </p>
            </div>
          </div>
        </section>

        {/* SEZIONE 2: DATABASE SCHEMA */}
        <section className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-4">
            <Database className="w-6 h-6 text-[#32964D]" />
            <h2 className="text-xl font-black uppercase tracking-widest text-slate-900">2. Schema Database (SQL)</h2>
          </div>
          <p className="text-sm text-slate-600 mb-6">In caso di creazione di un nuovo progetto Supabase, incolla questo codice nell'SQL Editor:</p>
          <div className="bg-slate-900 p-6 rounded-2xl relative">
            <pre className="text-[11px] font-mono text-emerald-400 overflow-x-auto whitespace-pre-wrap leading-relaxed">
              {sqlCode}
            </pre>
            <div className="absolute top-4 right-4 text-[10px] text-slate-500 uppercase font-bold px-2 py-1 bg-white/5 rounded">PostgreSQL Script</div>
          </div>
        </section>

        {/* SEZIONE 3: LOGICA DI SINCRONIZZAZIONE */}
        <section className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-4">
            <ShieldCheck className="w-6 h-6 text-[#32964D]" />
            <h2 className="text-xl font-black uppercase tracking-widest text-slate-900">3. Logica Cruciale (App.tsx)</h2>
          </div>
          
          <div className="space-y-6">
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200">
              <h4 className="font-bold text-slate-900 mb-2">Sincronizzazione (fetchData)</h4>
              <p className="text-sm text-slate-600">
                La funzione <code>fetchData</code> scarica i dati da Supabase e li unisce a quelli locali. In caso di conflitto (stesso ID), i dati provenienti dal Cloud sovrascrivono quelli locali per garantire l'integrità dei dati master.
              </p>
            </div>
            
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200">
              <h4 className="font-bold text-slate-900 mb-2">Notifiche Realtime</h4>
              <p className="text-sm text-slate-600">
                Il sistema utilizza il <code>postgres_changes</code> di Supabase per ascoltare la tabella <code>notifiche</code>. Quando l'Admin incassa, un record viene creato per l'operatore proprietario, scatenando un avviso visuale immediato sul suo dispositivo.
              </p>
            </div>
          </div>
        </section>

        {/* SEZIONE 4: INFRASTRUTTURA VERCEL */}
        <section className="bg-sky-50 p-10 rounded-[2.5rem] border border-sky-200 shadow-sm">
          <div className="flex items-center gap-3 mb-8 border-b border-sky-100 pb-4">
            <Globe className="w-6 h-6 text-sky-600" />
            <h2 className="text-xl font-black uppercase tracking-widest text-sky-900">4. Hosting & Deployment (Vercel)</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm text-sky-800">
            <div className="bg-white/50 p-6 rounded-2xl border border-sky-100">
              <h4 className="font-bold mb-2">Configurazione Routing</h4>
              <p>È presente un file <code>vercel.json</code> nella root del progetto. Questo file è fondamentale per reindirizzare tutte le richieste su <code>index.html</code>, permettendo al router di React di funzionare correttamente senza dare errori 404 al ricaricamento della pagina.</p>
            </div>
            <div className="bg-white/50 p-6 rounded-2xl border border-sky-100">
              <h4 className="font-bold mb-2">Vantaggi Vercel</h4>
              <p>Il piano gratuito di Vercel offre circa 6000 minuti di build al mese, eliminando i problemi di sospensione riscontrati su altri provider. I dati persistono su Supabase, quindi i deploy non influenzano le vendite registrate.</p>
            </div>
          </div>
        </section>

        <div className="text-center pt-10 border-t border-slate-100 opacity-50 text-[10px] uppercase font-black tracking-widest">
          Documento generato dal Sistema di Supporto Tecnico - SalesManager v1.2 (Realtime Edition)
        </div>
      </div>
    </div>
  );
};

export default TechnicalManual;
