import React from 'react';
import { 
  BookOpen, TrendingUp, Users, Activity, AlertTriangle 
} from 'lucide-react';
import { DashboardStats } from '@/types/dashboard';
import { SimpleBarChart, CategoryProgress } from './ui/Charts';

interface DashboardViewProps {
    stats: DashboardStats;
}

export const DashboardView = ({ stats }: DashboardViewProps) => {
    // Vérification s'il y a assez d'infos pour la répartition
    const hasCategoryData = stats.popularCategories.length > 0 && stats.popularCategories.some(c => c.count > 0);

    return (
        <div className="space-y-6">
            {/* KPI Principaux */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* KPI Catalogue */}
                <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-blue-50 rounded-xl">
                            <BookOpen className="w-6 h-6 text-blue-600" />
                        </div>
                        <span className="text-xs font-medium bg-green-50 text-green-600 py-1 px-2 rounded-lg flex items-center">
                            <TrendingUp className="w-3 h-3 mr-1" /> Actif
                        </span>
                    </div>
                    <p className="text-gray-500 text-sm">Catalogue</p>
                    <h3 className="text-3xl font-bold text-gray-900">{stats.totalBooks}</h3>
                    <p className="text-xs text-gray-400 mt-1">Livres référencés</p>
                </div>

                {/* KPI Communauté */}
                <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-purple-50 rounded-xl">
                            <Users className="w-6 h-6 text-purple-600" />
                        </div>
                    </div>
                    <p className="text-gray-500 text-sm">Communauté</p>
                    <h3 className="text-3xl font-bold text-gray-900">{stats.totalUsers}</h3>
                    <p className="text-xs text-gray-400 mt-1">Utilisateurs inscrits</p>
                </div>

                {/* KPI Circulation */}
                <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-indigo-50 rounded-xl">
                            <Activity className="w-6 h-6 text-indigo-600" />
                        </div>
                    </div>
                    <p className="text-gray-500 text-sm">Circulation</p>
                    <h3 className="text-3xl font-bold text-gray-900">{stats.activeLoans}</h3>
                    <p className="text-xs text-gray-400 mt-1">Prêts en cours</p>
                </div>

                {/* KPI Incidents */}
                <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-orange-50 rounded-xl">
                            <AlertTriangle className="w-6 h-6 text-orange-600" />
                        </div>
                        {stats.overdueBooks > 0 && (
                            <span className="text-xs font-medium bg-red-50 text-red-600 py-1 px-2 rounded-lg flex items-center">
                                Attention
                            </span>
                        )}
                    </div>
                    <p className="text-gray-500 text-sm">Incidents</p>
                    <h3 className="text-3xl font-bold text-gray-900">{stats.overdueBooks}</h3>
                    <p className="text-xs text-gray-400 mt-1">Livres en retard</p>
                </div>
            </div>

            {/* Section Graphiques */}
            <div className={`grid grid-cols-1 ${hasCategoryData ? 'lg:grid-cols-3' : 'lg:grid-cols-1'} gap-6`}>
                {/* Graphique Activité */}
                <div className={`${hasCategoryData ? 'lg:col-span-2' : ''} bg-white p-6 rounded-xl border border-gray-100 shadow-sm`}>
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-gray-800">Activité des emprunts</h3>
                        <select className="text-sm border-gray-200 rounded-lg text-gray-500 bg-gray-50">
                            <option>Cette semaine</option>
                            <option>Ce mois</option>
                        </select>
                    </div>
                    <div className="h-64 w-full">
                        <SimpleBarChart data={stats.recentActivity} />
                    </div>
                </div>

                {/* Graphique Répartition */}
                {hasCategoryData && (
                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                        <h3 className="text-lg font-bold text-gray-800 mb-6">Répartition du catalogue</h3>
                        <div className="space-y-6">
                            {stats.popularCategories.map((cat, idx) => (
                                <CategoryProgress 
                                    key={idx}
                                    label={cat.name} 
                                    count={cat.count} 
                                    percentage={cat.percentage}
                                    color={idx % 2 === 0 ? 'bg-blue-500' : 'bg-purple-500'}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};