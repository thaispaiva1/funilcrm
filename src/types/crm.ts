export type UserRole = 'gestor' | 'vendedor';

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  phone: string;
  avatar?: string;
  targetSales: number; // Meta mensal em R$
  active: boolean;
  createdAt: string;
}

export type PipelineStage = 
  | 'lead' 
  | 'qualification' 
  | 'proposal' 
  | 'negotiation' 
  | 'won' 
  | 'lost';

export interface StageDefinition {
  id: PipelineStage;
  title: string;
  description: string;
  color: string;
  bgHeader: string;
  borderAccent: string;
}

export type HomologationStatus = 'em_homologacao' | 'aprovado' | 'reprovado' | 'pendente';

export interface Client {
  id: string;
  cnpj: string;
  corporateName: string; // Razão Social
  tradeName: string; // Nome Fantasia
  contactName: string;
  phone: string;
  email: string;
  cnae?: string;
  statusCadastral?: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  assignedSellerId: string;
  notes?: string;
  homologationStatus?: HomologationStatus;
  homologationNotes?: string;
  homologationDate?: string;
  placeId?: string;
  lat?: number;
  lng?: number;
  createdAt: string;
  updatedAt: string;
}

export interface PotentialClient {
  id: string;
  placeId: string;
  name: string;
  formattedAddress: string;
  phone?: string;
  rating?: number;
  userRatingsTotal?: number;
  location: {
    lat: number;
    lng: number;
  };
  cnaeCode?: string;
  cnaeDescription?: string;
  businessType?: string;
  isAlreadyClient?: boolean;
  homologationStatus?: HomologationStatus;
  distanceKm?: number;
  neighborhood?: string;
}

export type PriorityLevel = 'baixa' | 'media' | 'alta';

export interface Deal {
  id: string;
  title: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  clientCnpj: string;
  clientCity?: string;
  clientState?: string;
  sellerId: string;
  sellerName: string;
  stage: PipelineStage;
  value: number; // em R$
  priority: PriorityLevel;
  probability: number; // 0-100%
  expectedCloseDate: string;
  wonDate?: string;
  lostReason?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  nextTaskDate?: string;
  nextTaskTitle?: string;
}

export type TaskType = 'ligacao' | 'whatsapp' | 'reuniao' | 'email' | 'proposta';

export interface Task {
  id: string;
  dealId?: string;
  clientId: string;
  clientName: string;
  clientPhone?: string;
  sellerId: string;
  sellerName?: string;
  title: string;
  description?: string;
  dueDate: string; // YYYY-MM-DD
  dueTime?: string; // HH:mm
  type: TaskType;
  completed: boolean;
  completedAt?: string;
  createdAt: string;
}

export interface DealActivity {
  id: string;
  dealId: string;
  sellerId: string;
  sellerName: string;
  type: 'note' | 'stage_change' | 'phone_update' | 'task_completed' | 'created';
  content: string;
  createdAt: string;
}

export interface BrasilApiCnpjResponse {
  cnpj: string;
  razao_social: string;
  nome_fantasia: string;
  situacao_cadastral: string;
  descricao_situacao_cadastral: string;
  cnae_fiscal: number;
  cnae_fiscal_descricao: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  municipio: string;
  uf: string;
  cep: string;
  ddd_telefone_1: string;
  ddd_telefone_2: string;
  email: string;
}
