import React, { useState } from 'react';
import { 
  X, 
  Building2, 
  Phone, 
  MapPin, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Send, 
  MessageCircle, 
  Edit3, 
  ExternalLink,
  DollarSign,
  ArrowRight,
  Plus
} from 'lucide-react';
import { Client, Deal, DealActivity, PipelineStage, Task, TaskType, User } from '../types/crm';
import { STAGES } from '../services/storage';
import { formatCurrencyFull, formatDateBR, formatDateTimeBR, cleanPhoneForWhatsApp } from '../utils/formatters';

interface DealDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  deal: Deal | null;
  client: Client | null;
  tasks: Task[];
  activities: DealActivity[];
  currentUser: User;
  onUpdateStage: (dealId: string, newStage: PipelineStage, lostReason?: string) => void;
  onOpenPhoneUpdate: (clientId: string, clientName: string, currentPhone: string) => void;
  onToggleTask: (taskId: string) => void;
  onAddTask: (taskData: Omit<Task, 'id' | 'createdAt' | 'completed' | 'completedAt'>) => void;
  onAddNote: (content: string) => void;
}

export const DealDetailModal: React.FC<DealDetailModalProps> = ({
  isOpen,
  onClose,
  deal,
  client,
  tasks,
  activities,
  currentUser,
  onUpdateStage,
  onOpenPhoneUpdate,
  onToggleTask,
  onAddTask,
  onAddNote,
}) => {
  const [newNote, setNewNote] = useState('');
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskType, setTaskType] = useState<TaskType>('ligacao');
  const [taskDueDate, setTaskDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [taskDueTime, setTaskDueTime] = useState('14:00');
  const [taskDescription, setTaskDescription] = useState('');
  const [showLostDialog, setShowLostDialog] = useState(false);
  const [lostReasonInput, setLostReasonInput] = useState('');

  if (!isOpen || !deal) return null;

  const currentStageDef = STAGES.find((s) => s.id === deal.stage);
  const dealTasks = tasks.filter((t) => t.dealId === deal.id || (client && t.clientId === client.id));

  const handleNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    onAddNote(newNote.trim());
    setNewNote('');
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim() || !client) return;
    onAddTask({
      dealId: deal.id,
      clientId: client.id,
      clientName: client.tradeName || client.corporateName,
      clientPhone: client.phone,
      sellerId: currentUser.id,
      sellerName: currentUser.name,
      title: taskTitle.trim(),
      description: taskDescription.trim() || undefined,
      dueDate: taskDueDate,
      dueTime: taskDueTime || undefined,
      type: taskType,
    });
    setTaskTitle('');
    setTaskDescription('');
    setShowTaskForm(false);
  };

  const confirmLost = () => {
    onUpdateStage(deal.id, 'lost', lostReasonInput || 'Motivo não especificado');
    setShowLostDialog(false);
  };

  const waNumber = cleanPhoneForWhatsApp(client?.phone || deal.clientPhone);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-900/70 backdrop-blur-xs transition-opacity">
      <div 
        className="w-full max-w-4xl max-h-[92vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border-2 border-black/10 dark:border-slate-800 text-black dark:text-white flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-black dark:bg-slate-950 text-white border-b-2 border-blue-600 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-xl text-white">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">{deal.title}</h2>
                <span className="text-xs px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono">
                  {deal.clientName}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Responsável: <span className="text-slate-200 font-medium">{deal.sellerName}</span> · Criado em {formatDateBR(deal.createdAt)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stage Transition Selector Bar */}
        <div className="bg-slate-100 px-6 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-600">Etapa Atual:</span>
            <span className={`px-2.5 py-1 rounded font-semibold ${currentStageDef?.bgHeader} ${currentStageDef?.color} border border-slate-200`}>
              {currentStageDef?.title}
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-slate-500 mr-1">Mover para:</span>
            {STAGES.map((s) => {
              if (s.id === deal.stage) return null;
              if (s.id === 'lost') {
                return (
                  <button
                    key={s.id}
                    onClick={() => setShowLostDialog(true)}
                    className="px-2.5 py-1 rounded-md text-xs font-medium text-rose-700 hover:bg-rose-50 border border-rose-200 transition-colors"
                  >
                    Perdido
                  </button>
                );
              }
              return (
                <button
                  key={s.id}
                  onClick={() => onUpdateStage(deal.id, s.id)}
                  className="px-2.5 py-1 rounded-md text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 transition-colors"
                >
                  {s.title.split('/')[0]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Modal Body: Two Columns */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Deal & Client Info */}
          <div className="lg:col-span-1 space-y-5">
            {/* Financial Summary */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">
                Valor da Oportunidade
              </span>
              <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
                {formatCurrencyFull(deal.value)}
              </div>
              <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
                <span>Probabilidade: <strong className="font-mono">{deal.probability}%</strong></span>
                <span>Previsão: <strong className="font-mono">{formatDateBR(deal.expectedCloseDate)}</strong></span>
              </div>
            </div>

            {/* Client Info Card */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-slate-500" />
                  Dados do Cliente
                </h4>
                {client?.statusCadastral && (
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {client.statusCadastral}
                  </span>
                )}
              </div>

              <div>
                <span className="text-xs text-slate-400 block">Razão Social</span>
                <span className="text-sm font-semibold text-slate-800">{client?.corporateName || deal.clientName}</span>
              </div>

              {client?.tradeName && client.tradeName !== client.corporateName && (
                <div>
                  <span className="text-xs text-slate-400 block">Nome Fantasia</span>
                  <span className="text-xs font-medium text-slate-700">{client.tradeName}</span>
                </div>
              )}

              <div>
                <span className="text-xs text-slate-400 block">CNPJ</span>
                <span className="text-xs font-mono font-medium text-slate-800">{client?.cnpj || deal.clientCnpj}</span>
              </div>

              {/* TELEFONE COM ATUALIZAÇÃO RÁPIDA (REQUISITO FUNDAMENTAL) */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    Telefone de Contato
                  </span>
                  <button
                    onClick={() => onOpenPhoneUpdate(
                      client?.id || deal.clientId, 
                      client?.tradeName || deal.clientName, 
                      client?.phone || deal.clientPhone
                    )}
                    className="text-xs font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3" />
                    Atualizar
                  </button>
                </div>
                <div className="text-sm font-mono font-bold text-slate-900">
                  {client?.phone || deal.clientPhone || 'Não informado'}
                </div>

                {/* Direct Action Links */}
                {(client?.phone || deal.clientPhone) && (
                  <div className="flex items-center gap-2 pt-1">
                    <a
                      href={`https://wa.me/${waNumber}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      WhatsApp
                    </a>
                    <a
                      href={`tel:${(client?.phone || deal.clientPhone).replace(/\D/g, '')}`}
                      className="py-1.5 px-3 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded text-xs font-semibold flex items-center justify-center transition-colors"
                    >
                      Ligar
                    </a>
                  </div>
                )}
              </div>

              {client?.email && (
                <div>
                  <span className="text-xs text-slate-400 block">E-mail</span>
                  <a href={`mailto:${client.email}`} className="text-xs font-medium text-blue-600 hover:underline">
                    {client.email}
                  </a>
                </div>
              )}

              {client?.city && (
                <div>
                  <span className="text-xs text-slate-400 block">Endereço</span>
                  <p className="text-xs text-slate-700 flex items-start gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>
                      {client.street} {client.number} {client.complement ? `(${client.complement})` : ''} - {client.neighborhood}, {client.city}/{client.state}
                    </span>
                  </p>
                </div>
              )}

              {client?.cnae && (
                <div>
                  <span className="text-xs text-slate-400 block">Atividade Principal (CNAE)</span>
                  <p className="text-xs text-slate-600 line-clamp-2">{client.cnae}</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Tasks & Timeline Activity */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tasks Section */}
            <div className="bg-white p-5 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-600" />
                  <h4 className="text-sm font-bold text-slate-900">
                    Tarefas e Próximos Passos ({dealTasks.length})
                  </h4>
                </div>
                <button
                  onClick={() => setShowTaskForm(!showTaskForm)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {showTaskForm ? 'Cancelar' : 'Nova Tarefa'}
                </button>
              </div>

              {/* Task Creation Form */}
              {showTaskForm && (
                <form onSubmit={handleCreateTask} className="mb-4 p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                  <div className="font-semibold text-xs text-slate-800">Adicionar Tarefa Comercial</div>
                  <div>
                    <input
                      type="text"
                      placeholder="Título da tarefa (ex: Enviar minuta contratual)"
                      value={taskTitle}
                      onChange={(e) => setTaskTitle(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[11px] text-slate-500 block mb-1">Tipo</label>
                      <select
                        value={taskType}
                        onChange={(e) => setTaskType(e.target.value as TaskType)}
                        className="w-full px-2 py-1.5 text-xs bg-white border border-slate-300 rounded-md"
                      >
                        <option value="ligacao">Ligação</option>
                        <option value="whatsapp">WhatsApp</option>
                        <option value="reuniao">Reunião</option>
                        <option value="proposta">Proposta</option>
                        <option value="email">E-mail</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-500 block mb-1">Data</label>
                      <input
                        type="date"
                        value={taskDueDate}
                        onChange={(e) => setTaskDueDate(e.target.value)}
                        className="w-full px-2 py-1.5 text-xs bg-white border border-slate-300 rounded-md font-mono"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-500 block mb-1">Horário</label>
                      <input
                        type="time"
                        value={taskDueTime}
                        onChange={(e) => setTaskDueTime(e.target.value)}
                        className="w-full px-2 py-1.5 text-xs bg-white border border-slate-300 rounded-md font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Detalhes ou observações (opcional)"
                      value={taskDescription}
                      onChange={(e) => setTaskDescription(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowTaskForm(false)}
                      className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-md"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1.5 text-xs font-semibold bg-slate-900 text-white rounded-md hover:bg-slate-800"
                    >
                      Salvar Tarefa
                    </button>
                  </div>
                </form>
              )}

              {/* Tasks List */}
              {dealTasks.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                  Nenhuma tarefa agendada para este negócio.
                </div>
              ) : (
                <div className="space-y-2">
                  {dealTasks.map((t) => (
                    <div
                      key={t.id}
                      className={`p-3 rounded-lg border flex items-start justify-between gap-3 transition-colors ${
                        t.completed ? 'bg-slate-50 border-slate-200 opacity-60' : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <input
                          type="checkbox"
                          checked={t.completed}
                          onChange={() => onToggleTask(t.id)}
                          className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                        />
                        <div>
                          <div className={`text-xs font-semibold ${t.completed ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                            {t.title}
                          </div>
                          {t.description && (
                            <p className="text-xs text-slate-500 mt-0.5">{t.description}</p>
                          )}
                          <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1 font-mono">
                            <span className="capitalize">{t.type}</span>
                            <span>·</span>
                            <span>Prazo: {formatDateBR(t.dueDate)} {t.dueTime || ''}</span>
                            {t.completed && (
                              <>
                                <span>·</span>
                                <span className="text-emerald-600 font-sans font-medium">Concluída</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Activity History & Notes */}
            <div className="bg-white p-5 rounded-xl border border-slate-200">
              <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-600" />
                Histórico & Linha do Tempo
              </h4>

              {/* Add Note Input */}
              <form onSubmit={handleNoteSubmit} className="flex gap-2 mb-4">
                <input
                  type="text"
                  placeholder="Registrar anotação rápida sobre a reunião ou negociação..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 text-slate-800"
                />
                <button
                  type="submit"
                  disabled={!newNote.trim()}
                  className="px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-lg transition-colors flex items-center gap-1"
                >
                  <Send className="w-3.5 h-3.5" />
                  Salvar
                </button>
              </form>

              {/* Activity Timeline List */}
              <div className="space-y-3 divide-y divide-slate-100 max-h-64 overflow-y-auto pr-1">
                {activities.length === 0 ? (
                  <div className="text-center py-4 text-xs text-slate-400">
                    Nenhuma atividade registrada ainda.
                  </div>
                ) : (
                  activities.map((act) => (
                    <div key={act.id} className="pt-3 first:pt-0 text-xs">
                      <div className="flex items-center justify-between text-slate-400 mb-1">
                        <span className="font-semibold text-slate-700">{act.sellerName}</span>
                        <span className="font-mono text-[11px]">{formatDateTimeBR(act.createdAt)}</span>
                      </div>
                      <p className="text-slate-700">{act.content}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500">
            ID do Negócio: <span className="font-mono">{deal.id}</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors"
          >
            Fechar
          </button>
        </div>

        {/* Dialog for Marking as Lost with reason */}
        {showLostDialog && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/70">
            <div className="w-full max-w-sm bg-white rounded-xl p-5 shadow-2xl space-y-4">
              <h3 className="text-sm font-bold text-slate-900">Marcar Negócio como Perdido</h3>
              <p className="text-xs text-slate-600">
                Informe o motivo da perda para registrar no relatório de desempenho e auditoria:
              </p>
              <textarea
                value={lostReasonInput}
                onChange={(e) => setLostReasonInput(e.target.value)}
                placeholder="Ex: Preço acima do orçamento, optou por concorrente, sem resposta..."
                className="w-full h-24 p-2.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowLostDialog(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-md"
                >
                  Voltar
                </button>
                <button
                  onClick={confirmLost}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-md"
                >
                  Confirmar Perda
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
