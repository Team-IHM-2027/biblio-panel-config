import { Download } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { Activity, CheckCircle2, Wrench, Save, HelpCircle } from 'lucide-react';
import { OrgSettings } from '@/types/dashboard';
import { useNotificationHelpers } from '@/hooks/useNotificationHelpers';


// ... (dans le composant MaintenanceView)

    const handleExportConfig = () => {
        const configToExport = {
            ...orgSettings,
            exported_at: new Date().toISOString(),
            version: '1.0.0'
        };

        const blob = new Blob([JSON.stringify(configToExport, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `biblio-config-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        // On suppose que notifySuccess est passé en props ou récupéré via le hook
        // Si tu utilises le hook à l'intérieur :
        // notifySuccess('Export réussi', 'Le fichier de configuration a été téléchargé.');
    };

    // ... (Dans le JSX, section Actions Administratives, ajoute ce bouton)
    
    <button onClick={handleExportConfig} className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left group">
        <div>
            <span className="block font-medium text-gray-900">Exporter la configuration</span>
            <span className="text-xs text-gray-500">Télécharger les paramètres au format JSON</span>
        </div>
        <Download className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
    </button>

    // ... (Le reste de tes boutons existants comme Logs, Nettoyage)
interface MaintenanceViewProps {
    orgSettings: OrgSettings;
    onSettingsUpdate: (updates: Partial<OrgSettings>) => Promise<void>;
}

export const MaintenanceView = ({ orgSettings, onSettingsUpdate }: MaintenanceViewProps) => {
    const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
    const [isToggling, setIsToggling] = useState(false);
    const { notifySuccess, notifyError } = useNotificationHelpers();

    useEffect(() => {
        if (orgSettings?.MaintenanceMode !== undefined) {
            setIsMaintenanceMode(orgSettings.MaintenanceMode);
        }
    }, [orgSettings]);

    const toggleMaintenanceMode = async () => {
        setIsToggling(true);
        try {
            const newMode = !isMaintenanceMode;
            // On appelle la fonction du parent qui va update ET notifier
            await onSettingsUpdate({ MaintenanceMode: newMode });
            
            // Mise à jour de l'état local seulement après succès
            setIsMaintenanceMode(newMode);
            notifySuccess(
                newMode ? 'Maintenance activée' : 'Maintenance désactivée',
                newMode ? 'Notification envoyée aux bibliothécaires' : 'Système réouvert'
            );
        } catch (error) {
            console.error('Erreur:', error);
            notifyError('Erreur', 'Impossible de changer le mode maintenance');
        } finally {
            setIsToggling(false);
        }
    };
    
    const notImplemented = () => notifySuccess('Info', 'Fonctionnalité bientôt disponible');

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* État de Santé Global */}
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <h3 className="font-bold text-gray-800 mb-6 flex items-center">
                        <Activity className="w-5 h-5 mr-2 text-blue-600" />
                        Santé du Système
                    </h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-100">
                            <div className="flex items-center space-x-3">
                                <CheckCircle2 className="w-5 h-5 text-green-600" />
                                <span className="font-medium text-green-900">Base de données Firebase</span>
                            </div>
                            <span className="text-sm text-green-700 font-medium">Opérationnelle</span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-100">
                            <div className="flex items-center space-x-3">
                                <Activity className="w-5 h-5 text-blue-600" />
                                <span className="font-medium text-blue-900">Mode maintenance</span>
                            </div>
                            <span className={`text-sm font-medium ${isMaintenanceMode ? 'text-orange-700' : 'text-green-700'}`}>
                                {isMaintenanceMode ? 'Activé' : 'Désactivé'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Actions Administratives */}
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <h3 className="font-bold text-gray-800 mb-6 flex items-center">
                        <Wrench className="w-5 h-5 mr-2 text-gray-600" />
                        Actions Administratives
                    </h3>
                    <div className="space-y-3">
                        <div className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <span className="block font-medium text-gray-900">Mode Maintenance</span>
                                    <span className="text-xs text-gray-500">
                                        {isMaintenanceMode ? 'Accès bloqué. Bibliothécaires notifiés.' : 'Bloquer l\'accès aux utilisateurs'}
                                    </span>
                                </div>
                                <button
                                    onClick={toggleMaintenanceMode}
                                    disabled={isToggling}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                                        isMaintenanceMode ? 'bg-orange-600' : 'bg-gray-200'
                                    } ${isToggling ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isMaintenanceMode ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>
                        </div>
                        
                        <button onClick={notImplemented} className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
                            <div><span className="block font-medium text-gray-900">Exporter les logs</span></div><Save className="w-5 h-5 text-gray-400" />
                        </button>

                        <button onClick={notImplemented} className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
                            <div><span className="block font-medium text-gray-900">Nettoyage automatique</span></div><HelpCircle className="w-5 h-5 text-gray-400" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};