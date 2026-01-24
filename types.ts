
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
  noteAmministrazione: string;
  notizie?: string;
  nuove_notizie?: boolean;
  ultimo_mittente?: string; // Nome di chi ha inviato l'ultimo messaggio
  created_at?: string;
}

export const ADMIN_EMAIL = 'admin@example.com';
