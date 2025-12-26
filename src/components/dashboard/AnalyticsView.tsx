import React from 'react';
import { TrendingUp, Activity, AlertOctagon, BookOpen } from 'lucide-react';
import { DashboardStats } from '@/types/dashboard';

interface AnalyticsViewProps {
    stats: DashboardStats;
}

export const AnalyticsView = ({ stats }: AnalyticsViewProps) => (
    <div className="space-y-6">
        <div className="bg-blue-600 rounded-xl p-8 text-white shadow-lg">
            <h2 className="text-2xl font-bold mb-2">Rapport d&apos;Activité Stratégique</h2>
            <p className="text-blue-100">Vue d&apos;ensemble de la performance de la bibliothèque.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Taux de rotation */}
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <h3 className="font-semibold text-gray-700 mb-4 flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2 text-green-500" />
                    Taux de rotation
                </h3>
                <div className="text-3xl font-bold text-gray-900 mb-2">
                    {stats.rotationRate}%
                </div>
                <p className="text-sm text-gray-500">
                    {stats.activeLoans} prêts actifs sur {stats.totalBooks} livres. 
                    Un taux sain se situe entre 15% et 30%.
                </p>
                {stats.rotationRate < 15 && (
                    <div className="mt-3 px-3 py-2 bg-yellow-50 text-yellow-700 rounded-lg text-xs">
                        ⚠️ Taux faible - Envisager des actions promotionnelles
                    </div>
                )}
                {stats.rotationRate > 30 && (
                    <div className="mt-3 px-3 py-2 bg-green-50 text-green-700 rounded-lg text-xs">
                        ✅ Excellente utilisation du catalogue !
                    </div>
                )}
            </div>

            {/* Activité Mensuelle */}
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <h3 className="font-semibold text-gray-700 mb-4 flex items-center">
                    <Activity className="w-5 h-5 mr-2 text-blue-500" />
                    Activité mensuelle
                </h3>
                <div className="text-3xl font-bold text-gray-900 mb-2">
                    {stats.monthlyLoans}
                </div>
                <p className="text-sm text-gray-500">
                    Emprunts effectués ce mois-ci. 
                    Moyenne par utilisateur: {stats.totalUsers > 0 ? (stats.monthlyLoans / stats.totalUsers).toFixed(1) : 0}
                </p>
            </div>

            {/* Incidents */}
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <h3 className="font-semibold text-gray-700 mb-4 flex items-center">
                    <AlertOctagon className="w-5 h-5 mr-2 text-red-500" />
                    Incidents
                </h3>
                <div className="text-3xl font-bold text-gray-900 mb-2">
                    {stats.overdueBooks}
                </div>
                <p className="text-sm text-gray-500">
                    Livres en retard actuellement.
                </p>
            </div>
        </div>
        
        {/* Tableau Top 5 */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100">
                <h3 className="font-bold text-gray-800">Top 5 des Ouvrages les plus demandés</h3>
            </div>
            <table className="w-full">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                    <tr>
                        <th className="px-6 py-3 text-left">Titre</th>
                        <th className="px-6 py-3 text-left">Catégorie</th>
                        <th className="px-6 py-3 text-center">Nombre d&apos;emprunts</th>
                        <th className="px-6 py-3 text-center">Popularité</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {stats.topBorrowedBooks.length > 0 ? (
                        stats.topBorrowedBooks.map((book, i) => (
                            <tr key={i} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 text-sm font-medium text-gray-900">{book.title}</td>
                                <td className="px-6 py-4 text-sm text-gray-500">{book.category}</td>
                                <td className="px-6 py-4 text-sm text-gray-900 text-center font-bold">{book.count}</td>
                                <td className="px-6 py-4 text-center">
                                    <div className="flex items-center justify-center">
                                        <div className="w-24 bg-gray-200 rounded-full h-2">
                                            <div 
                                                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                                                style={{ width: `${Math.min((book.count / (stats.topBorrowedBooks[0]?.count || 1)) * 100, 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={4} className="px-6 py-10 text-center text-gray-500">
                                <div className="flex flex-col items-center">
                                    <BookOpen className="w-12 h-12 text-gray-300 mb-3" />
                                    <p>Aucune donnée d&apos;emprunt disponible</p>
                                </div>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    </div>
);