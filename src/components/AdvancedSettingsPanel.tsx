'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    Settings,
    Save,
    RefreshCw,
    AlertCircle,
    Database,
    Users,
    BookOpen,
    BarChart3,
    Wrench,
    Download
} from 'lucide-react';
import { collection, getDoc, getDocs, doc, setDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { DatabaseInitializer } from '@/lib/database/initialization';
import { useNotificationHelpers } from '@/hooks/useNotificationHelpers';
import { AuthHeader } from '@/components/AuthHeader';
import { Button } from '@/components/ui/Button';
import { db } from '@/lib/firebase';

// Schema pour les paramètres d'application
const appSettingsSchema = z.object({
    AppVersion: z.number().min(1),
    DefaultLoanDuration: z.number().min(1).max(365),
    GlobalLimits: z.number().min(1).max(50),
    MaintenanceMode: z.boolean(),
});

type AppSettingsFormData = z.infer<typeof appSettingsSchema>;

interface SystemStats {
    totalUsers: number;
    totalBooks: number;
    activeLoans: number;
    overdueBooks: number;
    systemUptime: string;
    lastBackup: string;
}

export default function AdvancedSettingsPanel() {
    const [activeTab, setActiveTab] = useState<'app' | 'system' | 'maintenance'>('app');
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
    const [isStatsLoading, setIsStatsLoading] = useState(false);
    const [isBackupRunning, setIsBackupRunning] = useState(false);
    const [isCleanupRunning, setIsCleanupRunning] = useState(false);

    const { notifySuccess, notifyError } = useNotificationHelpers();

    const {
        register,
        handleSubmit,
        formState: { errors },
        watch,
        reset
    } = useForm<AppSettingsFormData>({
        resolver: zodResolver(appSettingsSchema),
        defaultValues: {
            AppVersion: 1,
            DefaultLoanDuration: 21,
            GlobalLimits: 5,
            MaintenanceMode: false
        }
    });

    const maintenanceMode = watch('MaintenanceMode');

    useEffect(() => {
        loadAppSettings();
        loadSystemStats();
    }, []);

    const loadAppSettings = async () => {
        setIsLoading(true);
        try {
            const settings = await DatabaseInitializer.getAppSettings();
            reset(settings);
        } catch (error) {
            notifyError('Erreur', 'Impossible de charger les paramètres');
            console.error('Error loading settings:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const onSubmit = async (data: AppSettingsFormData) => {
        setIsSaving(true);
        try {
            await DatabaseInitializer.updateAppSettings(data);
            notifySuccess('Paramètres sauvegardés', 'Les modifications ont été appliquées');
        } catch (error) {
            notifyError('Erreur de sauvegarde', 'Impossible de sauvegarder les paramètres');
            console.log(error);
        } finally {
            setIsSaving(false);
        }
    };


    const formatUptime = (value: unknown) => {
        if (!value) return 'Non disponible';
        const date = typeof (value as { toDate?: () => Date }).toDate === 'function'
            ? (value as { toDate: () => Date }).toDate()
            : value instanceof Date
                ? value
                : null;
        if (!date) return 'Non disponible';

        const diffMs = Date.now() - date.getTime();
        if (diffMs < 0) return 'Non disponible';

        const dayMs = 24 * 60 * 60 * 1000;
        const days = Math.floor(diffMs / dayMs);
        const hours = Math.floor((diffMs % dayMs) / (60 * 60 * 1000));

        if (days <= 0) return `${Math.max(hours, 0)} h`;
        if (hours <= 0) return `${days} j`;
        return `${days} j ${hours} h`;
    };

    const loadSystemStats = async () => {
        setIsStatsLoading(true);
        try {
            const usersSnap = await getDocs(collection(db, 'BiblioUser'));
            const userDocs = usersSnap.docs.filter((docItem) => docItem.id !== '_placeholder');

            let activeLoans = 0;
            let overdueBooks = 0;

            userDocs.forEach((docItem) => {
                const data = docItem.data() as Record<string, unknown>;
                Object.keys(data).forEach((key) => {
                    if (!/^etat\d+$/.test(key)) return;
                    const value = data[key];
                    if (value === 'emprunt') activeLoans += 1;
                    if (value === 'retard') overdueBooks += 1;
                });
            });

            const booksSnap = await getDocs(collection(db, 'BiblioBooks'));
            const bookDocs = booksSnap.docs.filter((docItem) => docItem.id !== '_placeholder');

            const initSnap = await getDoc(doc(db, 'Configuration', 'initialized'));
            const initData = initSnap.exists() ? initSnap.data() : null;
            const systemUptime = formatUptime(initData?.initializedAt);

            const maintenanceSnap = await getDoc(doc(db, 'Configuration', 'SystemMaintenance'));
            const maintenanceData = maintenanceSnap.exists() ? maintenanceSnap.data() : null;
            const lastBackup = formatUptime(maintenanceData?.lastBackupAt);

            setSystemStats({
                totalUsers: userDocs.length,
                totalBooks: bookDocs.length,
                activeLoans,
                overdueBooks,
                systemUptime,
                lastBackup
            });
        } catch (error) {
            notifyError('Erreur', 'Impossible de charger les statistiques du systeme');
            setSystemStats(null);
            console.error('Error loading system stats:', error);
        } finally {
            setIsStatsLoading(false);
        }
    };

    const handleDatabaseBackup = async () => {
        setIsBackupRunning(true);
        try {
            const [orgSnap, appSnap, notificationsSnap] = await Promise.all([
                getDoc(doc(db, 'Configuration', 'OrgSettings')),
                getDoc(doc(db, 'Configuration', 'AppSettings')),
                getDoc(doc(db, 'Configuration', 'Notifications'))
            ]);

            const usersSnap = await getDocs(collection(db, 'BiblioUser'));
            const booksSnap = await getDocs(collection(db, 'BiblioBooks'));
            const thesesSnap = await getDocs(collection(db, 'BiblioThesis'));

            const backupPayload = {
                exported_at: new Date().toISOString(),
                configuration: {
                    orgSettings: orgSnap.exists() ? orgSnap.data() : null,
                    appSettings: appSnap.exists() ? appSnap.data() : null,
                    notifications: notificationsSnap.exists() ? notificationsSnap.data() : null
                },
                stats: {
                    totalUsers: usersSnap.docs.filter((docItem) => docItem.id !== '_placeholder').length,
                    totalBooks: booksSnap.docs.filter((docItem) => docItem.id !== '_placeholder').length,
                    totalTheses: thesesSnap.docs.filter((docItem) => docItem.id !== '_placeholder').length
                }
            };

            const blob = new Blob([JSON.stringify(backupPayload, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `biblio-backup-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);

            await setDoc(doc(db, 'Configuration', 'SystemMaintenance'), {
                lastBackupAt: serverTimestamp(),
                lastBackupSummary: backupPayload.stats,
                lastBackupType: 'manual'
            }, { merge: true });

            await loadSystemStats();
            notifySuccess('Sauvegarde terminÃ©e', 'La sauvegarde a Ã©tÃ© gÃ©nÃ©rÃ©e et enregistrÃ©e.');
        } catch (error) {
            console.error('Backup error:', error);
            notifyError('Erreur', 'Impossible de crÃ©er la sauvegarde.');
        } finally {
            setIsBackupRunning(false);
        }
    };

    const handleSystemCleanup = async () => {
        setIsCleanupRunning(true);
        try {
            const alertsSnap = await getDocs(collection(db, 'SystemAlerts'));
            const batch = writeBatch(db);
            const now = Date.now();
            const retentionMs = 30 * 24 * 60 * 60 * 1000;
            let removed = 0;

            alertsSnap.docs.forEach((alertDoc) => {
                const data = alertDoc.data() as { read?: boolean; createdAt?: { toDate?: () => Date } };
                if (!data?.read) return;
                const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : null;
                if (!createdAt) return;
                if (now - createdAt.getTime() > retentionMs) {
                    batch.delete(alertDoc.ref);
                    removed += 1;
                }
            });

            if (removed > 0) {
                await batch.commit();
            }

            await setDoc(doc(db, 'Configuration', 'SystemMaintenance'), {
                lastCleanupAt: serverTimestamp(),
                lastCleanupRemoved: removed
            }, { merge: true });

            notifySuccess('Nettoyage terminÃ©', `Alertes supprimÃ©es : ${removed}`);
        } catch (error) {
            console.error('Cleanup error:', error);
            notifyError('Erreur', 'Impossible de nettoyer le systÃ¨me.');
        } finally {
            setIsCleanupRunning(false);
        }
    };

    const exportSettings = () => {
        const settings = {
            app: watch(),
            exported_at: new Date().toISOString(),
            version: '1.0.0'
        };

        const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `biblioteca-config-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);

        notifySuccess('Configuration exportée', 'Le fichier a été téléchargé');
    };

    const TabButton = ({ id, label, icon: Icon }: { id: 'app' | 'system' | 'maintenance', label: string, icon: React.ElementType }) => (
        <button
            type="button"
            onClick={() => setActiveTab(id)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                activeTab === id
                    ? 'bg-primary text-primary-foreground'
                    : 'text-gray-600 hover:bg-gray-100'
            }`}
        >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{label}</span>
        </button>
    );

    const StatCard = ({ icon: Icon, label, value, colorScheme = 'primary' }: {
        icon: React.ElementType,
        label: string,
        value: string | number,
        colorScheme?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger'
    }) => {
        const getColorClasses = () => {
            switch (colorScheme) {
                case 'primary':
                    return 'bg-primary/10 text-primary';
                case 'secondary':
                    return 'bg-secondary/10 text-secondary';
                case 'success':
                    return 'bg-green-100 text-green-600';
                case 'warning':
                    return 'bg-yellow-100 text-yellow-600';
                case 'danger':
                    return 'bg-red-100 text-red-600';
                default:
                    return 'bg-primary/10 text-primary';
            }
        };

        return (
            <div className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-600 mb-1">{label}</p>
                        <p className="text-2xl font-bold text-gray-900">{value}</p>
                    </div>
                    <div className={`p-3 rounded-lg ${getColorClasses()}`}>
                        <Icon className="w-6 h-6" />
                    </div>
                </div>
            </div>
        );
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
                    <p className="text-gray-600">Chargement des paramètres...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header avec authentification */}
            <AuthHeader
                title="Paramètres Avancés"
                subtitle="Configuration système et maintenance"
                icon={<Wrench className="w-6 h-6 text-white" />}
            >
                <Button
                    onClick={handleSubmit(onSubmit)}
                    disabled={isSaving}
                    variant="primary"
                >
                    {isSaving ? (
                        <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Sauvegarde...
                        </>
                    ) : (
                        <>
                            <Save className="w-4 h-4 mr-2" />
                            Sauvegarder
                        </>
                    )}
                </Button>
            </AuthHeader>

            <div className="max-w-6xl mx-auto px-4 py-8">
                {/* Navigation des onglets */}
                <div className="mb-8 flex flex-wrap gap-2 bg-white p-2 rounded-lg shadow-sm">
                    <TabButton id="app" label="Application" icon={Settings} />
                    <TabButton id="system" label="Système" icon={Database} />
                    <TabButton id="maintenance" label="Maintenance" icon={Wrench} />
                </div>

                <div className="space-y-8">
                    {/* Onglet Application */}
                    {activeTab === 'app' && (
                        <div className="bg-white rounded-xl shadow-lg p-8">
                            <h2 className="text-xl font-semibold text-gray-900 mb-6">Paramètres de l&apos;Application</h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Version de l&apos;application
                                    </label>
                                    <input
                                        {...register('AppVersion', { valueAsNumber: true })}
                                        type="number"
                                        min="1"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                                    />
                                    {errors.AppVersion && (
                                        <p className="mt-1 text-sm text-red-600">{errors.AppVersion.message}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Durée de prêt par défaut (jours)
                                    </label>
                                    <input
                                        {...register('DefaultLoanDuration', { valueAsNumber: true })}
                                        type="number"
                                        min="1"
                                        max="365"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                                    />
                                    {errors.DefaultLoanDuration && (
                                        <p className="mt-1 text-sm text-red-600">{errors.DefaultLoanDuration.message}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Limite globale de prêts
                                    </label>
                                    <input
                                        {...register('GlobalLimits', { valueAsNumber: true })}
                                        type="number"
                                        min="1"
                                        max="50"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                                    />
                                    {errors.GlobalLimits && (
                                        <p className="mt-1 text-sm text-red-600">{errors.GlobalLimits.message}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Mode maintenance
                                    </label>
                                    <div className="flex items-center space-x-3 p-4 border border-gray-300 rounded-lg hover:border-primary/50 transition-colors">
                                        <input
                                            type="checkbox"
                                            {...register('MaintenanceMode')}
                                            className="rounded border-gray-300 text-primary focus:ring-primary"
                                        />
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">
                                                {maintenanceMode ? (
                                                    <span className="text-orange-600">Activé</span>
                                                ) : (
                                                    <span className="text-green-600">Désactivé</span>
                                                )}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                Restreint l&apos;accès aux administrateurs uniquement
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Onglet Système */}
                    {activeTab === 'system' && (
                        <div className="bg-white rounded-xl shadow-lg p-8">
                            <h2 className="text-xl font-semibold text-gray-900 mb-6">Statistiques du Système</h2>

                            {isStatsLoading && !systemStats ? (
                                <div className="py-12 text-center text-gray-600">
                                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-3 text-primary" />
                                    Chargement des statistiques...
                                </div>
                            ) : systemStats ? (
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                        <StatCard
                                            icon={Users}
                                            label="Utilisateurs totaux"
                                            value={systemStats.totalUsers}
                                            colorScheme="primary"
                                        />
                                        <StatCard
                                            icon={BookOpen}
                                            label="Livres en catalogue"
                                            value={systemStats.totalBooks}
                                            colorScheme="secondary"
                                        />
                                        <StatCard
                                            icon={BarChart3}
                                            label="Prêts actifs"
                                            value={systemStats.activeLoans}
                                            colorScheme="success"
                                        />
                                        <StatCard
                                            icon={AlertCircle}
                                            label="Livres en retard"
                                            value={systemStats.overdueBooks}
                                            colorScheme="warning"
                                        />
                                    </div>

                                    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="p-6 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg border border-primary/20">
                                            <h3 className="text-lg font-semibold text-gray-900 mb-3">Etat du système</h3>
                                            <div className="space-y-2">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Temps de fonctionnement :</span>
                                                    <span className="font-medium text-primary">{systemStats.systemUptime}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Dernière sauvegarde :</span>
                                                    <span className="font-medium text-green-600">{systemStats.lastBackup}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-6 bg-gradient-to-r from-secondary/5 to-secondary/10 rounded-lg border border-secondary/20">
                                            <h3 className="text-lg font-semibold text-gray-900 mb-3">Performance</h3>
                                            <div className="space-y-2">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Taux d'emprunts actifs :</span>
                                                    <span className="font-medium text-secondary">
                                                        {systemStats.totalBooks > 0
                                                            ? `${Math.round((systemStats.activeLoans / systemStats.totalBooks) * 100)}%`
                                                            : '0%'}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Taux de retards :</span>
                                                    <span className="font-medium text-green-600">
                                                        {systemStats.activeLoans > 0
                                                            ? `${Math.round((systemStats.overdueBooks / systemStats.activeLoans) * 100)}%`
                                                            : '0%'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="py-12 text-center text-gray-600">Statistiques indisponibles.</div>
                            )}
                        </div>
                    )}

                    {/* Onglet Maintenance */}
                    {activeTab === 'maintenance' && (
                        <div className="bg-white rounded-xl shadow-lg p-8">
                            <h2 className="text-xl font-semibold text-gray-900 mb-6">Outils de Maintenance</h2>

                            <div className="space-y-6">
                                {/* Export de configuration */}
                                <div className="p-6 bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 rounded-lg">
                                    <div className="flex items-center space-x-3 mb-4">
                                        <div className="p-2 bg-primary rounded-lg">
                                            <Download className="w-6 h-6 text-primary-foreground" />
                                        </div>
                                        <h3 className="text-lg font-medium text-gray-900">Exporter la configuration</h3>
                                    </div>
                                    <p className="text-gray-700 mb-4">
                                        Télécharge un fichier JSON avec tous les paramètres actuels du système.
                                    </p>
                                    <Button
                                        onClick={exportSettings}
                                        variant="primary"
                                        className="hover:bg-primary/90 transition-colors"
                                    >
                                        <Download className="w-4 h-4 mr-2" />
                                        Exporter la configuration
                                    </Button>
                                </div>

                                {/* Sauvegarde système */}
                                <div className="p-6 bg-gradient-to-r from-secondary/5 to-secondary/10 border border-secondary/20 rounded-lg">
                                    <div className="flex items-center space-x-3 mb-4">
                                        <div className="p-2 bg-secondary rounded-lg">
                                            <Database className="w-6 h-6 text-secondary-foreground" />
                                        </div>
                                        <h3 className="text-lg font-medium text-gray-900">Sauvegarde de la base de données</h3>
                                    </div>
                                    <p className="text-gray-700 mb-4">
                                        Genere un fichier JSON de sauvegarde (configuration + statistiques) et enregistre la date de sauvegarde.
                                    </p>
                                    <Button
                                        variant="secondary"
                                        className="hover:bg-secondary/90 transition-colors"
                                        onClick={handleDatabaseBackup}
                                        disabled={isBackupRunning}
                                    >
                                        {isBackupRunning ? (
                                            <>
                                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                                Sauvegarde...
                                            </>
                                        ) : (
                                            <>
                                                <Database className="w-4 h-4 mr-2" />
                                                Creer une sauvegarde
                                            </>
                                        )}
                                    </Button>
                                </div>

                                {/* Nettoyage système */}
                                <div className="p-6 bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-200 rounded-lg">
                                    <div className="flex items-center space-x-3 mb-4">
                                        <div className="p-2 bg-yellow-500 rounded-lg">
                                            <RefreshCw className="w-6 h-6 text-white" />
                                        </div>
                                        <h3 className="text-lg font-medium text-gray-900">Nettoyage système</h3>
                                    </div>
                                    <p className="text-gray-700 mb-4">
                                        Supprime les alertes systeme lues depuis plus de 30 jours.
                                    </p>
                                    <Button
                                        variant="outline"
                                        className="border-yellow-300 text-yellow-700 hover:bg-yellow-50 transition-colors"
                                        onClick={handleSystemCleanup}
                                        disabled={isCleanupRunning}
                                    >
                                        {isCleanupRunning ? (
                                            <>
                                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                                Nettoyage...
                                            </>
                                        ) : (
                                            <>
                                                <RefreshCw className="w-4 h-4 mr-2" />
                                                Nettoyer le syst?me
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
