import { Client, Deal, DealActivity, PipelineStage, StageDefinition, Task, User } from '../types/crm';
import { getSupabaseClient } from './supabaseClient';

export const STAGES: StageDefinition[] = [
  {
    id: 'lead',
    title: 'Lead / Prospecção',
    description: 'Novas oportunidades identificadas',
    color: 'text-sky-700 dark:text-sky-300',
    bgHeader: 'bg-sky-50 dark:bg-sky-950/40',
    borderAccent: 'border-t-sky-500',
  },
  {
    id: 'qualification',
    title: 'Qualificação',
    description: 'Diagnóstico de necessidades e perfil',
    color: 'text-indigo-700 dark:text-indigo-300',
    bgHeader: 'bg-indigo-50 dark:bg-indigo-950/40',
    borderAccent: 'border-t-indigo-500',
  },
  {
    id: 'proposal',
    title: 'Apresentação / Proposta',
    description: 'Proposta comercial enviada',
    color: 'text-amber-700 dark:text-amber-300',
    bgHeader: 'bg-amber-50 dark:bg-amber-950/40',
    borderAccent: 'border-t-amber-500',
  },
  {
    id: 'negotiation',
    title: 'Negociação',
    description: 'Alinhamento contratual e valores',
    color: 'text-purple-700 dark:text-purple-300',
    bgHeader: 'bg-purple-50 dark:bg-purple-950/40',
    borderAccent: 'border-t-purple-500',
  },
  {
    id: 'won',
    title: 'Fechado / Ganho',
    description: 'Venda concretizada com sucesso',
    color: 'text-emerald-700 dark:text-emerald-300',
    bgHeader: 'bg-emerald-50 dark:bg-emerald-950/40',
    borderAccent: 'border-t-emerald-500',
  },
  {
    id: 'lost',
    title: 'Perdido',
    description: 'Oportunidade descartada',
    color: 'text-rose-700 dark:text-rose-300',
    bgHeader: 'bg-rose-50 dark:bg-rose-950/40',
    borderAccent: 'border-t-rose-500',
  },
];

const INITIAL_USERS: User[] = [
  {
    id: 'usr_gestor_1',
    name: 'Roberto Mendes',
    email: 'roberto.mendes@fluxocrm.com.br',
    password: '123456',
    role: 'gestor',
    phone: '(11) 98765-4321',
    targetSales: 150000,
    active: true,
    createdAt: '2026-01-15T08:00:00Z',
  },
  {
    id: 'usr_vend_1',
    name: 'Ana Paula Ferreira',
    email: 'ana.ferreira@fluxocrm.com.br',
    password: '123456',
    role: 'vendedor',
    phone: '(11) 99123-4567',
    targetSales: 45000,
    active: true,
    createdAt: '2026-02-01T09:00:00Z',
  },
  {
    id: 'usr_vend_2',
    name: 'Lucas Silveira',
    email: 'lucas.silveira@fluxocrm.com.br',
    password: '123456',
    role: 'vendedor',
    phone: '(11) 98234-5678',
    targetSales: 50000,
    active: true,
    createdAt: '2026-02-10T10:00:00Z',
  },
  {
    id: 'usr_vend_3',
    name: 'Mariana Costa',
    email: 'mariana.costa@fluxocrm.com.br',
    password: '123456',
    role: 'vendedor',
    phone: '(21) 97345-6789',
    targetSales: 40000,
    active: true,
    createdAt: '2026-02-15T11:00:00Z',
  },
];

const INITIAL_CLIENTS: Client[] = [];

const INITIAL_DEALS: Deal[] = [];

const INITIAL_TASKS: Task[] = [];

const INITIAL_ACTIVITIES: DealActivity[] = [];

const STORAGE_KEYS = {
  USERS: 'fluxocrm_users_v2',
  CLIENTS: 'fluxocrm_clients_v2',
  DEALS: 'fluxocrm_deals_v2',
  TASKS: 'fluxocrm_tasks_v2',
  ACTIVITIES: 'fluxocrm_activities_v2',
  CURRENT_USER_ID: 'fluxocrm_current_user_id_v2',
};

// Local storage helpers
function getStored<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) return defaultValue;
    return JSON.parse(item) as T;
  } catch {
    return defaultValue;
  }
}

function setStored<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error('Local storage error', err);
  }
}

// Background sync to Supabase (if Supabase environment is connected)
async function syncEntityToSupabase(table: string, data: Record<string, unknown>) {
  const sb = getSupabaseClient();
  if (!sb) return;
  try {
    await sb.from(table).upsert(data);
  } catch {
    // Non-blocking sync error
  }
}

export const StorageService = {
  // Current user session
  getCurrentUserId(): string {
    const id = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
    return id || '';
  },

  setCurrentUserId(id: string): void {
    if (!id) {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
    } else {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, id);
    }
  },

  // Users / Sellers
  getUsers(): User[] {
    const list = getStored<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
    return list.map((u) => ({
      ...u,
      password: u.password || '123456',
    }));
  },

  getUserById(id: string): User | undefined {
    return this.getUsers().find((u) => u.id === id);
  },

  saveUser(user: User): User {
    const users = this.getUsers();
    const index = users.findIndex((u) => u.id === user.id);
    let updated: User[];
    if (index >= 0) {
      updated = [...users];
      updated[index] = user;
    } else {
      updated = [user, ...users];
    }
    setStored(STORAGE_KEYS.USERS, updated);
    syncEntityToSupabase('sellers', user as unknown as Record<string, unknown>);
    return user;
  },

  // Clients
  getClients(): Client[] {
    return getStored<Client[]>(STORAGE_KEYS.CLIENTS, INITIAL_CLIENTS);
  },

  getClientById(id: string): Client | undefined {
    return this.getClients().find((c) => c.id === id);
  },

  saveClient(client: Client): Client {
    const clients = this.getClients();
    const index = clients.findIndex((c) => c.id === client.id);
    let updated: Client[];
    if (index >= 0) {
      updated = [...clients];
      updated[index] = { ...client, updatedAt: new Date().toISOString() };
    } else {
      updated = [client, ...clients];
    }
    setStored(STORAGE_KEYS.CLIENTS, updated);
    syncEntityToSupabase('clients', client as unknown as Record<string, unknown>);
    return client;
  },

  updateClientPhone(clientId: string, newPhone: string, updatedByUserName: string): Client | null {
    const clients = this.getClients();
    const clientIndex = clients.findIndex((c) => c.id === clientId);
    if (clientIndex === -1) return null;

    const oldPhone = clients[clientIndex].phone;
    clients[clientIndex] = {
      ...clients[clientIndex],
      phone: newPhone,
      updatedAt: new Date().toISOString(),
    };
    setStored(STORAGE_KEYS.CLIENTS, clients);
    syncEntityToSupabase('clients', clients[clientIndex] as unknown as Record<string, unknown>);

    // Also update phone in all deals of this client
    const deals = this.getDeals();
    const updatedDeals = deals.map((d) => {
      if (d.clientId === clientId) {
        return {
          ...d,
          clientPhone: newPhone,
          updatedAt: new Date().toISOString(),
        };
      }
      return d;
    });
    setStored(STORAGE_KEYS.DEALS, updatedDeals);

    // Also update phone in all tasks of this client
    const tasks = this.getTasks();
    const updatedTasks = tasks.map((t) => {
      if (t.clientId === clientId) {
        return {
          ...t,
          clientPhone: newPhone,
        };
      }
      return t;
    });
    setStored(STORAGE_KEYS.TASKS, updatedTasks);

    // Record activity on affected deals
    const clientDeals = deals.filter((d) => d.clientId === clientId);
    clientDeals.forEach((deal) => {
      this.addActivity({
        dealId: deal.id,
        sellerId: deal.sellerId,
        sellerName: updatedByUserName,
        type: 'phone_update',
        content: `Número de telefone atualizado de ${oldPhone || 'vazio'} para ${newPhone}.`,
      });
    });

    return clients[clientIndex];
  },

  // Deals (Pipeline Funnel)
  getDeals(): Deal[] {
    return getStored<Deal[]>(STORAGE_KEYS.DEALS, INITIAL_DEALS);
  },

  getDealById(id: string): Deal | undefined {
    return this.getDeals().find((d) => d.id === id);
  },

  saveDeal(deal: Deal): Deal {
    const deals = this.getDeals();
    const index = deals.findIndex((d) => d.id === deal.id);
    let updated: Deal[];
    if (index >= 0) {
      updated = [...deals];
      updated[index] = { ...deal, updatedAt: new Date().toISOString() };
    } else {
      updated = [deal, ...deals];
    }
    setStored(STORAGE_KEYS.DEALS, updated);
    syncEntityToSupabase('pipeline_deals', deal as unknown as Record<string, unknown>);
    return deal;
  },

  updateDealStage(
    dealId: string,
    newStage: PipelineStage,
    sellerId: string,
    sellerName: string,
    lostReason?: string
  ): Deal | null {
    const deals = this.getDeals();
    const index = deals.findIndex((d) => d.id === dealId);
    if (index === -1) return null;

    const oldStage = deals[index].stage;
    const stageNames: Record<PipelineStage, string> = {
      lead: 'Lead / Prospecção',
      qualification: 'Qualificação',
      proposal: 'Apresentação / Proposta',
      negotiation: 'Negociação',
      won: 'Fechado / Ganho',
      lost: 'Perdido',
    };

    const isWon = newStage === 'won';
    const isLost = newStage === 'lost';

    const updatedDeal: Deal = {
      ...deals[index],
      stage: newStage,
      probability: isWon ? 100 : isLost ? 0 : deals[index].probability,
      wonDate: isWon ? new Date().toISOString() : undefined,
      lostReason: isLost ? (lostReason || 'Desistência do cliente') : undefined,
      updatedAt: new Date().toISOString(),
    };

    deals[index] = updatedDeal;
    setStored(STORAGE_KEYS.DEALS, deals);
    syncEntityToSupabase('pipeline_deals', updatedDeal as unknown as Record<string, unknown>);

    this.addActivity({
      dealId,
      sellerId,
      sellerName,
      type: 'stage_change',
      content: `Etapa alterada de "${stageNames[oldStage]}" para "${stageNames[newStage]}".`,
    });

    return updatedDeal;
  },

  // Tasks
  getTasks(): Task[] {
    return getStored<Task[]>(STORAGE_KEYS.TASKS, INITIAL_TASKS);
  },

  saveTask(task: Task): Task {
    const tasks = this.getTasks();
    const index = tasks.findIndex((t) => t.id === task.id);
    let updated: Task[];
    if (index >= 0) {
      updated = [...tasks];
      updated[index] = task;
    } else {
      updated = [task, ...tasks];
    }
    setStored(STORAGE_KEYS.TASKS, updated);
    syncEntityToSupabase('tasks', task as unknown as Record<string, unknown>);

    // Update deal nextTask if applicable
    if (task.dealId && !task.completed) {
      const deals = this.getDeals();
      const dealIdx = deals.findIndex((d) => d.id === task.dealId);
      if (dealIdx >= 0) {
        deals[dealIdx].nextTaskDate = task.dueDate;
        deals[dealIdx].nextTaskTitle = task.title;
        setStored(STORAGE_KEYS.DEALS, deals);
      }
    }

    return task;
  },

  toggleTaskCompletion(taskId: string, sellerName: string): Task | null {
    const tasks = this.getTasks();
    const index = tasks.findIndex((t) => t.id === taskId);
    if (index === -1) return null;

    const completed = !tasks[index].completed;
    const updated: Task = {
      ...tasks[index],
      completed,
      completedAt: completed ? new Date().toISOString() : undefined,
    };

    tasks[index] = updated;
    setStored(STORAGE_KEYS.TASKS, tasks);
    syncEntityToSupabase('tasks', updated as unknown as Record<string, unknown>);

    if (updated.dealId && completed) {
      this.addActivity({
        dealId: updated.dealId,
        sellerId: updated.sellerId,
        sellerName,
        type: 'task_completed',
        content: `Tarefa concluída: "${updated.title}".`,
      });
    }

    return updated;
  },

  // Activities
  getActivities(dealId?: string): DealActivity[] {
    const all = getStored<DealActivity[]>(STORAGE_KEYS.ACTIVITIES, INITIAL_ACTIVITIES);
    if (dealId) {
      return all.filter((a) => a.dealId === dealId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  addActivity(act: Omit<DealActivity, 'id' | 'createdAt'>): DealActivity {
    const activities = getStored<DealActivity[]>(STORAGE_KEYS.ACTIVITIES, INITIAL_ACTIVITIES);
    const newAct: DealActivity = {
      id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
      ...act,
    };
    const updated = [newAct, ...activities];
    setStored(STORAGE_KEYS.ACTIVITIES, updated);
    syncEntityToSupabase('deal_activities', newAct as unknown as Record<string, unknown>);
    return newAct;
  },

  // Clear all clients, deals, tasks and activities for fresh manual entry
  clearAllClientsAndDeals(): void {
    setStored(STORAGE_KEYS.CLIENTS, []);
    setStored(STORAGE_KEYS.DEALS, []);
    setStored(STORAGE_KEYS.TASKS, []);
    setStored(STORAGE_KEYS.ACTIVITIES, []);
  },

  // Reset to initial demo data if needed
  resetToSampleData(): void {
    setStored(STORAGE_KEYS.USERS, INITIAL_USERS);
    setStored(STORAGE_KEYS.CLIENTS, []);
    setStored(STORAGE_KEYS.DEALS, []);
    setStored(STORAGE_KEYS.TASKS, []);
    setStored(STORAGE_KEYS.ACTIVITIES, []);
    setStored(STORAGE_KEYS.CURRENT_USER_ID, 'usr_gestor_1');
  },
};
