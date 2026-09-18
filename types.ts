
export interface Operatore {
  id: string;
  nome: string;
  email: string;
  password?: string;
  role: 'admin' | 'agent';
}

export interface Agente {
  id: string;
  nome: string;
  email: string;
  operatoreEmail: string;
  telefono?: string;
  zona?: string;
}

export interface Vendita {
  id: string;
  data: string;
  cliente: string;
  importo: number;
  metodoPagamento: string;
  sconto: string;
  agente: string;
  operatoreEmail: string;
  incassato: boolean;
  verificarePagamento?: boolean;
  pagamentoVerificato?: boolean;
  noteAmministrazione: string;
  notizie?: string;
  nuove_notizie?: boolean;
  ultimo_mittente?: string; 
  created_at?: string;
  ultima_modifica_da?: string;
  ultima_modifica_at?: string;
}

export interface EmailConfig {
  operatore_email: string;
  provider: 'local' | 'smtp';
  from_name?: string;
  smtp_server?: string;
  smtp_port?: string;
  smtp_user?: string;
  smtp_pass?: string;
}

export const ADMIN_EMAIL = 'admin@example.com';

export interface StoricoModificaOrdineSito {
  data: string;
  operatore: string;
  vecchio_importo: number;
  nuovo_importo: number;
}

export interface OrdineSito {
  id: string;
  cliente: string;
  importo: number;
  mese_riferimento: string; // formato "YYYY-MM" (es: "2026-09")
  data_inserimento: string; // data/ora creazione
  operatore_nome: string;
  operatore_email: string;
  importo_originale?: number;
  storico_modifiche?: StoricoModificaOrdineSito[];
  created_at?: string;
  updated_at?: string;
}
