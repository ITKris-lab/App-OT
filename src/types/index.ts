
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'patient';
  sector?: string; // Reemplaza a department
  createdAt: any; // Se convierte a Date en la app
  updatedAt: any; // Se convierte a Date en la app
}

export interface Orden {
  id: string;
  title: string;
  description: string;
  category: OrdenCategory;
  activity: OrdenActivity; // Nuevo campo
  priority: OrdenPriority;
  status: OrdenStatus;
  createdBy: string; // User ID
  createdByName: string;
  location?: string;
  imageUrl?: string; // URL de la imagen principal
  attachments?: Attachment[]; // Para compatibilidad futura
  comments?: Comment[];
  createdAt: any; // Se convierte a Date en la app
  updatedAt: any; // Se convierte a Date en la app
  resolvedAt?: any; // Se convierte a Date en la app
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'document';
  size: number;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: any; // Se convierte a Date en la app
}

export type OrdenCategory = 
  | 'climatizacion'
  | 'electrica'
  | 'mecanica'
  | 'electronica'
  | 'operacion'
  | 'fontaneria'
  | 'albanileria'
  | 'pintura'
  | 'carpinteria';

export type OrdenActivity =
  | 'reparacion'
  | 'mantenimiento'
  | 'mejoramiento'
  | 'instalacion'
  | 'traslado'
  | 'revision'
  | 'limpieza'
  | 'reemplazo'
  | 'verificacion';

export type OrdenPriority = 'low' | 'medium' | 'high';

export type OrdenStatus = 
  | 'open'
  | 'in_progress'
  | 'pending'
  | 'resolved'
  | 'closed'
  | 'cancelled';
