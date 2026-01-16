# 📚 Biblio Panel Config

Panel d’initialisation et de configuration pour un système de bibliothèque basé sur Firebase.
Ce projet fournit une interface complète pour paramétrer l’organisation, les règles, les horaires, les thèmes, et envoyer des alertes système.

## ✅ Fonctionnalités détaillées

### 🧭 Initialisation & configuration
- Flux guidé de configuration de l’organisation
- Chargement et mise à jour des paramètres Firestore
- Mise en place des documents de configuration

### 🛠️ Paramétrage organisationnel
- Nom, adresse, contacts
- Horaires d’ouverture par jour
- Paramètres de prêt
- Règles métier personnalisables

### 🎨 Thèmes & UI
- Thème clair/sombre
- Personnalisation des couleurs principales
- UI responsive et moderne

### 📁 Médias
- Upload d’images (logo, visuels)
- Intégration Cloudinary

### 🔔 Alertes système
- Envoi d’alertes lors des changements de configuration
- Création d’alertes ciblées (admin, bibliothécaire, client)
- Stockage en base dans la collection SystemAlerts

### ✅ Validation & robustesse
- Formulaires validés via React Hook Form + Zod
- Gestion d’erreurs claire côté UI

## 🧱 Stack technique
- **Next.js 15** (TypeScript)
- **Firebase / Firestore**
- **Cloudinary**
- **Tailwind CSS**
- **React Hook Form**
- **Zod**
- **Lucide React**

## 📋 Prérequis
- Node.js 18+ recommandé
- Compte Firebase (Firestore + Auth activés)
- Compte Cloudinary
- Accès au dépôt Git

## ⚙️ Installation

```bash
npm install
```

## 🔐 Configuration `.env.local`

Créer un fichier `.env.local` :

```env
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=...
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=...
```

> ⚠️ Ne jamais committer ce fichier.

## ▶️ Démarrage

```bash
npm run dev
```

Accès local : http://localhost:3000

## 🧪 Scripts utiles

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## 🗂️ Structure du projet

```
src/
  app/
    layout.tsx
    globals.css
    providers.tsx
    page.tsx
    login/page.tsx
    dashboard/page.tsx
    dashboard/advanced/
    profile/page.tsx
    setup/page.tsx

  components/
    ConfigurationPanel.tsx
    InitializationPanel.tsx
    SystemInitializer.tsx
    AdvancedSettingsPanel.tsx
    LoginPage.tsx
    LoginForm.tsx
    UserProfilePage.tsx
    ProtectedRoute.tsx
    AuthHeader.tsx
    DevTools.tsx
    ui/
      Button.tsx
      Card.tsx
      CloudinaryUpload.tsx
      Input.tsx
      LoadingSpinner.tsx
      Modal.tsx
      textarea.tsx

  contexts/
    notificationContext.tsx
    themeContext.tsx

  hooks/
    useAuth.ts
    useCloudinaryUpload.ts
    useNotificationHelpers.ts
    useSystemState.ts

  lib/
    firebase.ts
    alerts.ts
    utils.ts
    auth/adminAuth.ts
    database/initialization.ts
    debug/systemchecker.ts
    validation/schemas.ts

  types/
    cloudinary.ts

  utils/
    formatters.ts
```

## 🔔 Détails : Envoi d’alertes système

Lors d’une mise à jour de configuration, le panel peut générer des alertes dans Firestore :

- **Collection** : `SystemAlerts`
- **Champs typiques** :
  - `title`
  - `message`
  - `type` (success/error/warning/info)
  - `targetRole` (admin / librarian / client)
  - `createdBy`
  - `read`
  - `createdAt`

Ces alertes permettent d’informer les utilisateurs concernés d’une modification importante.

## 🗄️ Collections Firestore

### Collections principales
- `admin`
- `BiblioAdmin`
- `BiblioBooks`
- `BiblioThesis`
- `BiblioUser`
- `Configuration`
- `Departements`
- `OnlineCourses`
- `SystemAlerts`

### Documents clés
- `Configuration/AppSettings`
- `Configuration/Notifications`
- `Configuration/OrgSettings`

## 🚀 Déploiement sur Vercel (détaillé)

1. Ouvrir https://vercel.com
2. **Add New → Project**
3. Sélectionner le dépôt
4. Choisir la branche ciblée
5. Renseigner les variables `.env.local` dans Vercel
6. Lancer le déploiement

> Chaque push sur la branche sélectionnée déclenche un nouveau build.

## 🔒 Sécurité & bonnes pratiques
- Validation stricte des formulaires
- Variables sensibles uniquement dans `.env.local`
- Règles Firestore recommandées côté backend

## 🧩 Roadmap
- Renforcer les règles Firestore
- Ajouter diagnostics système avancés
- Extension des alertes/notifications
