# Registre Cancer Thyroïde — Dossier CDT

Application **portable** de suivi des cancers différenciés de la thyroïde (CDT). 100 % local, hors-ligne, sans compte cloud. Disponible en :

- 🪟 **Windows portable** (un seul `.exe`, base SQLite à côté)
- 📱 **Android** (Capacitor + SQLite)
- 🍎 **iOS** (Capacitor + SQLite)
- 🌐 **Web/dev** (mémoire — pour tester rapidement, données non persistées)

Le formulaire est aligné sur la **Fiche Guide CDT** (38 champs, choix prédéfinis pour chaque champ catégoriel).

## Démarrage rapide

### Prérequis communs

- Node.js 20+
- npm

```bash
git clone https://github.com/Frejustedev/formsCPT.git
cd formsCPT
npm install
```

### 🪟 Windows — version portable

**Lancer en dev (HMR) :**

```bash
npm run electron:dev
```

Ouvre une fenêtre Electron qui charge `http://localhost:3000`. La base SQLite est créée dans `data/registre.db` à la racine du projet.

**Construire l'.exe portable :**

```bash
npm run electron:build
```

Sortie : `dist/RegistreCDT-1.0.0-portable.exe`. Copiez ce fichier dans `C:\` (ou sur clé USB). Au premier lancement, un dossier `data/` est créé à côté de l'.exe avec `registre.json` dedans (format JSON pour faciliter la sauvegarde et l'inspection). Pour sauvegarder, copiez ce fichier.

### 📱 Android

**Prérequis spécifiques :**
- [Android Studio](https://developer.android.com/studio)
- Un appareil ou émulateur Android

**Mise en place :**

```bash
npm install
npx cap add android
npm run mobile:android
```

Cela ouvre Android Studio. Construisez et installez sur un appareil avec ▶️. La base SQLite est dans le sandbox de l'app.

**Pour itérer après changements code :**

```bash
npm run mobile:sync
```

### 🍎 iOS

**Prérequis spécifiques :**
- macOS + Xcode 15+
- Un compte Apple Developer (gratuit pour test sur appareil)

**Mise en place :**

```bash
npm install
npx cap add ios
npm run mobile:ios
```

Xcode s'ouvre. Sélectionnez votre cible et lancez ▶️.

### 🌐 Web (dev rapide)

```bash
npm run dev
```

Ouvre http://localhost:3000 dans le navigateur. **Attention** : les données sont en mémoire, perdues à chaque rafraîchissement. Cible utile uniquement pour tester l'UI.

## Architecture

```
app/                    Pages Next.js (App Router, static export)
  layout.tsx            ErrorBoundary + DataProvider + Theme + AppShell
  page.tsx              Dashboard
  records/new           Création d'un dossier
  records/edit?id=xxx   Édition (query param, compatible static export)
  admin                 Panneau admin / sauvegarde / journal
  manifest.ts           Manifest PWA
components/
  AppShell, Dashboard, RecordForm, AdminPanel, EditRecordView
  DataProvider          Contexte unique d'accès aux données (sans auth)
  ErrorBoundary
electron/
  main.cjs              Process principal Electron + fenêtre + setup BDD
  preload.cjs           Bridge IPC (window.electronAPI)
  db.cjs                better-sqlite3 + IPC handlers
lib/
  schemas.ts            Zod + types + labels + RECORD_DEFAULTS
  options.ts            Constantes des choix prédéfinis
  wilayas.ts            58 wilayas algériennes
  db/
    types.ts            Interface DbAdapter
    memory.ts           Adapter en mémoire (web/dev)
    electron.ts         Adapter Electron (window.electronAPI)
    capacitor.ts        Adapter mobile (@capacitor-community/sqlite)
    index.ts            Sélection auto à l'exécution
public/
  sw.js                 Service worker (cache statique + runtime)
capacitor.config.ts     Config Capacitor (Android/iOS)
```

## Modèle de données — 38 champs

| Onglet | Champs |
|---|---|
| **Identification** | numeroDossier, nom, prenoms, sexe, ddn, wilaya |
| **Antécédents** | atcdFamCdt, atcdFamCancer, atcdPersCancer, ageDgc |
| **Tumeur** | cdt, variante, taille, ec, macroMicro, ev, evCount, mitoses, hgie, nse, filetNerv, r, t, n, m |
| **Traitement & Suivi** | chir, cg, tps, dgcI1, chirI1, nbreCures, actCum, suivi, rep2ans, rep5ans, rep10ans, dcd, dcdAge |

Tous les choix prédéfinis sont centralisés dans [lib/options.ts](lib/options.ts).

## Stockage des données

| Plateforme | Emplacement | Format | Sauvegarde |
|---|---|---|---|
| Windows portable | `data/registre.json` à côté de l'.exe | JSON atomique | Copier le `.json` |
| Android | Sandbox de l'app | SQLite (Capacitor) | Export JSON via panneau Admin |
| iOS | `Library/CapacitorDatabase/registre_cdt` | SQLite (Capacitor) | Export JSON via panneau Admin |
| Web | RAM | — | Pas persistant |

Le panneau **Administration** propose dans tous les cas :
- Export Excel global de tous les dossiers
- Export JSON complet (sauvegarde)
- Import JSON (restauration sur une autre machine)
- Journal d'activité avec recherche

## Scripts npm

```bash
npm run dev                # Next.js dev (web)
npm run electron:dev       # Electron + Next dev concurrents
npm run electron:build     # Build .exe portable Windows
npm run electron:dir       # Build sans empaqueter (debug)
npm run mobile:sync        # next build + cap sync (Android + iOS)
npm run mobile:android     # next build + cap sync + cap open android
npm run mobile:ios         # next build + cap sync + cap open ios
npm run build              # next build (export statique)
npm run lint               # ESLint
npm run typecheck          # TypeScript --noEmit
npm test                   # Vitest
```

## Tests

- `tests/schemas.test.ts` — schéma Zod (enums, `numeroDossier`, `formatTNM`)
- `tests/db.test.ts` — contrat `DbAdapter` validé via le `MemoryAdapter`

## Audit-trail

Chaque modification d'un dossier crée un **snapshot** de l'état précédent dans la table `record_versions`. Les versions ne peuvent pas être éditées ou supprimées via l'API.

## Sécurité

- Aucun trafic réseau requis pour fonctionner (Internet utile uniquement pour les fonts Google au tout premier chargement)
- ErrorBoundary global qui empêche un crash de figer l'app
- Headers HTTP de sécurité en mode web (CSP, X-Frame-Options, Permissions-Policy)

## Licence

Privé — usage interne au registre.
