
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
}

export interface EmailConfig {
  operatore_email: string;
  provider: 'local' | 'smtp';
  fromName?: string;
  smtpServer?: string;
  smtpPort?: string;
  smtpUser?: string;
  smtpPass?: string; // Password per le app di Google
}

export const ADMIN_EMAIL = 'admin@example.com';
