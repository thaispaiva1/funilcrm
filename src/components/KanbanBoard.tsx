import React, { useState } from 'react';
import { 
  Building2, 
  Phone, 
  Clock, 
  MessageCircle, 
  Edit3, 
  ArrowRight, 
  ArrowLeft,
  Search,
  Filter
} from 'lucide-react';
import { Deal, PipelineStage, User } from '../types/crm';
import { STAGES } from '../services/storage';
import { formatCurrencyBRL, cleanPhoneForWhatsApp, getInitials, getRelativeDateLabel } from '../utils/formatters';

interface KanbanBoardProps {
  deals: Deal[];
  users: User[];
  currentUser: User;
  onUpdateStage: (dealId: string, newStage: PipelineStage) => void;
  onOpenDealDetail: (deal: Deal) => void;
  onOpenPhoneUpdate: (clientId: string, clientName: string, currentPhone: string) => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  deals,
  users,
  currentUser,
  onUpdateStage,
  onOpenDealDetail,
  onOpenPhoneUpdate,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSellerFilter, setSelectedSellerFilter] = useState<string>('all');
  const [draggedDealId, setDraggedDealId] = useState<string | null>(null);

  // Filter deals based on search and selected seller
  const filteredDeals = deals.filter((deal) => {
    const matchesSearch = 
      deal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deal.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deal.clientCnpj.includes(searchTerm) ||
      deal.clientPhone.includes(searchTerm);

    const matchesSeller = 
      selectedSellerFilter === 'all' || deal.sellerId === selectedSellerFilter;

    return matchesSearch && matchesSeller;
  });

  const handleDragStart = (e: React.DragEvent, dealId: string) => {
    e.dataTransfer.setData('text/plain', dealId);
    setDraggedDealId(dealId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetStage: PipelineStage) => {
    e.preventDefault();
    const dealId = e.dataTransfer.getData('text/plain') || draggedDealId;
    if (dealId) {
      onUpdateStage(dealId, targetStage);
    }
    setDraggedDealId(null);
  };

  // Get index of stage
  const getStageIndex = (stageId: PipelineStage) => {
    return STAGES.findIndex((s) => s.id === stageId);
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Top Filter Bar: Azul e Preto */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border-2 border-black/10 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[260px]">
          <div className="relative w-full max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Buscar por cliente, título, CNPJ ou telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white dark:focus:bg-slate-900 transition-all text-black dark:text-white"
            />
          </div>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer"
            >
              Limpar
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 flex-wrap text-xs">
          <div className="flex items-center gap-1.5 text-black dark:text-slate-300 font-bold">
            <Filter className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Vendedor:</span>
          </div>
          <select
            value={selectedSellerFilter}
            onChange={(e) => setSelectedSellerFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-black dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="all">Todos os Vendedores ({deals.length})</option>
            {users
              .filter((u) => u.role === 'vendedor')
              .map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
          </select>

          <span className="text-slate-300 dark:text-slate-700">|</span>

          <span className="text-black dark:text-white font-mono font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-900/60">
            {filteredDeals.length} {filteredDeals.length === 1 ? 'negócio' : 'negócios'}
          </span>
        </div>
      </div>

      {deals.length === 0 && (
        <div className="p-4 bg-white dark:bg-slate-900 border-2 border-black/10 dark:border-slate-800 rounded-2xl text-xs text-black dark:text-slate-200 flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <Building2 className="w-5 h-5 shrink-0" />
            </div>
            <span>
              Nenhuma oportunidade no funil ainda. Adicione novos clientes através da <strong className="text-blue-600 dark:text-blue-400">Homologação CNAE (Google Maps)</strong> ou pelo <strong className="text-blue-600 dark:text-blue-400">Cadastro com CNPJ (BrasilAPI)</strong>.
            </span>
          </div>
        </div>
      )}

      {/* Kanban Columns Horizontal Scroll Area */}
      <div className="flex-1 overflow-x-auto pb-4 p-3 rounded-2xl bg-slate-100/80 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800/60">
        <div className="flex items-start gap-4 min-w-[1240px]">
          {STAGES.map((stage) => {
            const stageDeals = filteredDeals.filter((d) => d.stage === stage.id);
            const totalStageValue = stageDeals.reduce((acc, d) => acc + d.value, 0);
            const stageIdx = getStageIndex(stage.id);

            return (
              <div
                key={stage.id}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, stage.id)}
                className="w-80 shrink-0 bg-slate-200/70 dark:bg-slate-900/80 rounded-2xl border border-slate-300 dark:border-slate-800 flex flex-col max-h-[calc(100vh-210px)]"
              >
                {/* Column Header: Blue and Black Accent */}
                <div className={`p-4 rounded-t-2xl border-t-4 ${stage.borderAccent} bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-2xs`}>
                  <div className="flex items-center justify-between">
                    <h3 className={`text-xs font-black uppercase tracking-wider ${stage.color}`}>
                      {stage.title}
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-black text-white dark:bg-blue-600 dark:text-white font-mono shadow-2xs">
                      {stageDeals.length}
                    </span>
                  </div>

                  <div className="mt-1.5 flex items-baseline justify-between">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Total na etapa</span>
                    <span className="text-xs font-black font-mono tabular-nums text-blue-700 dark:text-blue-400">
                      {formatCurrencyBRL(totalStageValue)}
                    </span>
                  </div>
                </div>

                {/* Cards Container */}
                <div className="p-2.5 flex-1 overflow-y-auto space-y-2.5">
                  {stageDeals.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-600 border border-dashed border-slate-300 dark:border-slate-800 rounded-xl">
                      Nenhum negócio aqui
                    </div>
                  ) : (
                    stageDeals.map((deal) => {
                      const waNumber = cleanPhoneForWhatsApp(deal.clientPhone);
                      const relativeTask = deal.nextTaskDate ? getRelativeDateLabel(deal.nextTaskDate) : null;

                      return (
                        <div
                          key={deal.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, deal.id)}
                          className="bg-white dark:bg-slate-900 rounded-xl p-3.5 shadow-xs border-2 border-slate-200/80 dark:border-slate-800 hover:border-blue-600 dark:hover:border-blue-500 hover:shadow-md transition-all cursor-grab active:cursor-grabbing group relative"
                        >
                          {/* Top Row: Client Name & Priority */}
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <span 
                              onClick={() => onOpenDealDetail(deal)}
                              className="text-xs font-black text-black dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1 cursor-pointer"
                              title={deal.clientName}
                            >
                              {deal.clientName}
                            </span>
                            <span className="text-[10px] uppercase font-bold tracking-wider font-mono text-slate-500 dark:text-slate-400">
                              {deal.priority}
                            </span>
                          </div>

                          {/* Deal Title */}
                          <p 
                            onClick={() => onOpenDealDetail(deal)}
                            className="text-xs text-slate-600 dark:text-slate-400 mb-2 line-clamp-2 cursor-pointer font-medium"
                          >
                            {deal.title}
                          </p>

                          {/* Value & Probability: Azul e Preto */}
                          <div className="flex items-center justify-between pt-1 pb-2 border-b border-slate-100 dark:border-slate-800">
                            <span className="text-sm font-black font-mono tabular-nums text-black dark:text-white">
                              {formatCurrencyBRL(deal.value)}
                            </span>
                            <span className="text-[11px] font-mono font-bold text-blue-600 dark:text-blue-400">
                              {deal.probability}% prob.
                            </span>
                          </div>

                          {/* Client Phone Box with direct update action (Requirement: atualização do telefone pelo vendedor) */}
                          <div className="mt-2.5 p-2 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700/80 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1.5 truncate">
                              <Phone className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                              <span className="font-mono text-[11px] text-black dark:text-white font-bold truncate">
                                {deal.clientPhone || 'Sem telefone'}
                              </span>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              {/* Direct WhatsApp link */}
                              {deal.clientPhone && (
                                <a
                                  href={`https://wa.me/${waNumber}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title="Abrir WhatsApp"
                                  className="p-1 rounded text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <MessageCircle className="w-3.5 h-3.5" />
                                </a>
                              )}

                              {/* Update Phone Modal trigger button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onOpenPhoneUpdate(deal.clientId, deal.clientName, deal.clientPhone);
                                }}
                                title="Atualizar telefone do cliente"
                                className="p-1 rounded text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Next Task Notification (if available) */}
                          {deal.nextTaskTitle && relativeTask && (
                            <div className={`mt-2 flex items-center gap-1.5 text-[11px] rounded-lg px-2 py-1 ${
                              relativeTask.isOverdue ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-medium' :
                              relativeTask.isToday ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 font-medium' :
                              'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                            }`}>
                              <Clock className="w-3 h-3 shrink-0" />
                              <span className="truncate flex-1">{deal.nextTaskTitle}</span>
                              <span className="font-mono shrink-0">({relativeTask.label})</span>
                            </div>
                          )}

                          {/* Footer: Seller Avatar & Stage Navigation Arrows */}
                          <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1.5" title={`Vendedor: ${deal.sellerName}`}>
                              <div className="w-5 h-5 rounded-full bg-black text-white dark:bg-blue-600 flex items-center justify-center text-[10px] font-bold font-mono">
                                {getInitials(deal.sellerName)}
                              </div>
                              <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[90px] font-medium">
                                {deal.sellerName.split(' ')[0]}
                              </span>
                            </div>

                            {/* Easy Stage Move Arrows */}
                            <div className="flex items-center gap-1">
                              {stageIdx > 0 && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onUpdateStage(deal.id, STAGES[stageIdx - 1].id);
                                  }}
                                  title={`Retroceder para ${STAGES[stageIdx - 1].title}`}
                                  className="p-1 rounded text-slate-400 hover:text-black dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                >
                                  <ArrowLeft className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {stageIdx < STAGES.length - 1 && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onUpdateStage(deal.id, STAGES[stageIdx + 1].id);
                                  }}
                                  title={`Avançar para ${STAGES[stageIdx + 1].title}`}
                                  className="p-1 rounded text-slate-400 hover:text-black dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                >
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
