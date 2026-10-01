import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  Phone, 
  MessageCircle, 
  Calendar, 
  Plus, 
  Edit3, 
  AlertCircle, 
  Building2, 
  CheckSquare, 
  Kanban,
  Target,
  TrendingUp,
  DollarSign,
  Search,
  Lock,
  Check,
  X
} from 'lucide-react';
import { Client, Deal, PipelineStage, PotentialClient, Task, TaskType, User } from '../types/crm';
import { KanbanBoard } from './KanbanBoard';
import { 
  formatCurrencyBRL, 
  formatDateBR, 
  cleanPhoneForWhatsApp, 
  getRelativeDateLabel 
} from '../utils/formatters';
import { formatPhone, formatCNPJ } from '../services/brasilApi';

interface SellerDashboardProps {
  currentUser: User;
  users: User[];
  deals: Deal[];
  tasks: Task[];
  clients: Client[];
  onToggleTask: (taskId: string) => void;
  onAddTask: (taskData: Omit<Task, 'id' | 'createdAt' | 'completed' | 'completedAt'>) => void;
  onUpdateStage: (dealId: string, newStage: PipelineStage) => void;
  onOpenDealDetail: (deal: Deal) => void;
  onOpenPhoneUpdate: (clientId: string, clientName: string, currentPhone: string) => void;
  onSavePhone?: (clientId: string, newPhone: string) => void;
  onOpenHomologation?: (potentialClient: PotentialClient) => void;
}

export const SellerDashboard: React.FC<SellerDashboardProps> = ({
  currentUser,
  users,
  deals,
  tasks,
  clients,
  onToggleTask,
  onAddTask,
  onUpdateStage,
  onOpenDealDetail,
  onOpenPhoneUpdate,
  onSavePhone,
}) => {
  const [activeTab, setActiveTab] = useState<'funil' | 'tarefas' | 'clientes'>('funil');
  const [taskFilter, setTaskFilter] = useState<'hoje' | 'atrasadas' | 'proximas' | 'todas' | 'concluidas'>('hoje');
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);

  // Client Phone Management State (Apenas atualizar telefone)
  const [clientSearch, setClientSearch] = useState('');
  const [phoneFilter, setPhoneFilter] = useState<'todos' | 'com_telefone' | 'sem_telefone'>('todos');
  const [inlineEditClientId, setInlineEditClientId] = useState<string | null>(null);
  const [inlinePhoneValue, setInlinePhoneValue] = useState('');
  const [inlineSavedId, setInlineSavedId] = useState<string | null>(null);

  // New task form state
  const [selectedClientId, setSelectedClientId] = useState(clients[0]?.id || '');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskType, setNewTaskType] = useState<TaskType>('ligacao');
  const [newTaskDate, setNewTaskDate] = useState(new Date().toISOString().split('T')[0]);
  const [newTaskTime, setNewTaskTime] = useState('14:00');

  // Filter tasks for this seller
  const sellerTasks = tasks.filter((t) => t.sellerId === currentUser.id);

  // Filter deals for this seller
  const sellerDeals = deals.filter((d) => d.sellerId === currentUser.id);

  // Seller metrics
  const wonDeals = sellerDeals.filter((d) => d.stage === 'won');
  const totalWonValue = wonDeals.reduce((sum, d) => sum + d.value, 0);
  const activePipelineDeals = sellerDeals.filter((d) => d.stage !== 'won' && d.stage !== 'lost');
  const totalPipelineValue = activePipelineDeals.reduce((sum, d) => sum + d.value, 0);
  const targetPercent = currentUser.targetSales > 0 
    ? Math.round((totalWonValue / currentUser.targetSales) * 100) 
    : 0;

  // Clientes da carteira do vendedor
  const sellerClients = clients.filter(
    (c) => c.assignedSellerId === currentUser.id || sellerDeals.some((d) => d.clientId === c.id)
  );
  const displayClientsList = sellerClients.length > 0 ? sellerClients : clients;

  const clientsWithPhone = displayClientsList.filter((c) => Boolean(c.phone && c.phone.trim().length >= 8)).length;
  const clientsWithoutPhone = displayClientsList.length - clientsWithPhone;

  const filteredClients = displayClientsList.filter((c) => {
    if (clientSearch.trim()) {
      const q = clientSearch.toLowerCase();
      const matchName = (c.tradeName || '').toLowerCase().includes(q);
      const matchCorp = (c.corporateName || '').toLowerCase().includes(q);
      const matchCnpj = (c.cnpj || '').includes(q);
      const matchCity = (c.city || '').toLowerCase().includes(q);
      const matchContact = (c.contactName || '').toLowerCase().includes(q);
      if (!matchName && !matchCorp && !matchCnpj && !matchCity && !matchContact) return false;
    }
    const hasPhone = Boolean(c.phone && c.phone.trim().length >= 8);
    if (phoneFilter === 'com_telefone') return hasPhone;
    if (phoneFilter === 'sem_telefone') return !hasPhone;
    return true;
  });

  const handleSaveInlinePhone = (client: Client) => {
    if (onSavePhone) {
      onSavePhone(client.id, inlinePhoneValue);
    } else {
      onOpenPhoneUpdate(client.id, client.tradeName || client.corporateName, inlinePhoneValue);
    }
    setInlineSavedId(client.id);
    setInlineEditClientId(null);
    setTimeout(() => {
      setInlineSavedId(null);
    }, 2000);
  };

  // Filter tasks by date criteria
  const todayStr = new Date().toISOString().split('T')[0];

  const filteredTasks = sellerTasks.filter((task) => {
    if (taskFilter === 'concluidas') return task.completed;
    if (task.completed) return false;

    if (taskFilter === 'hoje') {
      return task.dueDate === todayStr;
    }
    if (taskFilter === 'atrasadas') {
      return task.dueDate < todayStr;
    }
    if (taskFilter === 'proximas') {
      return task.dueDate > todayStr;
    }
    return true; // 'todas'
  });

  const countPendingToday = sellerTasks.filter((t) => !t.completed && t.dueDate === todayStr).length;
  const countOverdue = sellerTasks.filter((t) => !t.completed && t.dueDate < todayStr).length;
  const countUpcoming = sellerTasks.filter((t) => !t.completed && t.dueDate > todayStr).length;
  const countCompleted = sellerTasks.filter((t) => t.completed).length;

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !selectedClientId) return;

    const client = clients.find((c) => c.id === selectedClientId);
    const clientDeal = sellerDeals.find((d) => d.clientId === selectedClientId);

    onAddTask({
      clientId: selectedClientId,
      clientName: client?.tradeName || client?.corporateName || 'Cliente',
      clientPhone: client?.phone,
      dealId: clientDeal?.id,
      sellerId: currentUser.id,
      sellerName: currentUser.name,
      title: newTaskTitle.trim(),
      description: newTaskDesc.trim() || undefined,
      dueDate: newTaskDate,
      dueTime: newTaskTime || undefined,
      type: newTaskType,
    });

    setNewTaskTitle('');
    setNewTaskDesc('');
    setShowNewTaskModal(false);
  };

  return (
    <div className="space-y-5">
      {/* Top Banner & KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Sales Target Goal */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Meta Mensal</span>
            <Target className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-slate-900">
            {formatCurrencyBRL(currentUser.targetSales)}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="text-slate-500">Realizado: <strong className="font-mono text-emerald-700">{formatCurrencyBRL(totalWonValue)}</strong></span>
            <span className="font-bold font-mono text-indigo-700">{targetPercent}%</span>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1.5 overflow-hidden">
            <div 
              className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500" 
              style={{ width: `${Math.min(targetPercent, 100)}%` }}
            />
          </div>
        </div>

        {/* Pipeline Value */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Pipeline em Aberto</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-slate-900">
            {formatCurrencyBRL(totalPipelineValue)}
          </div>
          <div className="text-xs text-slate-500 mt-2">
            <strong className="font-mono text-slate-800">{activePipelineDeals.length}</strong> oportunidades ativas
          </div>
        </div>

        {/* Tasks Today */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Tarefas para Hoje</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-slate-900">
            {countPendingToday}
          </div>
          <div className="text-xs text-slate-500 mt-2">
            {countOverdue > 0 ? (
              <span className="text-rose-600 font-semibold">{countOverdue} em atraso</span>
            ) : (
              <span className="text-emerald-600 font-medium">Nenhuma tarefa atrasada</span>
            )}
          </div>
        </div>

        {/* Closed Won */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Vendas Fechadas</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-slate-900">
            {wonDeals.length}
          </div>
          <div className="text-xs text-slate-500 mt-2">
            Total Ganho: <strong className="font-mono text-emerald-700">{formatCurrencyBRL(totalWonValue)}</strong>
          </div>
        </div>
      </div>

      {/* Main View Tabs: Tarefas (Primary requirement) vs Funil Kanban */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-black/10 dark:border-slate-800 shadow-xs overflow-hidden">
        {/* Navigation Tabs */}
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50/60 dark:bg-slate-900/60">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('funil')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'funil'
                  ? 'bg-black dark:bg-blue-600 text-white shadow-xs'
                  : 'text-black dark:text-slate-300 hover:text-blue-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Kanban className="w-4 h-4 text-blue-500" />
              Meu Funil Kanban ({sellerDeals.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('tarefas')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'tarefas'
                  ? 'bg-black dark:bg-blue-600 text-white shadow-xs'
                  : 'text-black dark:text-slate-300 hover:text-blue-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <CheckSquare className="w-4 h-4 text-blue-500" />
              Minhas Tarefas & Contatos ({sellerTasks.filter(t => !t.completed).length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('clientes')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'clientes'
                  ? 'bg-black dark:bg-blue-600 text-white shadow-xs'
                  : 'text-black dark:text-slate-300 hover:text-blue-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Building2 className="w-4 h-4 text-blue-500" />
              Cadastro de Clientes ({displayClientsList.length})
            </button>
          </div>

          {activeTab === 'tarefas' && (
            <button
              type="button"
              onClick={() => setShowNewTaskModal(true)}
              className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Nova Tarefa Comercial
            </button>
          )}
        </div>

        {/* TAB 1: MEU FUNIL KANBAN (PRIMEIRA ABA DO VENDEDOR) */}
        {activeTab === 'funil' && (
          <div className="p-5 bg-slate-100/70 dark:bg-transparent rounded-b-2xl">
            <KanbanBoard
              deals={sellerDeals}
              users={users}
              currentUser={currentUser}
              onUpdateStage={onUpdateStage}
              onOpenDealDetail={onOpenDealDetail}
              onOpenPhoneUpdate={onOpenPhoneUpdate}
            />
          </div>
        )}

        {/* TAB 2: MINHAS TAREFAS & CONTATOS */}
        {activeTab === 'tarefas' && (
          <div className="p-5 space-y-4 bg-slate-100/70 dark:bg-transparent rounded-b-2xl">
            {/* Filter buttons */}
            <div className="flex items-center gap-2 flex-wrap bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
              <button
                onClick={() => setTaskFilter('hoje')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  taskFilter === 'hoje'
                    ? 'bg-amber-100 text-amber-900 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                Hoje ({countPendingToday})
              </button>
              <button
                onClick={() => setTaskFilter('atrasadas')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  taskFilter === 'atrasadas'
                    ? 'bg-rose-100 text-rose-900 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                Atrasadas ({countOverdue})
              </button>
              <button
                onClick={() => setTaskFilter('proximas')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  taskFilter === 'proximas'
                    ? 'bg-indigo-100 text-indigo-900 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                Próximas ({countUpcoming})
              </button>
              <button
                onClick={() => setTaskFilter('todas')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  taskFilter === 'todas'
                    ? 'bg-slate-200 text-slate-900 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                Todas Pendentes
              </button>
              <button
                onClick={() => setTaskFilter('concluidas')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  taskFilter === 'concluidas'
                    ? 'bg-emerald-100 text-emerald-900 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                Concluídas ({countCompleted})
              </button>
            </div>

            {/* Task Cards List */}
            {filteredTasks.length === 0 ? (
              <div className="py-12 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-60" />
                <h4 className="text-sm font-semibold text-slate-800">Nenhuma tarefa encontrada neste filtro!</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Você está em dia com as suas atividades comerciais ou selecione outro filtro acima.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {filteredTasks.map((task) => {
                  const client = clients.find((c) => c.id === task.clientId);
                  const currentPhone = client?.phone || task.clientPhone || '';
                  const waNumber = cleanPhoneForWhatsApp(currentPhone);
                  const relativeDate = getRelativeDateLabel(task.dueDate);

                  return (
                    <div
                      key={task.id}
                      className={`p-4 rounded-xl border transition-all ${
                        task.completed 
                          ? 'bg-slate-50 border-slate-200 opacity-60' 
                          : relativeDate.isOverdue
                          ? 'bg-white border-rose-200 hover:border-rose-300 shadow-2xs'
                          : relativeDate.isToday
                          ? 'bg-white border-amber-200 hover:border-amber-300 shadow-2xs'
                          : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                      }`}
                    >
                      {/* Top Header: Checkbox + Title + Type Badge */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <button
                            onClick={() => onToggleTask(task.id)}
                            className="mt-0.5 text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer"
                            title={task.completed ? 'Marcar como não concluída' : 'Marcar como concluída'}
                          >
                            {task.completed ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                            ) : (
                              <Circle className="w-5 h-5 text-slate-400 hover:text-slate-600" />
                            )}
                          </button>
                          <div>
                            <h4 className={`text-sm font-semibold ${task.completed ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                              {task.title}
                            </h4>
                            {task.description && (
                              <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                                {task.description}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Task Type */}
                        <span className="text-[11px] font-mono capitalize px-2 py-0.5 rounded bg-slate-100 text-slate-700 shrink-0">
                          {task.type}
                        </span>
                      </div>

                      {/* Client Info and Schedule */}
                      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[160px]">{task.clientName}</span>
                        </div>

                        <div className="flex items-center gap-1 text-[11px] font-mono">
                          <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className={relativeDate.isOverdue ? 'text-rose-600 font-semibold' : relativeDate.isToday ? 'text-amber-700 font-semibold' : 'text-slate-500'}>
                            {relativeDate.label} {task.dueTime ? `às ${task.dueTime}` : ''}
                          </span>
                        </div>
                      </div>

                      {/* CLIENT PHONE WITH DIRECT UPDATE BUTTON (Obrigatório: Vendedor pode atualizar o número de telefone) */}
                      <div className="mt-3 p-2.5 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 truncate">
                          <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <div>
                            <span className="text-[10px] text-slate-400 block leading-tight">Telefone do Cliente:</span>
                            <span className="font-mono text-xs font-bold text-slate-800">
                              {currentPhone || 'Não cadastrado'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* WhatsApp Direct Action */}
                          {currentPhone && (
                            <a
                              href={`https://wa.me/${waNumber}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-semibold flex items-center gap-1 transition-colors"
                              title="Conversar no WhatsApp"
                            >
                              <MessageCircle className="w-3 h-3" />
                              WhatsApp
                            </a>
                          )}

                          {/* Quick Update Button (Requirement: Vendedor atualiza telefone) */}
                          <button
                            onClick={() => onOpenPhoneUpdate(task.clientId, task.clientName, currentPhone)}
                            className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                            title="Atualizar número de telefone do cliente"
                          >
                            <Edit3 className="w-3 h-3 text-blue-600" />
                            Editar
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: CADASTRO DE CLIENTES (APENAS PARA O VENDEDOR ATUALIZAR O TELEFONE) */}
        {activeTab === 'clientes' && (
          <div className="p-5 space-y-5">
            {/* Metric Counters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block uppercase tracking-wider">
                  Total de Clientes
                </span>
                <div className="text-xl font-black text-black dark:text-white font-mono mt-0.5">
                  {displayClientsList.length}
                </div>
              </div>
              <div className="p-3.5 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-900/50">
                <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 block uppercase tracking-wider">
                  Com Telefone Atualizado
                </span>
                <div className="text-xl font-black text-emerald-700 dark:text-emerald-400 font-mono mt-0.5">
                  {clientsWithPhone}
                </div>
              </div>
              <div className="p-3.5 bg-amber-50/60 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-900/50">
                <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300 block uppercase tracking-wider">
                  Sem Telefone (Ação Prioritária)
                </span>
                <div className="text-xl font-black text-amber-700 dark:text-amber-400 font-mono mt-0.5">
                  {clientsWithoutPhone}
                </div>
              </div>
            </div>

            {/* Search & Filter Toolbar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  placeholder="Buscar cliente, CNPJ, cidade ou contato..."
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-black dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />
                {clientSearch && (
                  <button
                    onClick={() => setClientSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-black dark:hover:text-white cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5 self-start sm:self-auto overflow-x-auto w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setPhoneFilter('todos')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                    phoneFilter === 'todos'
                      ? 'bg-black dark:bg-blue-600 text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  Todos ({displayClientsList.length})
                </button>
                <button
                  type="button"
                  onClick={() => setPhoneFilter('sem_telefone')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                    phoneFilter === 'sem_telefone'
                      ? 'bg-amber-600 text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  Sem Telefone ({clientsWithoutPhone})
                </button>
                <button
                  type="button"
                  onClick={() => setPhoneFilter('com_telefone')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                    phoneFilter === 'com_telefone'
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  Com Telefone ({clientsWithPhone})
                </button>
              </div>
            </div>

            {/* Table of Clients */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-black dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span>Empresa / Razão Social</span>
                          <span title="Gerenciado pelo Gestor"><Lock className="w-3 h-3 text-slate-400" /></span>
                        </div>
                      </th>
                      <th className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span>Contato & Cidade</span>
                          <span title="Gerenciado pelo Gestor"><Lock className="w-3 h-3 text-slate-400" /></span>
                        </div>
                      </th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-blue-600 dark:text-blue-400 font-black">
                        Telefone (Editável)
                      </th>
                      <th className="py-3 px-4 text-right">Ações do Vendedor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredClients.map((client) => {
                      const isInlineEditing = inlineEditClientId === client.id;
                      const hasPhone = Boolean(client.phone && client.phone.trim().length >= 8);
                      const waNumber = cleanPhoneForWhatsApp(client.phone || '');

                      return (
                        <tr key={client.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                          {/* Empresa */}
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-black dark:text-white">
                              {client.tradeName || client.corporateName}
                            </div>
                            {client.corporateName && client.tradeName && client.tradeName !== client.corporateName && (
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-xs">
                                {client.corporateName}
                              </div>
                            )}
                            <div className="text-[11px] font-mono text-slate-400 dark:text-slate-500 mt-0.5">
                              CNPJ: {formatCNPJ(client.cnpj || '')}
                            </div>
                          </td>

                          {/* Contato & Cidade */}
                          <td className="py-3.5 px-4">
                            <div className="text-slate-800 dark:text-slate-200 font-medium">
                              {client.contactName || 'Contato Principal'}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">
                              {client.city ? `${client.city}/${client.state || ''}` : 'Cidade não informada'}
                            </div>
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4">
                            <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                              client.homologationStatus === 'aprovado'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : client.homologationStatus === 'reprovado'
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                                : client.homologationStatus === 'em_homologacao'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                            }`}>
                              {client.homologationStatus === 'aprovado'
                                ? 'Aprovado'
                                : client.homologationStatus === 'reprovado'
                                ? 'Reprovado'
                                : client.homologationStatus === 'em_homologacao'
                                ? 'Em Homologação'
                                : 'Pendente'}
                            </span>
                          </td>

                          {/* Telefone (Editável) */}
                          <td className="py-3.5 px-4">
                            {isInlineEditing ? (
                              <div className="flex items-center gap-1.5 max-w-xs">
                                <input
                                  type="text"
                                  value={inlinePhoneValue}
                                  onChange={(e) => setInlinePhoneValue(formatPhone(e.target.value))}
                                  placeholder="(11) 99999-9999"
                                  autoFocus
                                  className="px-2.5 py-1 text-xs bg-white dark:bg-slate-800 border-2 border-blue-600 rounded-lg text-black dark:text-white font-mono focus:outline-none w-36 shadow-xs"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleSaveInlinePhone(client)}
                                  className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg cursor-pointer"
                                  title="Salvar Telefone"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setInlineEditClientId(null)}
                                  className="p-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 rounded-lg cursor-pointer"
                                  title="Cancelar"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                {hasPhone ? (
                                  <span className="font-mono font-bold text-black dark:text-white text-xs">
                                    {formatPhone(client.phone)}
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-900/60">
                                    <AlertCircle className="w-3 h-3" />
                                    Sem telefone
                                  </span>
                                )}
                                {inlineSavedId === client.id && (
                                  <span className="text-[10px] text-emerald-600 font-bold animate-pulse">
                                    Salvo!
                                  </span>
                                )}
                              </div>
                            )}
                          </td>

                          {/* Ações */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Botão Atualizar Telefone Rápido (Inline) */}
                              <button
                                type="button"
                                onClick={() => {
                                  setInlineEditClientId(client.id);
                                  setInlinePhoneValue(client.phone || '');
                                }}
                                className="px-2.5 py-1 text-xs font-bold bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                                title="Editar telefone diretamente nesta linha"
                              >
                                <Edit3 className="w-3 h-3" />
                                <span>Editar</span>
                              </button>

                              {/* Botão Modal completo */}
                              <button
                                type="button"
                                onClick={() => onOpenPhoneUpdate(client.id, client.tradeName || client.corporateName, client.phone || '')}
                                className="px-2.5 py-1 text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                                title="Abrir janela de atualização de telefone"
                              >
                                <Phone className="w-3 h-3" />
                                <span className="hidden sm:inline">Atualizar</span>
                              </button>

                              {/* Botão WhatsApp */}
                              {hasPhone && waNumber ? (
                                <a
                                  href={`https://wa.me/55${waNumber}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 rounded-lg border border-emerald-200 dark:border-emerald-800 transition-colors inline-flex items-center justify-center cursor-pointer"
                                  title="Conversar no WhatsApp"
                                >
                                  <MessageCircle className="w-3.5 h-3.5" />
                                </a>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {filteredClients.length === 0 && (
                <div className="p-8 text-center text-slate-500 dark:text-slate-400 space-y-2">
                  <Building2 className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                  <p className="text-xs font-bold text-black dark:text-white">
                    Nenhum cliente encontrado
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {clientSearch
                      ? `Nenhum resultado corresponde à busca "${clientSearch}".`
                      : 'Nenhum cliente cadastrado nesta visualização.'}
                  </p>
                  {clientSearch && (
                    <button
                      onClick={() => {
                        setClientSearch('');
                        setPhoneFilter('todos');
                      }}
                      className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer"
                    >
                      Limpar filtros
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal: Nova Tarefa Comercial */}
      {showNewTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Agendar Nova Tarefa Comercial</h3>
              <button
                onClick={() => setShowNewTaskModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Cliente / Empresa</label>
                <select
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800"
                  required
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.tradeName || c.corporateName} ({c.cnpj})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Título da Atividade</label>
                <input
                  type="text"
                  placeholder="Ex: Ligar para alinhar dúvidas sobre o contrato"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tipo</label>
                  <select
                    value={newTaskType}
                    onChange={(e) => setNewTaskType(e.target.value as TaskType)}
                    className="w-full px-2 py-2 bg-white border border-slate-300 rounded-lg text-slate-800"
                  >
                    <option value="ligacao">Ligação</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="reuniao">Reunião</option>
                    <option value="proposta">Proposta</option>
                    <option value="email">E-mail</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Data</label>
                  <input
                    type="date"
                    value={newTaskDate}
                    onChange={(e) => setNewTaskDate(e.target.value)}
                    className="w-full px-2 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Horário</label>
                  <input
                    type="time"
                    value={newTaskTime}
                    onChange={(e) => setNewTaskTime(e.target.value)}
                    className="w-full px-2 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Detalhes Adicionais (opcional)</label>
                <textarea
                  placeholder="Anotações para a reunião ou pontos chave do cliente..."
                  value={newTaskDesc}
                  onChange={(e) => setNewTaskDesc(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewTaskModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs"
                >
                  Agendar Tarefa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
