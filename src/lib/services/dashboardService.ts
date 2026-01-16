import { db } from '@/lib/firebase';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp 
} from 'firebase/firestore';

export class DashboardService {
  
  // 📚 Récupérer les statistiques globales
  static async getGlobalStats() {
    try {
      // Compter les livres
      const booksSnapshot = await getDocs(collection(db, 'Books'));
      const totalBooks = booksSnapshot.size;

      // Compter les utilisateurs
      const usersSnapshot = await getDocs(collection(db, 'Users'));
      const totalUsers = usersSnapshot.size;

      // Compter les prêts actifs
      const activeLoansQuery = query(
        collection(db, 'Loans'),
        where('status', '==', 'active')
      );
      const activeLoansSnapshot = await getDocs(activeLoansQuery);
      const activeLoans = activeLoansSnapshot.size;

      // Compter les retards
      const now = Timestamp.now();
      const overdueQuery = query(
        collection(db, 'Loans'),
        where('status', '==', 'active'),
        where('dueDate', '<', now)
      );
      const overdueSnapshot = await getDocs(overdueQuery);
      const overdueBooks = overdueSnapshot.size;

      // Compter les bibliothécaires
      const librariansQuery = query(
        collection(db, 'Users'),
        where('role', '==', 'librarian')
      );
      const librariansSnapshot = await getDocs(librariansQuery);
      const librarians = librariansSnapshot.size;

      return {
        totalBooks,
        totalUsers,
        activeLoans,
        overdueBooks,
        librarians,
        storageUsed: '2.4 GB' // À calculer selon tes besoins
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des stats:', error);
      throw error;
    }
  }

  // 📈 Calculer les tendances (croissance)
  static async getTrends() {
    try {
      const now = new Date();
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);

      // Livres ajoutés ce mois
      const booksThisMonthQuery = query(
        collection(db, 'Books'),
        where('createdAt', '>=', Timestamp.fromDate(lastMonth))
      );
      const booksThisMonth = (await getDocs(booksThisMonthQuery)).size;

      // Livres ajoutés le mois dernier
      const booksLastMonthQuery = query(
        collection(db, 'Books'),
        where('createdAt', '>=', Timestamp.fromDate(twoMonthsAgo)),
        where('createdAt', '<', Timestamp.fromDate(lastMonth))
      );
      const booksLastMonth = (await getDocs(booksLastMonthQuery)).size;

      // Calculer la croissance
      const booksGrowth = booksLastMonth > 0 
        ? ((booksThisMonth - booksLastMonth) / booksLastMonth * 100).toFixed(1)
        : 0;

      // Répéter pour users et loans...
      // (même logique)

      return {
        booksGrowth: parseFloat(booksGrowth),
        usersGrowth: 8.3, // À calculer
        loansGrowth: 15.7, // À calculer
        overdueReduction: -3.2 // À calculer
      };
    } catch (error) {
      console.error('Erreur calcul des tendances:', error);
      throw error;
    }
  }

  // 📊 Tendances mensuelles (6 derniers mois)
  static async getMonthlyTrends() {
    try {
      const trends = [];
      const now = new Date();

      for (let i = 5; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

        // Compter users créés ce mois
        const usersQuery = query(
          collection(db, 'Users'),
          where('createdAt', '>=', Timestamp.fromDate(monthDate)),
          where('createdAt', '<', Timestamp.fromDate(nextMonth))
        );
        const users = (await getDocs(usersQuery)).size;

        // Compter livres ajoutés ce mois
        const booksQuery = query(
          collection(db, 'Books'),
          where('createdAt', '>=', Timestamp.fromDate(monthDate)),
          where('createdAt', '<', Timestamp.fromDate(nextMonth))
        );
        const books = (await getDocs(booksQuery)).size;

        // Compter prêts ce mois
        const loansQuery = query(
          collection(db, 'Loans'),
          where('loanDate', '>=', Timestamp.fromDate(monthDate)),
          where('loanDate', '<', Timestamp.fromDate(nextMonth))
        );
        const loans = (await getDocs(loansQuery)).size;

        trends.push({
          month: monthDate.toLocaleDateString('fr-FR', { month: 'short' }),
          users,
          books,
          loans
        });
      }

      return trends;
    } catch (error) {
      console.error('Erreur tendances mensuelles:', error);
      throw error;
    }
  }

  // 🏷️ Performance par catégorie
  static async getCategoryPerformance() {
    try {
      const booksSnapshot = await getDocs(collection(db, 'Books'));
      const loansSnapshot = await getDocs(collection(db, 'Loans'));

      // Grouper par catégorie
      const categories: Record<string, { books: number; loans: Set<string> }> = {};

      booksSnapshot.forEach(doc => {
        const book = doc.data();
        const category = book.category || 'Autres';
        
        if (!categories[category]) {
          categories[category] = { books: 0, loans: new Set() };
        }
        categories[category].books++;
      });

      loansSnapshot.forEach(doc => {
        const loan = doc.data();
        const bookId = loan.bookId;
        
        // Trouver la catégorie du livre
        const book = booksSnapshot.docs.find(b => b.id === bookId);
        if (book) {
          const category = book.data().category || 'Autres';
          if (categories[category]) {
            categories[category].loans.add(bookId);
          }
        }
      });

      // Convertir en array avec taux
      return Object.entries(categories).map(([name, data]) => ({
        name,
        books: data.books,
        loans: data.loans.size,
        rate: parseFloat(((data.loans.size / data.books) * 100).toFixed(1))
      }));
    } catch (error) {
      console.error('Erreur performance catégories:', error);
      throw error;
    }
  }

  // 🔧 État du système
  static async getSystemHealth() {
    try {
      const appSettings = await getDocs(collection(db, 'AppSettings'));
      const settings = appSettings.docs[0]?.data();

      return {
        uptime: '15 jours 8h', // À calculer depuis le dernier redémarrage
        lastBackup: 'Il y a 2h', // À récupérer depuis les logs
        databaseStatus: 'optimal',
        apiHealth: 98.5,
        version: settings?.AppVersion || '1.0.0'
      };
    } catch (error) {
      console.error('Erreur état système:', error);
      throw error;
    }
  }

  static async getGlobalStats() {
  const cached = CacheService.get('globalStats');
  if (cached) return cached;

  const stats = await /* récupération depuis Firebase */;
  CacheService.set('globalStats', stats);
  return stats;
}
}