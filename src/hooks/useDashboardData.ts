import { useState, useEffect } from 'react';
import { collection, onSnapshot, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { DashboardStats, OrgSettings } from '@/types/dashboard';

export function useDashboardData() {
  const [stats, setStats] = useState<DashboardStats>({
    totalBooks: 0, 
    totalTheses: 0, 
    totalUsers: 0, 
    activeLoans: 0, 
    overdueBooks: 0,
    popularCategories: [], 
    recentActivity: [0, 0, 0, 0, 0, 0, 0], 
    recentLogs: [],
    topBorrowedBooks: [], 
    monthlyLoans: 0, 
    rotationRate: 0, 
    availableExemplaires: 0,
    totalBookExemplaires: 0, 
    suspendedStudents: 0
  });

  const [orgSettings, setOrgSettings] = useState<OrgSettings | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper pour recalculer le taux de rotation de manière sûre
  const calculateRotation = (active: number, total: number) => {
    return total > 0 ? parseFloat(((active / total) * 100).toFixed(1)) : 0;
  };

  useEffect(() => {
    setLoading(true);
    console.log('🔄 Initialisation de useDashboardData...');

    // 1. Écoute des Livres - CORRECTION PRINCIPALE
    const unsubBooks = onSnapshot(
      collection(db, 'BiblioLivres'), 
      (snapshot) => {
        console.log('📚 Snapshot reçu - Nombre de documents:', snapshot.size);
        
        const categories: Record<string, number> = {};
        const bookBorrowCount: Record<string, any> = {};
        let totalBookExemplaires = 0;
        let availableExemplaires = 0;

        snapshot.docs.forEach(doc => {
          const data = doc.data();
          console.log('📖 Livre trouvé:', doc.id, data);
          
          // Gestion des différentes variantes de noms de champs
          const cat = data.Cathegorie || data.categorie || data.Category || 'Non classé';
          categories[cat] = (categories[cat] || 0) + 1;
          
          // Stockage pour croisement avec l'historique
          bookBorrowCount[doc.id] = { 
            title: data.Nom || data.nom || data.title || 'Sans titre', 
            category: cat 
          };
          
          // Gestion des exemplaires avec différentes variantes
          const initialEx = data.initialExemplaire || data.InitialExemplaire || 0;
          const currentEx = data.Exemplaire || data.exemplaire || 0;
          
          if (typeof initialEx === 'number') totalBookExemplaires += initialEx;
          if (typeof currentEx === 'number') availableExemplaires += currentEx;
        });

        const total = snapshot.size;
        console.log('✅ Total de livres comptés:', total);
        
        // Calcul catégories populaires
        const popularCategories = Object.entries(categories)
          .map(([name, count]) => ({
            name,
            count,
            percentage: total > 0 ? Math.round((count / total) * 100) : 0
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        console.log('📊 Catégories populaires:', popularCategories);

        // Mise à jour de window pour l'accès dans l'historique
        (window as any).__bookBorrowCount = bookBorrowCount;

        setStats(prev => {
          const newStats = { 
            ...prev, 
            totalBooks: total, // CORRECTION: assignation directe du total
            popularCategories, 
            totalBookExemplaires, 
            availableExemplaires,
            rotationRate: calculateRotation(prev.activeLoans, total)
          };
          console.log('📈 Stats mises à jour:', newStats);
          return newStats;
        });
      },
      (error) => {
        console.error('❌ Erreur lors de la récupération des livres:', error);
        console.error('Détails:', error.message, error.code);
      }
    );

    // 2. Écoute des Utilisateurs (pour les prêts actifs)
    const unsubUsers = onSnapshot(
      collection(db, 'BiblioUser'), 
      (snapshot) => {
        console.log('👥 Utilisateurs trouvés:', snapshot.size);
        
        let activeLoansCount = 0;
        let suspendedStudents = 0;

        snapshot.docs.forEach(doc => {
          const data = doc.data();
          
          // Vérification suspension
          if (data.Etat1 === 'bloc' || data.etat === 'bloc') {
            suspendedStudents++;
          }
          
          // Vérification des 3 slots de prêt
          for (let i = 1; i <= 3; i++) {
            const etatKey = `Etat${i}`;
            const tabKey = `tabEtat${i}`;
            
            if (data[etatKey] === 'emprunt' || 
                (Array.isArray(data[tabKey]) && data[tabKey].length > 0 && data[tabKey][0])) {
              activeLoansCount++;
            }
          }
        });

        console.log('📤 Prêts actifs:', activeLoansCount);

        setStats(prev => ({ 
          ...prev, 
          totalUsers: snapshot.size, 
          activeLoans: activeLoansCount, 
          suspendedStudents,
          rotationRate: calculateRotation(activeLoansCount, prev.totalBooks)
        }));
      },
      (error) => {
        console.error('❌ Erreur lors de la récupération des utilisateurs:', error);
      }
    );

    // 3. Configuration
    const unsubConfig = onSnapshot(
      doc(db, 'Configuration', 'OrgSettings'), 
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          console.log('⚙️ Configuration chargée:', docSnapshot.data());
          setOrgSettings(docSnapshot.data() as OrgSettings);
        } else {
          console.warn('⚠️ Document OrgSettings introuvable');
          setOrgSettings({});
        }
        setLoading(false);
      },
      (error) => {
        console.error('❌ Erreur lors de la récupération de la configuration:', error);
        setLoading(false);
      }
    );

    // 4. Historique (Archives)
    const unsubHistory = onSnapshot(
      doc(db, 'ArchivesBiblio', 'Arch'), 
      (docSnapshot) => {
        if (!docSnapshot.exists()) {
          console.warn('⚠️ Document Archives introuvable');
          return;
        }
        
        const data = docSnapshot.data();
        const archives = data.tableauArchives || [];
        console.log('📜 Archives trouvées:', archives.length);
        
        const today = new Date();
        const activityDays = [0, 0, 0, 0, 0, 0, 0];
        const borrowCountByBook: Record<string, number> = {};
        let monthlyLoansCount = 0;
        
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        archives.forEach((entry: any) => {
          if (!entry.heure) return;
          
          const date = new Date(entry.heure);
          if (isNaN(date.getTime())) return;

          // Comptage mensuel
          if (date >= startOfMonth) monthlyLoansCount++;

          // Activité 7 derniers jours
          const diffTime = Math.abs(today.getTime() - date.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays >= 0 && diffDays <= 7) {
            const dayIndex = (date.getDay() + 6) % 7; // Lundi = 0
            activityDays[dayIndex]++;
          }

          // Comptage emprunts par livre
          if (entry.nomDoc) {
            const bookId = entry.nomDoc.split(' - ')[0] || entry.nomDoc;
            borrowCountByBook[bookId] = (borrowCountByBook[bookId] || 0) + 1;
          }
        });

        console.log('📊 Activité hebdomadaire:', activityDays);
        console.log('📅 Emprunts mensuels:', monthlyLoansCount);

        // Reconstitution Top Borrowed
        const bookMetadata = (window as any).__bookBorrowCount || {};
        const topBorrowedBooks = Object.entries(borrowCountByBook)
          .map(([bookId, count]) => ({
            title: bookMetadata[bookId]?.title || bookId,
            category: bookMetadata[bookId]?.category || 'Non classé',
            count: count as number
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        console.log('🏆 Top livres empruntés:', topBorrowedBooks);

        setStats(prev => ({ 
          ...prev, 
          recentActivity: activityDays, 
          monthlyLoans: monthlyLoansCount, 
          topBorrowedBooks 
        }));
      },
      (error) => {
        console.error('❌ Erreur lors de la récupération de l\'historique:', error);
      }
    );

    // Nettoyage
    return () => { 
      console.log('🧹 Nettoyage des listeners');
      unsubBooks(); 
      unsubUsers(); 
      unsubConfig(); 
      unsubHistory(); 
    };
  }, []);

  return { stats, orgSettings, loading };
}