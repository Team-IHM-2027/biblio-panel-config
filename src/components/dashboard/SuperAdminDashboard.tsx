'use client';

import React, { useState } from 'react';
import { 
  LayoutDashboard, BookOpen, Settings, BarChart3, 
  Wrench, Loader2, Menu, X, Search, Bell, User, LogOut, Shield
} from 'lucide-react';

// Hooks
import { useDashboardData } from '@/hooks/useDashboardData';
import { useAdminActions } from '@/hooks/useAdminActions';
import { useNotificationHelpers } from '@/hooks/useNotificationHelpers';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

// Sub-components
import { DashboardView } from './DashboardView';
import { AnalyticsView } from './AnalyticsView';
import { MaintenanceView } from './MaintenanceView';
import { SettingsView } from './SettingsView';
import { OrgSettings } from '@/types/dashboard';

export default function SuperAdminDashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const router = useRouter();
  
  // Récupération des données
  const { stats, orgSettings, loading } = useDashboardData();
  const { user, logout } = useAuth();
  
  // Hook d'actions
  const { updateSettingsAndNotify } = useAdminActions();
  const { notifyError } = useNotificationHelpers();

  // Wrapper pour gérer la mise à jour
  const handleSettingsUpdate = async (updates: Partial<OrgSettings>) => {
      if (!orgSettings) return;
      try {
          await updateSettingsAndNotify(orgSettings, updates);
      } catch (error) {
          notifyError('Erreur système', 'Échec de la mise à jour des paramètres.');
          throw error;
      }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      notifyError('Erreur', 'Impossible de se déconnecter');
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Vue d\'ensemble', icon: LayoutDashboard },
    { id: 'analytics', label: 'Analytiques', icon: BarChart3 },
    { id: 'maintenance', label: 'Maintenance', icon: Wrench },
    { id: 'configuration', label: 'Configuration', icon: Settings },
  ];

  const renderContent = () => {
    if (loading && !orgSettings) {
        return (
            <div className="h-[70vh] flex flex-col items-center justify-center text-gray-500">
                <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
                <p>Synchronisation avec le catalogue...</p>
            </div>
        );
    }

    switch(activeTab) {
      case 'dashboard': return <DashboardView stats={stats} />;
      case 'analytics': return <AnalyticsView stats={stats} />;
      case 'maintenance': return <MaintenanceView orgSettings={orgSettings} onSettingsUpdate={handleSettingsUpdate} />;
      case 'configuration': return <SettingsView orgSettings={orgSettings} onUpdate={handleSettingsUpdate} />;
      default: return <DashboardView stats={stats} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-full bg-white border-r border-gray-200 transition-all duration-300 z-50 ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
        {/* Header Sidebar avec logo et titre */}
        <div className="border-b border-gray-100">
          <div className="flex items-center justify-between p-4">
            {isSidebarOpen && (
              <div className="flex items-center space-x-3">
              </div>
            )}
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
            >
              {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          {/* Profil Admin - Style ConfigurationPanel */}
          {user && (
            <div className={`px-4 pb-4 ${!isSidebarOpen && 'flex justify-center'}`}>
              <div className={`bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-3 border border-blue-100 transition-all ${!isSidebarOpen && 'w-12 h-12 p-0 flex items-center justify-center'}`}>
                {isSidebarOpen ? (
                  <>
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                        {user.name?.charAt(0).toUpperCase() || 'A'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{user.name}</p>
                        <div className="flex items-center space-x-1 mt-0.5">
                          <Shield className="w-3 h-3 text-blue-600" />
                          <p className="text-xs text-blue-600 font-medium capitalize">
                            {user.role?.replace('_', ' ')}
                          </p>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => router.push('/profile')}
                      className="flex items-center justify-center space-x-2 w-full py-2 bg-white hover:bg-blue-50 rounded-lg transition-colors text-sm font-medium text-gray-700 hover:text-blue-600 border border-gray-200 hover:border-blue-300"
                    >
                      <User className="w-4 h-4" />
                      <span>Mon profil</span>
                    </button>
                  </>
                ) : (
                  <div 
                    onClick={() => router.push('/profile')}
                    className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold shadow-md cursor-pointer hover:scale-105 transition-transform"
                    title={user.name}
                  >
                    {user.name?.charAt(0).toUpperCase() || 'A'}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl transition-all duration-200 group ${
                activeTab === item.id 
                  ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-600 font-semibold shadow-sm border border-blue-100' 
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <item.icon className={`w-5 h-5 flex-shrink-0 ${activeTab === item.id ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
              {isSidebarOpen && <span className="truncate">{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* Bouton Déconnexion */}
        <div className={`absolute bottom-4 ${isSidebarOpen ? 'left-4 right-4' : 'left-2 right-2'}`}>
          <button
            onClick={handleLogout}
            className={`w-full flex items-center ${isSidebarOpen ? 'justify-center space-x-2' : 'justify-center'} px-4 py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-colors font-medium`}
          >
            <LogOut className="w-5 h-5" />
            {isSidebarOpen && <span>Déconnexion</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-20'}`}>
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40">
          <div className="flex items-center justify-between px-8 py-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 capitalize">
                {navItems.find(i => i.id === activeTab)?.label}
              </h2>
              {orgSettings?.Name && (
                <p className="text-sm text-gray-500 mt-1">{orgSettings.Name}</p>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Rechercher..." 
                  className="pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 w-64" 
                />
              </div>
              <button className="relative p-2.5 rounded-xl hover:bg-gray-100 transition-colors">
                <Bell className="w-5 h-5 text-gray-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
            </div>
          </div>
        </header>

        <main className="p-8">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}