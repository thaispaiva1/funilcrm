import React, { useState } from 'react';
import { 
  Building2, 
  CheckCircle2, 
  X, 
  Search, 
  RefreshCw, 
  AlertCircle, 
  DollarSign, 
  UserCheck, 
  MapPin, 
  Phone,
  FileCheck2,
  ShieldCheck
} from 'lucide-react';
import { Client, Deal, HomologationStatus, PipelineStage, PotentialClient, Task, User } from '../types/crm';
import { fetchCompanyByCNPJ, formatCNPJ, formatPhone, cleanDigits } from '../services/brasilApi';
import { formatCurrencyBRL } from '../utils/formatters';

interface HomologationModalProps {
  isOpen: boolean;
  onClose: () => void;
  potentialClient: PotentialClient | null;
  users: User[];
  currentUser: User;
  onConfirmHomologation: (client: Client, deal: Deal, initialTask?: Task) => void;
}

export const HomologationModal: React.FC<HomologationModalProps> = ({
  isOpen,
  onClose,
  potentialClient,
  users,
  currentUser,
  onConfirmHomologation,
}) => {
  const [cnpjInput, setCnpjInput] = useState('');
  const [isSearchingCNPJ, setIsSearchingCNPJ] = useState(false);
  const [cnpjError, setCnpjError] = useState<string | null>(null);
  const [cnpjSuccess, setCnpjSuccess] = useState<string | null>(null);

  const [companyName, setCompanyName] = useState(potentialClient?.name || '');
  const [tradeName, setTradeName] = useState(potentialClient?.name || '');
  const [phone, setPhone] = useState(potentialClient?.phone || '');
  const [email, setEmail] = useState('');
  const [cnae, setCnae] = useState(potentialClient?.cnaeDescription || potentialClient?.cnaeCode || '');
  const [statusCadastral, setStatusCadastral] = useState('ATIVA');
  const [address, setAddress] = useState(potentialClient?.formattedAddress || '');
  
  // Homologation specific fields
  const [homologationStatus, setHomologationStatus] = useState<HomologationStatus>('em_homologacao');
  const [homologationNotes, setHomologationNotes] = useState('Cliente em potencial identificado via Google Maps para análise e homologação cadastral.');
  const [assignedSellerId, setAssignedSellerId] = useState(users.find((u) => u.role === 'vendedor')?.id || currentUser.id);
  const [dealValue, setDealValue] = useState<number>(35000);
  const [dealStage, setDealStage] = useState<PipelineStage>('lead');

  React.useEffect(() => {
    if (potentialClient) {
      setCompanyName(potentialClient.name);
      setTradeName(potentialClient.name);
      setPhone(potentialClient.phone || '');
      setAddress(potentialClient.formattedAddress || '');
      setCnae(potentialClient.cnaeDescription ? `${potentialClient.cnaeCode} - ${potentialClient.cnaeDescription}` : '');
      setCnpjInput('');
      setCnpjError(null);
      setCnpjSuccess(null);
    }
  }, [potentialClient]);

  if (!isOpen || !potentialClient) return null;

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
      setCnpjError(result.error || 'Não foi possível encontrar a empresa pelo CNPJ informado.');
      return;
    }

    const { data } = result;
    setCompanyName(data.corporateName);
    setTradeName(data.tradeName || data.corporateName);
    if (data.phone) setPhone(data.phone);
    if (data.email) setEmail(data.email);
    if (data.cnae) setCnae(data.cnae);
    if (data.statusCadastral) setStatusCadastral(data.statusCadastral);
    if (data.street) {
      setAddress(`${data.street}, ${data.number || 'S/N'} - ${data.neighborhood}, ${data.city}/${data.state}`);
    }

    setCnpjSuccess(`Dados oficiais de "${data.corporateName}" sincronizados com a BrasilAPI!`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newClientId = `cli_${Date.now()}`;
    const assignedSeller = users.find((u) => u.id === assignedSellerId) || currentUser;

    // Parse address parts if possible
    const addressParts = address.split('-');
    const cityState = addressParts[addressParts.length - 1]?.trim().split('/') || ['São Paulo', 'SP'];
    const city = cityState[0]?.trim() || 'São Paulo';
    const state = cityState[1]?.trim() || 'SP';

    const newClient: Client = {
      id: newClientId,
      cnpj: cnpjInput || '00.000.000/0001-00',
      corporateName: companyName.trim() || potentialClient.name,
      tradeName: tradeName.trim() || companyName.trim() || potentialClient.name,
      contactName: 'Responsável Comercial',
      phone: phone.trim() || '(11) 99999-9999',
      email: email.trim() || 'contato@empresa.com.br',
      cnae: cnae.trim() || undefined,
      statusCadastral,
      street: addressParts[0]?.trim() || address,
      number: 'S/N',
      neighborhood: 'Comercial',
      city,
      state,
      zipCode: '01000-000',
      assignedSellerId: assignedSeller.id,
      notes: homologationNotes.trim(),
      homologationStatus,
      homologationNotes: homologationNotes.trim(),
      homologationDate: new Date().toISOString(),
      placeId: potentialClient.placeId,
      lat: potentialClient.location.lat,
      lng: potentialClient.location.lng,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const newDealId = `deal_${Date.now()}`;
    const newDeal: Deal = {
      id: newDealId,
      title: `Homologação Comercial - ${newClient.tradeName}`,
      clientId: newClientId,
      clientName: newClient.tradeName,
      clientPhone: newClient.phone,
      clientCnpj: newClient.cnpj,
      clientCity: newClient.city,
      clientState: newClient.state,
      sellerId: assignedSeller.id,
      sellerName: assignedSeller.name,
      stage: dealStage,
      value: Number(dealValue) || 30000,
      priority: 'alta',
      probability: dealStage === 'won' ? 100 : dealStage === 'qualification' ? 50 : 25,
      expectedCloseDate: '2026-04-30',
      notes: `Potencial cliente importado do Google Maps. Status de Homologação: ${homologationStatus.toUpperCase()}.`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      nextTaskDate: new Date().toISOString().split('T')[0],
      nextTaskTitle: 'Primeira ligação de qualificação e validação de homologação',
    };

    const initialTask: Task = {
      id: `tsk_${Date.now()}`,
      dealId: newDealId,
      clientId: newClientId,
      clientName: newClient.tradeName,
      clientPhone: newClient.phone,
      sellerId: assignedSeller.id,
      sellerName: assignedSeller.name,
      title: 'Validar documentos e requisitos para homologação da conta',
      dueDate: new Date().toISOString().split('T')[0],
      dueTime: '11:00',
      type: 'ligacao',
      completed: false,
      createdAt: new Date().toISOString(),
    };

    onConfirmHomologation(newClient, newDeal, initialTask);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
      <div 
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border-2 border-black/10 dark:border-slate-800 text-black dark:text-white overflow-hidden max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95"
        role="dialog"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-black dark:bg-slate-950 text-white border-b-2 border-blue-600 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-600 text-white rounded-lg">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Homologação de Potencial Cliente</h3>
              <p className="text-xs text-slate-300">Adicionar empresa mapeada via Google Maps ao funil de vendas</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          {/* Company identity card */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 flex items-start gap-3">
            <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider block">
                Empresa Selecionada no Google Maps
              </span>
              <span className="text-sm font-bold text-black dark:text-white block">{potentialClient.name}</span>
              <p className="text-slate-600 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                <span>{potentialClient.formattedAddress}</span>
              </p>
            </div>
          </div>

          {/* CNPJ Lookup via BrasilAPI */}
          <div className="p-3.5 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-indigo-950 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-indigo-600" />
                Vincular CNPJ Oficial (Opcional - Consulta BrasilAPI)
              </label>
              <span className="text-[10px] text-indigo-600">Autocompleta dados cadastrais</span>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Informe o CNPJ da empresa (14 dígitos)"
                value={cnpjInput}
                onChange={(e) => setCnpjInput(formatCNPJ(e.target.value))}
                maxLength={18}
                className="flex-1 px-3 py-2 bg-white border border-indigo-200 rounded-lg font-mono text-slate-900"
              />
              <button
                type="button"
                onClick={handleConsultCNPJ}
                disabled={isSearchingCNPJ || cleanDigits(cnpjInput).length !== 14}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {isSearchingCNPJ ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Search className="w-3.5 h-3.5" />
                )}
                Consultar
              </button>
            </div>

            {cnpjError && (
              <div className="text-[11px] text-rose-700 bg-rose-50 p-2 rounded-md border border-rose-100 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                <span>{cnpjError}</span>
              </div>
            )}

            {cnpjSuccess && (
              <div className="text-[11px] text-emerald-800 bg-emerald-50 p-2 rounded-md border border-emerald-100 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>{cnpjSuccess}</span>
              </div>
            )}
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Razão Social / Nome da Empresa *</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nome Fantasia</label>
              <input
                type="text"
                value={tradeName}
                onChange={(e) => setTradeName(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Telefone de Contato com DDD *</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(formatPhone(e.target.value))}
                placeholder="(11) 99999-9999"
                required
                className="w-full px-3 py-2 font-mono bg-white border border-slate-300 rounded-lg text-slate-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">E-mail Comercial</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contato@empresa.com.br"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">CNAE / Ramo de Atuação Vinculado</label>
              <input
                type="text"
                value={cnae}
                onChange={(e) => setCnae(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Status de Homologação *</label>
              <select
                value={homologationStatus}
                onChange={(e) => setHomologationStatus(e.target.value as HomologationStatus)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-medium"
              >
                <option value="em_homologacao">🟡 Em Homologação / Análise</option>
                <option value="aprovado">🟢 Homologado e Aprovado</option>
                <option value="reprovado">🔴 Reprovado</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Vendedor Responsável *</label>
              <select
                value={assignedSellerId}
                onChange={(e) => setAssignedSellerId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-medium"
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

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Valor Estimado do Negócio (R$)</label>
              <input
                type="number"
                value={dealValue}
                onChange={(e) => setDealValue(Number(e.target.value))}
                step="1000"
                className="w-full px-3 py-2 font-mono bg-white border border-slate-300 rounded-lg text-slate-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Etapa Inicial no Funil Kanban</label>
              <select
                value={dealStage}
                onChange={(e) => setDealStage(e.target.value as PipelineStage)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900"
              >
                <option value="lead">Lead / Prospecção</option>
                <option value="qualification">Qualificação</option>
                <option value="proposal">Apresentação / Proposta</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Observações de Homologação</label>
              <textarea
                value={homologationNotes}
                onChange={(e) => setHomologationNotes(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <FileCheck2 className="w-4 h-4 text-white" />
              Salvar Homologação e Criar Lead
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
