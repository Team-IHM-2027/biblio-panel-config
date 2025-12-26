// src/types/dashboard.ts

export interface OrgSettings {
  // Identité
  Name?: string;
  Address?: string;
  Logo?: string;
  
  // Configuration Technique & Visuelle
  MaintenanceMode?: boolean;
  Theme?: { Primary: string; Secondary: string };
  
  // Contact & Réseaux
  Contact?: {
    Email?: string;
    Phone?: string;
    WhatsApp?: string;
    Facebook?: string;
    Instagram?: string;
  };

  // Règles de gestion
  MaximumSimultaneousLoans?: number;
  DefaultLoanDuration?: number; // Nouveau (pris de AdvancedSettings)
  LateReturnPenalties?: string[]; // Nouveau
  SpecificBorrowingRules?: string[]; // Nouveau

  // Horaires
  OpeningHours?: Record<string, { open: string; close: string } | "closed">;
  
  [key: string]: any;
}

// On garde DashboardStats tel quel...
export interface DashboardStats {
  totalBooks: number;
  totalTheses: number;
  totalUsers: number;
  activeLoans: number;
  overdueBooks: number;
  popularCategories: { name: string; count: number; percentage: number }[];
  recentActivity: number[];
  recentLogs: any[];
  topBorrowedBooks: { title: string; category: string; count: number }[];
  monthlyLoans: number;
  rotationRate: number;
  availableExemplaires: number;
  totalBookExemplaires: number;
  suspendedStudents: number;
}

}