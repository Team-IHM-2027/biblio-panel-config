import { doc, updateDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { OrgSettings } from '@/types/dashboard';

export function useAdminActions() {
  
  // Cette fonction met à jour les paramètres ET notifie la bibliothécaire si nécessaire
  const updateSettingsAndNotify = async (currentSettings: OrgSettings, newSettings: Partial<OrgSettings>) => {
    try {
      // 1. Mise à jour de la configuration technique
      const configRef = doc(db, 'Configuration', 'OrgSettings');
      await updateDoc(configRef, newSettings);

      // 2. Détection des changements critiques pour alerte
      const alerts = [];

      // A. Mode Maintenance
      if (newSettings.MaintenanceMode !== undefined && newSettings.MaintenanceMode !== currentSettings.MaintenanceMode) {
        alerts.push({
          title: "Changement Mode Maintenance",
          message: `Le mode maintenance a été ${newSettings.MaintenanceMode ? 'ACTIVÉ' : 'DÉSACTIVÉ'} par l'administrateur.`
        });
      }

      // B. Thème (Couleurs)
      if (newSettings.Theme && JSON.stringify(newSettings.Theme) !== JSON.stringify(currentSettings.Theme)) {
        alerts.push({
          title: "Mise à jour Interface",
          message: "Les couleurs de l'interface utilisateur ont été modifiées."
        });
      }

      // C. Horaires
      if (newSettings.OpeningHours && JSON.stringify(newSettings.OpeningHours) !== JSON.stringify(currentSettings.OpeningHours)) {
        alerts.push({
          title: "Modification Horaires",
          message: "L'emploi du temps de la bibliothèque a été mis à jour."
        });
      }

      // 3. Envoi des alertes dans une collection 'SystemAlerts' (La bibliothécaire écoutera cette collection)
      if (alerts.length > 0) {
        const alertsRef = collection(db, 'SystemAlerts');
        for (const alert of alerts) {
          await addDoc(alertsRef, {
            ...alert,
            targetRole: 'librarian', // Pour filtrer côté bibliothécaire
            read: false,
            createdAt: serverTimestamp(),
            type: 'technical_update'
          });
        }
      }

    } catch (error) {
      console.error("Erreur lors de la mise à jour/notification:", error);
      throw error;
    }
  };

  return { updateSettingsAndNotify };
}