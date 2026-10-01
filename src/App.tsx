import React, { useState, useEffect } from 'react';
import { APIProvider } from '@vis.gl/react-google-maps';
import { StorageService } from './services/storage';
import { Client, Deal, DealActivity, PipelineStage, PotentialClient, Task, User } from './types/crm';
import { Navbar } from './components/Navbar';
import { LoginScreen } from './components/LoginScreen';
import { ManagerDashboard } from './components/ManagerDashboard';
import { SellerDashboard } from './components/SellerDashboard';
import { PhoneUpdateModal } from './components/PhoneUpdateModal';
import { DealDetailModal } from './components/DealDetailModal';
import { HomologationModal } from './components/HomologationModal';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyBQP8zHrlaEUiWmHHCKEu7EY50qdHvqX_4';

export default function App() {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activities, setActivities] = useState<DealActivity[]>([]);

  // Dark Mode State with LocalStorage Persistence
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('fluxocrm_theme');
      return stored === 'dark';
    } catch {
      return false;
    }
  });

  // Apply dark mode class to html element
  useEffect(() => {
    try {
      if (isDarkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      localStorage.setItem('fluxocrm_theme', isDarkMode ? 'dark' : 'light');
    } catch (err) {
      console.error('Error applying theme:', err);
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
  };

  // Demo key quota warning state
  const [isQuotaExceeded, setIsQuotaExceeded] = useState(false);

  // Modals state
  const [phoneModal, setPhoneModal] = useState<{
    isOpen: boolean;
    clientId: string;
    clientName: string;
    currentPhone: string;
  }>({
    isOpen: false,
    clientId: '',
    clientName: '',
    currentPhone: '',
  });

  const [selectedDealForDetail, setSelectedDealForDetail] = useState<Deal | null>(null);

  // Homologation modal state (Google Maps & CNAE prospect integration)
  const [homologationModal, setHomologationModal] = useState<{
    isOpen: boolean;
    potentialClient: PotentialClient | null;
  }>({
    isOpen: false,
    potentialClient: null,
  });

  // Listen to Google Maps Demo Key quota event
  useEffect(() => {
    const handleQuotaExceeded = () => {
      setIsQuotaExceeded(true);
    };
    window.addEventListener('gmp-quota-exceeded', handleQuotaExceeded);
    return () => {
      window.removeEventListener('gmp-quota-exceeded', handleQuotaExceeded);
    };
  }, []);

  // Initialize data on mount
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = () => {
    const loadedUsers = StorageService.getUsers();
    const currentId = StorageService.getCurrentUserId();
    const active = loadedUsers.find((u) => u.id === currentId) || null;

    setUsers(loadedUsers);
    setCurrentUser(active);
    setClients(StorageService.getClients());
    setDeals(StorageService.getDeals());
    setTasks(StorageService.getTasks());
    setActivities(StorageService.getActivities());
  };

  // Login handler
  const handleLogin = (user: User) => {
    StorageService.setCurrentUserId(user.id);
    setCurrentUser(user);
  };

  // Logout handler (Takes user back to the Login Screen)
  const handleLogout = () => {
    StorageService.setCurrentUserId('');
    setCurrentUser(null);
  };

  // Stage Update
  const handleUpdateStage = (dealId: string, newStage: PipelineStage, lostReason?: string) => {
    if (!currentUser) return;
    StorageService.updateDealStage(dealId, newStage, currentUser.id, currentUser.name, lostReason);
    setDeals(StorageService.getDeals());
    setActivities(StorageService.getActivities());

    if (selectedDealForDetail && selectedDealForDetail.id === dealId) {
      setSelectedDealForDetail(StorageService.getDealById(dealId) || null);
    }
  };

  // Phone Update (Vendedor atualiza telefone do cliente)
  const handleOpenPhoneUpdate = (clientId: string, clientName: string, currentPhone: string) => {
    setPhoneModal({
      isOpen: true,
      clientId,
      clientName,
      currentPhone,
    });
  };

  const handleSavePhone = (clientId: string, newPhone: string) => {
    if (!currentUser) return;
    StorageService.updateClientPhone(clientId, newPhone, currentUser.name);
    setClients(StorageService.getClients());
    setDeals(StorageService.getDeals());
    setTasks(StorageService.getTasks());
    setActivities(StorageService.getActivities());

    if (selectedDealForDetail && selectedDealForDetail.clientId === clientId) {
      const updatedDeal = StorageService.getDealById(selectedDealForDetail.id);
      if (updatedDeal) setSelectedDealForDetail(updatedDeal);
    }
  };

  // Task Handlers
  const handleToggleTask = (taskId: string) => {
    if (!currentUser) return;
    StorageService.toggleTaskCompletion(taskId, currentUser.name);
    setTasks(StorageService.getTasks());
    setActivities(StorageService.getActivities());
  };

  const handleAddTask = (taskData: Omit<Task, 'id' | 'createdAt' | 'completed' | 'completedAt'>) => {
    const newTask: Task = {
      ...taskData,
      id: `tsk_${Date.now()}`,
      completed: false,
      createdAt: new Date().toISOString(),
    };
    StorageService.saveTask(newTask);
    setTasks(StorageService.getTasks());
    setDeals(StorageService.getDeals());
  };

  // Add Note to Deal Timeline
  const handleAddNoteToDeal = (content: string) => {
    if (!selectedDealForDetail || !currentUser) return;
    StorageService.addActivity({
      dealId: selectedDealForDetail.id,
      sellerId: currentUser.id,
      sellerName: currentUser.name,
      type: 'note',
      content,
    });
    setActivities(StorageService.getActivities());
  };

  // Manager Handlers: Register Seller & Register Client with Deal
  const handleSaveSeller = (seller: User) => {
    StorageService.saveUser(seller);
    setUsers(StorageService.getUsers());
  };

  const handleSaveClientAndDeal = (client: Client, deal?: Deal, initialTask?: Task) => {
    StorageService.saveClient(client);
    if (deal) {
      StorageService.saveDeal(deal);
      if (currentUser) {
        StorageService.addActivity({
          dealId: deal.id,
          sellerId: deal.sellerId,
          sellerName: currentUser.name,
          type: 'created',
          content: `Negócio criado e alocado para ${deal.sellerName} no valor de R$ ${deal.value.toLocaleString('pt-BR')}.`,
        });
      }
    }
    if (initialTask) {
      StorageService.saveTask(initialTask);
    }

    setClients(StorageService.getClients());
    setDeals(StorageService.getDeals());
    setTasks(StorageService.getTasks());
    setActivities(StorageService.getActivities());
  };

  // Homologation Handlers (Google Maps Prospecting)
  const handleOpenHomologation = (potentialClient: PotentialClient) => {
    setHomologationModal({
      isOpen: true,
      potentialClient,
    });
  };

  const handleConfirmHomologation = (client: Client, deal: Deal, initialTask?: Task) => {
    StorageService.saveClient(client);
    StorageService.saveDeal(deal);
    if (initialTask) {
      StorageService.saveTask(initialTask);
    }
    if (currentUser) {
      StorageService.addActivity({
        dealId: deal.id,
        sellerId: deal.sellerId,
        sellerName: currentUser.name,
        type: 'created',
        content: `Potencial cliente "${client.tradeName}" adicionado à homologação via Google Maps (CNAE: ${client.cnae || 'N/A'}). Oportunidade inserida no funil.`,
      });
    }

    setClients(StorageService.getClients());
    setDeals(StorageService.getDeals());
    setTasks(StorageService.getTasks());
    setActivities(StorageService.getActivities());
  };

  // Screen 1: Dedicated Login Screen if not authenticated
  if (!currentUser) {
    return (
      <div className={isDarkMode ? 'dark' : ''}>
        <LoginScreen
          users={users.length > 0 ? users : StorageService.getUsers()}
          onLogin={handleLogin}
          isDarkMode={isDarkMode}
          onToggleDarkMode={toggleDarkMode}
        />
      </div>
    );
  }

  const selectedClient = selectedDealForDetail
    ? clients.find((c) => c.id === selectedDealForDetail.clientId) || null
    : null;

  return (
    <APIProvider
      apiKey={GOOGLE_MAPS_API_KEY}
      language="pt-BR"
      region="BR"
      libraries={['places', 'marker', 'geometry', 'core']}
    >
      <div className={`min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col font-sans text-black dark:text-slate-100 transition-colors duration-200 ${isDarkMode ? 'dark' : ''}`}>
        {/* Quota Defense Banner (Case A Demo Key) */}
        {isQuotaExceeded && (
          <div className="bg-amber-50 dark:bg-amber-950/60 border-b border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
            <span>
              Google Maps Platform quota reached. If you are the app owner, visit{' '}
              <a
                href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-semibold text-amber-950 dark:text-amber-100 hover:text-amber-800"
              >
                maps developer site
              </a>{' '}
              for instructions to update your account.
            </span>
          </div>
        )}

        {/* Top Navbar with Blue & Black Palette, Dark Mode Toggle and Logout */}
        <Navbar
          currentUser={currentUser}
          onLogout={handleLogout}
          isDarkMode={isDarkMode}
          onToggleDarkMode={toggleDarkMode}
        />

        {/* Main Viewport Content */}
        <main className="flex-1 max-w-[1700px] w-full mx-auto p-4 sm:p-6">
          {currentUser.role === 'gestor' ? (
            <ManagerDashboard
              currentUser={currentUser}
              users={users}
              deals={deals}
              tasks={tasks}
              clients={clients}
              activities={activities}
              onSaveSeller={handleSaveSeller}
              onSaveClientAndDeal={handleSaveClientAndDeal}
              onUpdateStage={handleUpdateStage}
              onOpenDealDetail={(deal) => setSelectedDealForDetail(deal)}
              onOpenPhoneUpdate={handleOpenPhoneUpdate}
              onOpenHomologation={handleOpenHomologation}
            />
          ) : (
            <SellerDashboard
              currentUser={currentUser}
              users={users}
              deals={deals}
              tasks={tasks}
              clients={clients}
              onToggleTask={handleToggleTask}
              onAddTask={handleAddTask}
              onUpdateStage={handleUpdateStage}
              onOpenDealDetail={(deal) => setSelectedDealForDetail(deal)}
              onOpenPhoneUpdate={handleOpenPhoneUpdate}
              onSavePhone={handleSavePhone}
              onOpenHomologation={handleOpenHomologation}
            />
          )}
        </main>

        {/* Footer in Blue & Black */}
        <footer className="bg-white dark:bg-slate-900 border-t-2 border-black/10 dark:border-slate-800 py-4 px-6 text-center text-xs text-slate-500 dark:text-slate-400 mt-auto">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <span className="font-bold text-black dark:text-white">
              FluxoCRM · Sistema Comercial e Funil de Vendas Kanban
            </span>
            <span className="text-blue-600 dark:text-blue-400 font-medium">
              Design em Azul e Preto · Suporte a Modo Escuro · BrasilAPI & Google Maps
            </span>
          </div>
        </footer>

        {/* Modal: Atualizar Telefone do Cliente */}
        <PhoneUpdateModal
          isOpen={phoneModal.isOpen}
          onClose={() => setPhoneModal((prev) => ({ ...prev, isOpen: false }))}
          clientId={phoneModal.clientId}
          clientName={phoneModal.clientName}
          currentPhone={phoneModal.currentPhone}
          onSavePhone={handleSavePhone}
        />

        {/* Modal: Detalhes do Negócio & Linha do Tempo */}
        <DealDetailModal
          isOpen={Boolean(selectedDealForDetail)}
          onClose={() => setSelectedDealForDetail(null)}
          deal={selectedDealForDetail}
          client={selectedClient}
          tasks={tasks}
          activities={activities.filter((a) => a.dealId === selectedDealForDetail?.id)}
          currentUser={currentUser}
          onUpdateStage={handleUpdateStage}
          onOpenPhoneUpdate={handleOpenPhoneUpdate}
          onToggleTask={handleToggleTask}
          onAddTask={handleAddTask}
          onAddNote={handleAddNoteToDeal}
        />

        {/* Modal: Homologação de Potenciais Clientes (Google Maps + CNAE) */}
        <HomologationModal
          isOpen={homologationModal.isOpen}
          onClose={() => setHomologationModal({ isOpen: false, potentialClient: null })}
          potentialClient={homologationModal.potentialClient}
          users={users}
          currentUser={currentUser}
          onConfirmHomologation={handleConfirmHomologation}
        />
      </div>
    </APIProvider>
  );
}
