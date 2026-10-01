import React, { useState } from 'react';
import { 
  BarChart3, 
  Users, 
  UserPlus, 
  Building2, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  TrendingUp, 
  DollarSign, 
  Target, 
  Kanban, 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  ArrowUpRight,
  ShieldCheck,
  RefreshCw,
  PlusCircle,
  FileCheck,
  MessageCircle,
  Edit3
} from 'lucide-react';
import { Client, Deal, DealActivity, HomologationStatus, PipelineStage, PotentialClient, Task, User } from '../types/crm';
import { KanbanBoard } from './KanbanBoard';
import { GoogleMapsProspector } from './GoogleMapsProspector';
import { fetchCompanyByCNPJ, formatCNPJ, formatPhone, cleanDigits } from '../services/brasilApi';
import { STAGES } from '../services/storage';
import { 
  formatCurrencyBRL, 
  formatCurrencyFull, 
  formatDateBR, 
  formatDateTimeBR, 
  getInitials,
  cleanPhoneForWhatsApp
} from '../utils/formatters';

interface ManagerDashboardProps {
  currentUser: User;
  users: User[];
  deals: Deal[];
  tasks: Task[];
  clients: Client[];
  activities: DealActivity[];
  onSaveSeller: (seller: User) => void;
  onSaveClientAndDeal: (client: Client, deal?: Deal, initialTask?: Task) => void;
  onUpdateStage: (dealId: string, newStage: PipelineStage) => void;
  onOpenDealDetail: (deal: Deal) => void;
  onOpenPhoneUpdate: (clientId: string, clientName: string, currentPhone: string) => void;
  onOpenHomologation: (potentialClient: PotentialClient) => void;
}

export const ManagerDashboard: React.FC<ManagerDashboardProps> = ({
  currentUser,
  users,
  deals,
  tasks,
  clients,
  activities,
  onSaveSeller,
  onSaveClientAndDeal,
  onUpdateStage,
  onOpenDealDetail,
  onOpenPhoneUpdate,
  onOpenHomologation,
}) => {
  const [activeTab, setActiveTab] = useState<
    'kanban' | 'cadastro_vendedor' | 'homologacao' | 'cadastro_cliente' | 'clientes_cadastrados' | 'dashboard'
  >('kanban');
  const [clientEntryMode, setClientEntryMode] = useState<'maps_cnae' | 'cnpj' | 'lista'>('maps_cnae');

  // BrasilAPI Client Form State
  const [cnpjInput, setCnpjInput] = useState('');
  const [isSearchingCNPJ, setIsSearchingCNPJ] = useState(false);
  const [cnpjError, setCnpjError] = useState<string | null>(null);
  const [cnpjSuccess, setCnpjSuccess] = useState<string | null>(null);

  const [corporateName, setCorporateName] = useState('');
  const [tradeName, setTradeName] = useState('');
  const [contactName, setContactName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientCnae, setClientCnae] = useState('');
  const [clientStatusCadastral, setClientStatusCadastral] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [complement, setComplement] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [assignedSellerId, setAssignedSellerId] = useState(users.find((u) => u.role === 'vendedor')?.id || '');
  const [clientNotes, setClientNotes] = useState('');

  // Initial Deal associated with client registration
  const [createDealTogether, setCreateDealTogether] = useState(true);
  const [dealTitle, setDealTitle] = useState('');
  const [dealValue, setDealValue] = useState<number>(30000);
  const [dealStage, setDealStage] = useState<PipelineStage>('lead');
  const [dealCloseDate, setDealCloseDate] = useState('2026-04-30');
  const [dealPriority, setDealPriority] = useState<'baixa' | 'media' | 'alta'>('alta');
  const [initialTaskTitle, setInitialTaskTitle] = useState('Primeiro contato telefônico com tomador de decisão');
  const [clientCreatedSuccess, setClientCreatedSuccess] = useState(false);

  // Seller Form State
  const [sellerName, setSellerName] = useState('');
  const [sellerEmail, setSellerEmail] = useState('');
  const [sellerPassword, setSellerPassword] = useState('123456');
  const [sellerPhone, setSellerPhone] = useState('');
  const [sellerTarget, setSellerTarget] = useState<number>(50000);
  const [sellerCreatedSuccess, setSellerCreatedSuccess] = useState(false);

  // Consult BrasilAPI handler
  const handleConsultCNPJ = async () => {
    setCnpjError(null);
    setCnpjSuccess(null);
    const digits = cleanDigits(cnpjInput);
    if (digits.length !== 14) {
      setCnpjError('O CNPJ deve conter exatamente 14 dígitos numéricos.');
      return;
    }

    setIsSearchingCNPJ(true);
    const result = await fetchCompanyByCNPJ(digits);
    setIsSearchingCNPJ(false);

    if (!result.success || !result.data) {
      setCnpjError(result.error || 'Não foi possível obter dados para este CNPJ.');
      return;
    }

    const { data } = result;
    setCorporateName(data.corporateName);
    setTradeName(data.tradeName);
    setClientPhone(data.phone);
    setClientEmail(data.email);
    setClientCnae(data.cnae);
    setClientStatusCadastral(data.statusCadastral);
    setStreet(data.street);
    setNumber(data.number);
    setComplement(data.complement);
    setNeighborhood(data.neighborhood);
    setCity(data.city);
    setState(data.state);
    setZipCode(data.zipCode);

    if (!dealTitle) {
      setDealTitle(`Oportunidade Comercial - ${data.tradeName || data.corporateName}`);
    }

    setCnpjSuccess(`Dados de "${data.corporateName}" carregados com sucesso da BrasilAPI!`);
  };

  const handleSaveClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!corporateName.trim()) {
      setCnpjError('Por favor, informe ao menos a Razão Social da empresa.');
      return;
    }

    const newClientId = `cli_${Date.now()}`;
    const newClient: Client = {
      id: newClientId,
      cnpj: cnpjInput || '00.000.000/0000-00',
      corporateName: corporateName.trim(),
      tradeName: tradeName.trim() || corporateName.trim(),
      contactName: contactName.trim() || 'Responsável',
      phone: clientPhone.trim(),
      email: clientEmail.trim(),
      cnae: clientCnae.trim() || undefined,
      statusCadastral: clientStatusCadastral || 'ATIVA',
      street: street.trim(),
      number: number.trim(),
      complement: complement.trim() || undefined,
      neighborhood: neighborhood.trim(),
      city: city.trim(),
      state: state.trim(),
      zipCode: zipCode.trim(),
      assignedSellerId: assignedSellerId || currentUser.id,
      notes: clientNotes.trim() || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    let newDeal: Deal | undefined;
    let initialTask: Task | undefined;

    const assignedSeller = users.find((u) => u.id === (assignedSellerId || currentUser.id));

    if (createDealTogether) {
      const dealId = `deal_${Date.now()}`;
      newDeal = {
        id: dealId,
        title: dealTitle.trim() || `Negociação - ${newClient.tradeName}`,
        clientId: newClientId,
        clientName: newClient.tradeName,
        clientPhone: newClient.phone,
        clientCnpj: newClient.cnpj,
        clientCity: newClient.city,
        clientState: newClient.state,
        sellerId: assignedSeller?.id || currentUser.id,
        sellerName: assignedSeller?.name || currentUser.name,
        stage: dealStage,
        value: Number(dealValue) || 10000,
        priority: dealPriority,
        probability: dealStage === 'won' ? 100 : dealStage === 'lead' ? 25 : 50,
        expectedCloseDate: dealCloseDate,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        nextTaskDate: new Date().toISOString().split('T')[0],
        nextTaskTitle: initialTaskTitle || 'Primeiro contato comercial',
      };

      if (initialTaskTitle) {
        initialTask = {
          id: `tsk_${Date.now()}`,
          dealId,
          clientId: newClientId,
          clientName: newClient.tradeName,
          clientPhone: newClient.phone,
          sellerId: assignedSeller?.id || currentUser.id,
          sellerName: assignedSeller?.name || currentUser.name,
          title: initialTaskTitle,
          dueDate: new Date().toISOString().split('T')[0],
          dueTime: '10:00',
          type: 'ligacao',
          completed: false,
          createdAt: new Date().toISOString(),
        };
      }
    }

    onSaveClientAndDeal(newClient, newDeal, initialTask);
    setClientCreatedSuccess(true);

    // Reset fields
    setTimeout(() => {
      setCnpjInput('');
      setCorporateName('');
      setTradeName('');
      setContactName('');
      setClientPhone('');
      setClientEmail('');
      setClientCnae('');
      setStreet('');
      setNumber('');
      setNeighborhood('');
      setCity('');
      setState('');
      setZipCode('');
      setDealTitle('');
      setCnpjSuccess(null);
      setClientCreatedSuccess(false);
    }, 2000);
  };

  const handleSaveSeller = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sellerName.trim() || !sellerEmail.trim()) return;

    const newSeller: User = {
      id: `usr_vend_${Date.now()}`,
      name: sellerName.trim(),
      email: sellerEmail.trim(),
      password: sellerPassword.trim() || '123456',
      phone: sellerPhone.trim() || '(11) 99999-9999',
      role: 'vendedor',
      targetSales: Number(sellerTarget) || 40000,
      active: true,
      createdAt: new Date().toISOString(),
    };

    onSaveSeller(newSeller);
    setSellerCreatedSuccess(true);
    setSellerName('');
    setSellerEmail('');
    setSellerPassword('123456');
    setSellerPhone('');
    setSellerTarget(50000);

    setTimeout(() => {
      setSellerCreatedSuccess(false);
    }, 2500);
  };

  // Team Dashboard KPIs
  const activeSellers = users.filter((u) => u.role === 'vendedor' && u.active);
  const totalWonDeals = deals.filter((d) => d.stage === 'won');
  const totalLostDeals = deals.filter((d) => d.stage === 'lost');
  const activeDeals = deals.filter((d) => d.stage !== 'won' && d.stage !== 'lost');

  const totalWonValue = totalWonDeals.reduce((acc, d) => acc + d.value, 0);
  const totalPipelineValue = activeDeals.reduce((acc, d) => acc + d.value, 0);
  const closedCount = totalWonDeals.length + totalLostDeals.length;
  const winRate = closedCount > 0 ? Math.round((totalWonDeals.length / closedCount) * 100) : 0;
  const averageTicket = totalWonDeals.length > 0 ? Math.round(totalWonValue / totalWonDeals.length) : 0;
  const totalTeamTarget = activeSellers.reduce((acc, s) => acc + s.targetSales, 0);
  const overallTargetPercent = totalTeamTarget > 0 ? Math.round((totalWonValue / totalTeamTarget) * 100) : 0;

  return (
    <div className="flex flex-col lg:flex-row gap-5 items-start">
      {/* BARRA LATERAL ESQUERDA: FUNIL KANBAN, CADASTRO DE VENDEDORES, HOMOLOGAÇÃO & CLIENTES, DASHBOARD RESULTADOS */}
      <aside className="w-full lg:w-72 shrink-0 space-y-4 lg:sticky lg:top-4">
        {/* Card de Navegação Lateral */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-black/10 dark:border-slate-800 shadow-xs p-3 space-y-2">
          <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-black uppercase tracking-wider text-black dark:text-white flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Gestão Comercial
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Painel do Gestor
            </p>
          </div>

          <nav className="space-y-1.5">
            {/* 1. Funil Kanban (Abre por padrão) */}
            <button
              type="button"
              onClick={() => setActiveTab('kanban')}
              className={`w-full p-3 rounded-xl text-left transition-all flex items-start gap-3 cursor-pointer ${
                activeTab === 'kanban'
                  ? 'bg-black dark:bg-blue-600 text-white shadow-xs font-bold'
                  : 'text-black dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <div className={`p-2 rounded-lg shrink-0 ${
                activeTab === 'kanban'
                  ? 'bg-white/20 text-white'
                  : 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400'
              }`}>
                <Kanban className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold flex items-center justify-between">
                  <span>Funil Kanban</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                    activeTab === 'kanban'
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}>
                    {deals.length}
                  </span>
                </div>
                <p className={`text-[11px] line-clamp-1 mt-0.5 ${
                  activeTab === 'kanban' ? 'text-white/80' : 'text-slate-500 dark:text-slate-400'
                }`}>
                  Pipeline e negociações ativas
                </p>
              </div>
            </button>

            {/* 2. Cadastro de Vendedores */}
            <button
              type="button"
              onClick={() => setActiveTab('cadastro_vendedor')}
              className={`w-full p-3 rounded-xl text-left transition-all flex items-start gap-3 cursor-pointer ${
                activeTab === 'cadastro_vendedor'
                  ? 'bg-black dark:bg-blue-600 text-white shadow-xs font-bold'
                  : 'text-black dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <div className={`p-2 rounded-lg shrink-0 ${
                activeTab === 'cadastro_vendedor'
                  ? 'bg-white/20 text-white'
                  : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
              }`}>
                <UserPlus className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold flex items-center justify-between">
                  <span>Cadastro Vendedores</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                    activeTab === 'cadastro_vendedor'
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}>
                    {activeSellers.length}
                  </span>
                </div>
                <p className={`text-[11px] line-clamp-1 mt-0.5 ${
                  activeTab === 'cadastro_vendedor' ? 'text-white/80' : 'text-slate-500 dark:text-slate-400'
                }`}>
                  Equipe e metas comerciais
                </p>
              </div>
            </button>

            {/* 3. Homologação */}
            <button
              type="button"
              onClick={() => setActiveTab('homologacao')}
              className={`w-full p-3 rounded-xl text-left transition-all flex items-start gap-3 cursor-pointer ${
                activeTab === 'homologacao'
                  ? 'bg-black dark:bg-blue-600 text-white shadow-xs font-bold'
                  : 'text-black dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <div className={`p-2 rounded-lg shrink-0 ${
                activeTab === 'homologacao'
                  ? 'bg-white/20 text-white'
                  : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
              }`}>
                <MapPin className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold flex items-center justify-between">
                  <span>Homologação</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                    activeTab === 'homologacao'
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}>
                    Maps
                  </span>
                </div>
                <p className={`text-[11px] line-clamp-1 mt-0.5 ${
                  activeTab === 'homologacao' ? 'text-white/80' : 'text-slate-500 dark:text-slate-400'
                }`}>
                  Radar Google Maps & CNAE
                </p>
              </div>
            </button>

            {/* 4. Cadastro de Clientes */}
            <button
              type="button"
              onClick={() => setActiveTab('cadastro_cliente')}
              className={`w-full p-3 rounded-xl text-left transition-all flex items-start gap-3 cursor-pointer ${
                activeTab === 'cadastro_cliente'
                  ? 'bg-black dark:bg-blue-600 text-white shadow-xs font-bold'
                  : 'text-black dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <div className={`p-2 rounded-lg shrink-0 ${
                activeTab === 'cadastro_cliente'
                  ? 'bg-white/20 text-white'
                  : 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400'
              }`}>
                <PlusCircle className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold flex items-center justify-between">
                  <span>Cadastro de Clientes</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                    activeTab === 'cadastro_cliente'
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}>
                    CNPJ
                  </span>
                </div>
                <p className={`text-[11px] line-clamp-1 mt-0.5 ${
                  activeTab === 'cadastro_cliente' ? 'text-white/80' : 'text-slate-500 dark:text-slate-400'
                }`}>
                  BrasilAPI via CNPJ
                </p>
              </div>
            </button>

            {/* 5. Clientes Cadastrados (Totalmente separado da Homologação) */}
            <button
              type="button"
              onClick={() => setActiveTab('clientes_cadastrados')}
              className={`w-full p-3 rounded-xl text-left transition-all flex items-start gap-3 cursor-pointer ${
                activeTab === 'clientes_cadastrados'
                  ? 'bg-black dark:bg-blue-600 text-white shadow-xs font-bold'
                  : 'text-black dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <div className={`p-2 rounded-lg shrink-0 ${
                activeTab === 'clientes_cadastrados'
                  ? 'bg-white/20 text-white'
                  : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400'
              }`}>
                <Building2 className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold flex items-center justify-between">
                  <span>Clientes Cadastrados</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ${
                    activeTab === 'clientes_cadastrados'
                      ? 'bg-white text-black'
                      : 'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300'
                  }`}>
                    {clients.length}
                  </span>
                </div>
                <p className={`text-[11px] line-clamp-1 mt-0.5 ${
                  activeTab === 'clientes_cadastrados' ? 'text-white/80' : 'text-slate-500 dark:text-slate-400'
                }`}>
                  Carteira completa e status
                </p>
              </div>
            </button>

            {/* 6. Dashboard Resultados */}
            <button
              type="button"
              onClick={() => setActiveTab('dashboard')}
              className={`w-full p-3 rounded-xl text-left transition-all flex items-start gap-3 cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-black dark:bg-blue-600 text-white shadow-xs font-bold'
                  : 'text-black dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <div className={`p-2 rounded-lg shrink-0 ${
                activeTab === 'dashboard'
                  ? 'bg-white/20 text-white'
                  : 'bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400'
              }`}>
                <BarChart3 className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold flex items-center justify-between">
                  <span>Dashboard Resultados</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                    activeTab === 'dashboard'
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}>
                    {winRate}%
                  </span>
                </div>
                <p className={`text-[11px] line-clamp-1 mt-0.5 ${
                  activeTab === 'dashboard' ? 'text-white/80' : 'text-slate-500 dark:text-slate-400'
                }`}>
                  Desempenho e metas da equipe
                </p>
              </div>
            </button>
          </nav>
        </div>

        {/* Metric Summary Card in Left Sidebar */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-black/10 dark:border-slate-800 shadow-xs p-4 space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Resumo da Operação
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60">
              <span className="text-slate-600 dark:text-slate-400">Pipeline Ativo</span>
              <strong className="font-mono font-bold text-black dark:text-white">
                {formatCurrencyBRL(totalPipelineValue)}
              </strong>
            </div>
            <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-900/40">
              <span>Vendas Ganhas</span>
              <strong className="font-mono font-bold">
                {formatCurrencyBRL(totalWonValue)}
              </strong>
            </div>
            <div className="flex items-center justify-between p-2 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 text-blue-900 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/40">
              <span>Clientes na Base</span>
              <strong className="font-mono font-bold">
                {clients.length}
              </strong>
            </div>
          </div>
        </div>
      </aside>

      {/* ÁREA PRINCIPAL À DIREITA: O sistema abre no Funil Kanban por padrão */}
      <main className="flex-1 min-w-0 w-full space-y-4">
        {/* 1. FUNIL KANBAN (Aberto por padrão) */}
        {activeTab === 'kanban' && (
          <KanbanBoard
            deals={deals}
            users={users}
            currentUser={currentUser}
            onUpdateStage={onUpdateStage}
            onOpenDealDetail={onOpenDealDetail}
            onOpenPhoneUpdate={onOpenPhoneUpdate}
          />
        )}

      {/* 2. CADASTRO DE VENDEDORES */}
      {activeTab === 'cadastro_vendedor' && (
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold tracking-tight">Cadastro de Novo Vendedor / Representante</h3>
                  <p className="text-xs text-slate-400">Adicione novos membros à equipe comercial com metas mensais</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSaveSeller} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nome Completo do Vendedor *</label>
                  <input
                    type="text"
                    placeholder="Ex: Gabriel Rezende Santos"
                    value={sellerName}
                    onChange={(e) => setSellerName(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">E-mail Comercial (Login) *</label>
                  <input
                    type="email"
                    placeholder="gabriel.rezende@fluxocrm.com.br"
                    value={sellerEmail}
                    onChange={(e) => setSellerEmail(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Telefone / WhatsApp Comercial</label>
                  <input
                    type="text"
                    placeholder="(11) 98888-7777"
                    value={sellerPhone}
                    onChange={(e) => setSellerPhone(formatPhone(e.target.value))}
                    className="w-full px-3 py-2 font-mono bg-white border border-slate-300 rounded-lg text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Senha de Acesso (Login) *</label>
                  <input
                    type="text"
                    placeholder="Defina uma senha (mínimo 4 caracteres)"
                    value={sellerPassword}
                    onChange={(e) => setSellerPassword(e.target.value)}
                    required
                    className="w-full px-3 py-2 font-mono bg-white border border-slate-300 rounded-lg text-slate-800"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Meta Mensal de Vendas (R$) *</label>
                  <input
                    type="number"
                    value={sellerTarget}
                    onChange={(e) => setSellerTarget(Number(e.target.value))}
                    step="1000"
                    required
                    className="w-full px-3 py-2 font-mono bg-white border border-slate-300 rounded-lg text-slate-800"
                  />
                </div>
              </div>

              {sellerCreatedSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Vendedor cadastrado com sucesso! O novo vendedor já tem acesso imediato ao sistema.</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  Concluir Cadastro do Vendedor
                </button>
              </div>
            </form>
          </div>

          {/* List of currently registered sellers */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
            <h4 className="text-sm font-bold text-slate-900">
              Equipe Comercial Cadastrada ({activeSellers.length})
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {users
                .filter((u) => u.role === 'vendedor')
                .map((seller) => (
                  <div key={seller.id} className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 space-y-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs">
                        {getInitials(seller.name)}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">{seller.name}</span>
                        <span className="text-[11px] text-slate-400 block truncate max-w-[170px]">{seller.email}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">Meta:</span>
                      <span className="font-mono font-bold text-slate-800">
                        {formatCurrencyBRL(seller.targetSales)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Telefone:</span>
                      <span className="font-mono text-slate-700">{seller.phone}</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. HOMOLOGAÇÃO & CLIENTES */}
      {activeTab === 'homologacao_clientes' && (
        <div className="space-y-4">
          {/* Sub-Header com Alternador Rápido */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-black/10 dark:border-slate-800 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setClientEntryMode('maps_cnae')}
                className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
                  clientEntryMode === 'maps_cnae'
                    ? 'bg-black dark:bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <MapPin className="w-4 h-4 text-emerald-500" />
                Homologação (Radar Maps)
              </button>

              <button
                type="button"
                onClick={() => setClientEntryMode('cnpj')}
                className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
                  clientEntryMode === 'cnpj'
                    ? 'bg-black dark:bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <PlusCircle className="w-4 h-4 text-blue-500" />
                Cadastro por CNPJ (BrasilAPI)
              </button>

              <button
                type="button"
                onClick={() => setClientEntryMode('lista')}
                className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
                  clientEntryMode === 'lista'
                    ? 'bg-black dark:bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Building2 className="w-4 h-4 text-indigo-500" />
                Clientes Cadastrados ({clients.length})
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 rounded-lg font-mono font-bold">
                {clients.filter((c) => c.homologationStatus === 'em_homologacao').length} em homologação
              </span>
              <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 rounded-lg font-mono font-bold">
                {clients.filter((c) => c.homologationStatus === 'aprovado').length} aprovados
              </span>
            </div>
          </div>

          {/* Sub-view 1: Radar Google Maps & Homologação CNAE */}
          {clientEntryMode === 'maps_cnae' && (
            <div className="space-y-4">
              <GoogleMapsProspector
                clients={clients}
                users={users}
                currentUser={currentUser}
                onOpenHomologation={onOpenHomologation}
              />
            </div>
          )}

          {/* Sub-view 2: Cadastro Direto por CNPJ (BrasilAPI) */}
          {clientEntryMode === 'cnpj' && (
            <div className="max-w-4xl mx-auto bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold tracking-tight">Cadastro de Novo Cliente Corporativo</h3>
                    <p className="text-xs text-slate-400">Preenchimento automático via BrasilAPI com o CNPJ da empresa</p>
                  </div>
                </div>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  Receita Federal BrasilAPI
                </span>
              </div>

              <form onSubmit={handleSaveClient} className="p-6 space-y-6">
                {/* Step 1: CNPJ Input with BrasilAPI Lookup */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                      1. Consulta de CNPJ na BrasilAPI
                    </label>
                    <span className="text-[11px] text-slate-500">Ex: 06.990.590/0001-23</span>
                  </div>

                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        placeholder="Digite o CNPJ (14 dígitos)"
                        value={cnpjInput}
                        onChange={(e) => setCnpjInput(formatCNPJ(e.target.value))}
                        maxLength={18}
                        className="w-full px-3.5 py-2.5 text-sm font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleConsultCNPJ}
                      disabled={isSearchingCNPJ}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
                    >
                      {isSearchingCNPJ ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Consultando...
                        </>
                      ) : (
                        <>
                          <Search className="w-4 h-4" />
                          Consultar BrasilAPI
                        </>
                      )}
                    </button>
                  </div>

                  {cnpjError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                      <span>{cnpjError}</span>
                    </div>
                  )}

                  {cnpjSuccess && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                      <span>{cnpjSuccess}</span>
                    </div>
                  )}
                </div>

                {/* Step 2: Auto-populated Company Information */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    2. Dados da Empresa e Contato
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Razão Social *</label>
                      <input
                        type="text"
                        placeholder="Nome empresarial oficial"
                        value={corporateName}
                        onChange={(e) => setCorporateName(e.target.value)}
                        required
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Nome Fantasia</label>
                      <input
                        type="text"
                        placeholder="Nome comercial da marca"
                        value={tradeName}
                        onChange={(e) => setTradeName(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Telefone Comercial com DDD *</label>
                      <input
                        type="text"
                        placeholder="(11) 99999-9999"
                        value={clientPhone}
                        onChange={(e) => setClientPhone(formatPhone(e.target.value))}
                        className="w-full px-3 py-2 font-mono bg-white border border-slate-300 rounded-lg text-slate-800"
                        required
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">E-mail Comercial</label>
                      <input
                        type="email"
                        placeholder="contato@empresa.com.br"
                        value={clientEmail}
                        onChange={(e) => setClientEmail(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Nome do Contato / Decisor</label>
                      <input
                        type="text"
                        placeholder="Ex: Carlos Eduardo (Diretor de Compras)"
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Vendedor Atribuído *</label>
                      <select
                        value={assignedSellerId}
                        onChange={(e) => setAssignedSellerId(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 font-medium"
                        required
                      >
                        {users
                          .filter((u) => u.role === 'vendedor')
                          .map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.name} (Meta: {formatCurrencyBRL(u.targetSales)})
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>

                  {/* Endereço */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs pt-1">
                    <div className="sm:col-span-2">
                      <label className="block font-semibold text-slate-700 mb-1">Logradouro / Rua</label>
                      <input
                        type="text"
                        placeholder="Av. Paulista"
                        value={street}
                        onChange={(e) => setStreet(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Número</label>
                      <input
                        type="text"
                        placeholder="1000"
                        value={number}
                        onChange={(e) => setNumber(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Bairro</label>
                      <input
                        type="text"
                        placeholder="Bela Vista"
                        value={neighborhood}
                        onChange={(e) => setNeighborhood(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block font-semibold text-slate-700 mb-1">Cidade</label>
                      <input
                        type="text"
                        placeholder="São Paulo"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">UF (Estado)</label>
                      <input
                        type="text"
                        placeholder="SP"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 font-mono"
                        maxLength={2}
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">CEP</label>
                      <input
                        type="text"
                        placeholder="01310-100"
                        value={zipCode}
                        onChange={(e) => setZipCode(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 font-mono"
                      />
                    </div>
                  </div>

                  {clientCnae && (
                    <div className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      <span className="font-semibold text-slate-700">CNAE Principal:</span> {clientCnae}
                    </div>
                  )}
                </div>

                {/* Step 3: Initial Pipeline Deal & Next Action */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      3. Inserir no Funil de Vendas (Kanban)
                    </h4>
                    <label className="flex items-center gap-1.5 text-xs text-slate-700 font-medium cursor-pointer">
                      <input
                        type="checkbox"
                        checked={createDealTogether}
                        onChange={(e) => setCreateDealTogether(e.target.checked)}
                        className="rounded text-slate-900 focus:ring-slate-900"
                      />
                      Criar oportunidade no Kanban agora
                    </label>
                  </div>

                  {createDealTogether && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div className="sm:col-span-2">
                        <label className="block font-semibold text-slate-700 mb-1">Título da Negociação</label>
                        <input
                          type="text"
                          placeholder="Ex: Fornecimento Anual de Software"
                          value={dealTitle}
                          onChange={(e) => setDealTitle(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800"
                          required
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Valor Estimado (R$)</label>
                        <input
                          type="number"
                          value={dealValue}
                          onChange={(e) => setDealValue(Number(e.target.value))}
                          className="w-full px-3 py-2 font-mono bg-white border border-slate-300 rounded-lg text-slate-800"
                          required
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Etapa Inicial do Funil</label>
                        <select
                          value={dealStage}
                          onChange={(e) => setDealStage(e.target.value as PipelineStage)}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800"
                        >
                          {STAGES.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.title}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Previsão de Fechamento</label>
                        <input
                          type="date"
                          value={dealCloseDate}
                          onChange={(e) => setDealCloseDate(e.target.value)}
                          className="w-full px-3 py-2 font-mono bg-white border border-slate-300 rounded-lg text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Prioridade</label>
                        <select
                          value={dealPriority}
                          onChange={(e) => setDealPriority(e.target.value as 'baixa' | 'media' | 'alta')}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800"
                        >
                          <option value="alta">Alta</option>
                          <option value="media">Média</option>
                          <option value="baixa">Baixa</option>
                        </select>
                      </div>
                      <div className="sm:col-span-3">
                        <label className="block font-semibold text-slate-700 mb-1">
                          Primeira Tarefa Comercial para o Vendedor
                        </label>
                        <input
                          type="text"
                          value={initialTaskTitle}
                          onChange={(e) => setInitialTaskTitle(e.target.value)}
                          placeholder="Ex: Ligar para validar requisitos da proposta"
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {clientCreatedSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>Cliente e Oportunidade cadastrados com sucesso no funil de vendas!</span>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setClientEntryMode('maps_cnae')}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                  >
                    Voltar para o Radar
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <FileCheck className="w-4 h-4" />
                    Salvar Cadastro do Cliente
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Sub-view 3: Base de Clientes Cadastrados & Status de Homologação */}
          {clientEntryMode === 'lista' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Base de Clientes & Status de Homologação</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Empresas homologadas via CNAE ou cadastradas com auxílio da BrasilAPI</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setClientEntryMode('maps_cnae')}
                    className="px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer border border-emerald-200"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    Homologar no Maps
                  </button>
                  <button
                    type="button"
                    onClick={() => setClientEntryMode('cnpj')}
                    className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer border border-blue-200"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    Novo Cadastro (CNPJ)
                  </button>
                </div>
              </div>

              {clients.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs space-y-2">
                  <Building2 className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="font-semibold text-slate-700">Nenhum cliente cadastrado ainda.</p>
                  <p>Utilize o <strong>Radar Google Maps</strong> para prospectar por CNAE ou o <strong>Cadastro com CNPJ</strong> para inserir sua primeira empresa.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                        <th className="py-3 px-4">Empresa / Razão Social</th>
                        <th className="py-3 px-4">CNPJ & CNAE</th>
                        <th className="py-3 px-4">Localização</th>
                        <th className="py-3 px-4">Status de Homologação</th>
                        <th className="py-3 px-4">Vendedor Atribuído</th>
                        <th className="py-3 px-4">Telefone / Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {clients.map((client) => {
                        const seller = users.find((u) => u.id === client.assignedSellerId);
                        const status = client.homologationStatus || 'em_homologacao';

                        return (
                          <tr key={client.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-slate-900">{client.tradeName || client.corporateName}</div>
                              {client.tradeName && client.tradeName !== client.corporateName && (
                                <div className="text-[11px] text-slate-400 truncate max-w-xs">{client.corporateName}</div>
                              )}
                              {client.contactName && (
                                <div className="text-[11px] text-slate-500 mt-0.5">Contato: {client.contactName}</div>
                              )}
                            </td>
                            <td className="py-3.5 px-4 font-mono">
                              <div className="text-slate-800 font-medium">{client.cnpj}</div>
                              {client.cnae && (
                                <div className="text-[10px] text-slate-400 truncate max-w-[200px]" title={client.cnae}>
                                  CNAE: {client.cnae}
                                </div>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-slate-600">
                              {client.city ? `${client.city}/${client.state || ''}` : 'Não informado'}
                            </td>
                            <td className="py-3.5 px-4">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                                  status === 'aprovado'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : status === 'reprovado'
                                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                }`}
                              >
                                {status === 'aprovado' && 'Aprovado'}
                                {status === 'reprovado' && 'Reprovado'}
                                {status === 'em_homologacao' && 'Em Homologação'}
                                {status === 'pendente' && 'Pendente'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-slate-700">
                              {seller?.name || 'Não atribuído'}
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-slate-700">{client.phone}</span>
                                {client.phone && (
                                  <a
                                    href={`https://wa.me/${cleanPhoneForWhatsApp(client.phone)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1 rounded bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                                    title="Abrir WhatsApp"
                                  >
                                    <MessageCircle className="w-3.5 h-3.5" />
                                  </a>
                                )}
                                <button
                                  type="button"
                                  onClick={() => onOpenPhoneUpdate(client.id, client.tradeName || client.corporateName, client.phone)}
                                  className="p-1 rounded bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                                  title="Atualizar telefone"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 4. DASHBOARD DA EQUIPE E DOS RESULTADOS */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Pipeline */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-semibold uppercase tracking-wider">Pipeline Ativo</span>
                <DollarSign className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
                {formatCurrencyBRL(totalPipelineValue)}
              </div>
              <div className="text-xs text-slate-500 mt-2">
                <strong className="font-mono text-slate-800">{activeDeals.length}</strong> negociações em andamento
              </div>
            </div>

            {/* Total Won Revenue */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-semibold uppercase tracking-wider">Faturamento Fechado</span>
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-bold font-mono tabular-nums text-emerald-700">
                {formatCurrencyBRL(totalWonValue)}
              </div>
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-slate-500">Meta: {formatCurrencyBRL(totalTeamTarget)}</span>
                <span className="font-bold font-mono text-emerald-700">{overallTargetPercent}% atingido</span>
              </div>
            </div>

            {/* Win Rate */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-semibold uppercase tracking-wider">Taxa de Conversão</span>
                <Target className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-2xl font-bold font-mono tabular-nums text-indigo-700">
                {winRate}%
              </div>
              <div className="text-xs text-slate-500 mt-2">
                {totalWonDeals.length} ganhos vs {totalLostDeals.length} perdidos
              </div>
            </div>

            {/* Ticket Médio */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-semibold uppercase tracking-wider">Ticket Médio</span>
                <ShieldCheck className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
                {formatCurrencyBRL(averageTicket)}
              </div>
              <div className="text-xs text-slate-500 mt-2">
                Média por contrato fechado
              </div>
            </div>
          </div>

          {/* Team Performance Breakdown Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Desempenho Comercial por Vendedor</h3>
                <p className="text-xs text-slate-500 mt-0.5">Métricas de fechamento, meta mensal e atividades em tempo real</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('cadastro_vendedor')}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Novo Vendedor
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                    <th className="py-3 px-4">Vendedor</th>
                    <th className="py-3 px-4">Telefone / Contato</th>
                    <th className="py-3 px-4 text-right">Meta Mensal</th>
                    <th className="py-3 px-4 text-right">Vendas Ganhas</th>
                    <th className="py-3 px-4 text-center">% Atingimento</th>
                    <th className="py-3 px-4 text-center">Deals Ativos</th>
                    <th className="py-3 px-4 text-center">Tarefas Feitas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeSellers.map((seller) => {
                    const sDeals = deals.filter((d) => d.sellerId === seller.id);
                    const sWon = sDeals.filter((d) => d.stage === 'won');
                    const sWonSum = sWon.reduce((acc, d) => acc + d.value, 0);
                    const sActiveDeals = sDeals.filter((d) => d.stage !== 'won' && d.stage !== 'lost');
                    const sTasks = tasks.filter((t) => t.sellerId === seller.id);
                    const sCompletedTasks = sTasks.filter((t) => t.completed).length;
                    const percent = seller.targetSales > 0 ? Math.round((sWonSum / seller.targetSales) * 100) : 0;

                    return (
                      <tr key={seller.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-[11px]">
                              {getInitials(seller.name)}
                            </div>
                            <div>
                              <span className="font-semibold text-slate-900 block">{seller.name}</span>
                              <span className="text-[11px] text-slate-400">{seller.email}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-700">
                          {seller.phone}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-700">
                          {formatCurrencyBRL(seller.targetSales)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-700">
                          {formatCurrencyBRL(sWonSum)}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="max-w-[140px] mx-auto space-y-1">
                            <div className="flex justify-between text-[11px] font-mono">
                              <span className="text-slate-500">{percent}%</span>
                              <span className={percent >= 100 ? 'text-emerald-600 font-bold' : 'text-slate-600'}>
                                {percent >= 100 ? 'Meta Superada' : 'Em progresso'}
                              </span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-1.5 rounded-full ${percent >= 100 ? 'bg-emerald-500' : 'bg-indigo-600'}`}
                                style={{ width: `${Math.min(percent, 100)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono font-semibold text-slate-800">
                          {sActiveDeals.length}
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono text-slate-600">
                          {sCompletedTasks} / {sTasks.length}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Funnel Distribution Visual & Team Activity Stream */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Stages Distribution Card */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center justify-between">
                <span>Distribuição do Funil de Vendas</span>
                <span className="text-xs font-mono text-slate-500">{deals.length} oportunidades</span>
              </h3>

              <div className="space-y-3 pt-1">
                {STAGES.map((stg) => {
                  const stageDeals = deals.filter((d) => d.stage === stg.id);
                  const stageSum = stageDeals.reduce((acc, d) => acc + d.value, 0);
                  const percentOfTotal = deals.length > 0 ? Math.round((stageDeals.length / deals.length) * 100) : 0;

                  return (
                    <div key={stg.id} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-800">{stg.title}</span>
                        <div className="flex items-center gap-2 font-mono">
                          <span className="text-slate-400">({stageDeals.length})</span>
                          <span className="font-bold text-slate-900">{formatCurrencyBRL(stageSum)}</span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-2 rounded-full ${
                            stg.id === 'won' ? 'bg-emerald-500' :
                            stg.id === 'lost' ? 'bg-rose-400' :
                            stg.id === 'negotiation' ? 'bg-purple-600' :
                            stg.id === 'proposal' ? 'bg-amber-500' :
                            stg.id === 'qualification' ? 'bg-indigo-500' :
                            'bg-sky-500'
                          }`}
                          style={{ width: `${percentOfTotal}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Team Activity Feed */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center justify-between">
                <span>Atividades Recentes da Equipe</span>
                <Clock className="w-4 h-4 text-slate-400" />
              </h3>

              <div className="space-y-3 divide-y divide-slate-100 max-h-80 overflow-y-auto pr-1">
                {activities.slice(0, 8).map((act) => (
                  <div key={act.id} className="pt-3 first:pt-0 text-xs">
                    <div className="flex items-center justify-between text-slate-400 mb-0.5">
                      <span className="font-semibold text-slate-800">{act.sellerName}</span>
                      <span className="font-mono text-[11px]">{formatDateTimeBR(act.createdAt)}</span>
                    </div>
                    <p className="text-slate-600">{act.content}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      </main>
    </div>
  );
};
