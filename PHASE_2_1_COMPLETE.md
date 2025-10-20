# 🎉 Phase 2.1 COMPLETED - Database Schema N8N Workflows

**Date**: 19 Octobre 2025 ~ 20:30 UTC+2  
**Status**: ✅ **DÉPLOYÉ EN PRODUCTION**

---

## 📊 Résumé de la Phase 2.1

### Objectif
Créer le schéma de base de données pour le système de tracking des workflows N8N avec support de reprise intelligente et gestion des budgets utilisateurs.

### ✅ Réalisations

#### 1. Schéma Prisma Étendu
**Fichier modifié**: `backend-mern/prisma/schema.prisma`

**3 Nouveaux Modèles**:

**a) WorkflowExecution** (Tracking des exécutions)
- 17 champs principaux
- Relations: User, WorkflowStep, parent/retries
- Indexes: userId, workflowId, status, startedAt, parentId
- Fonctionnalités:
  - Tracking du status (PENDING, RUNNING, COMPLETED, FAILED, etc.)
  - Coûts détaillés (OpenAI, StabilityAI, total)
  - Système de retry avec parentId
  - Durée d'exécution
  - Données input/output en JSONB
  - Messages d'erreur et stack traces

**b) WorkflowStep** (Tracking granulaire par étape)
- 15 champs principaux
- Relation: WorkflowExecution
- Indexes: executionId, stepName, status
- Fonctionnalités:
  - Ordre d'exécution (stepOrder)
  - Type d'étape (API_CALL, AI_GENERATION, DATABASE_WRITE)
  - Coût par étape
  - Données intermédiaires (inputData, outputData)
  - Durée en millisecondes
  - Support retry par étape

**c) UserBudget** (Budget mensuel utilisateur)
- 14 champs principaux
- Relation: User (1-to-1)
- Indexes: userId, periodEnd
- Fonctionnalités:
  - Limite mensuelle ($50 USD par défaut)
  - Tracking dépenses (currentSpent)
  - Période mensuelle (periodStart, periodEnd)
  - Alertes configurables (80%, 90%, 100%)
  - Stats (totalExecutions, successfulRuns, failedRuns)

**2 Nouveaux Enums**:
- `WorkflowStatus`: 7 états (PENDING, RUNNING, COMPLETED, FAILED, PAUSED, CANCELLED, RETRYING)
- `StepStatus`: 5 états (PENDING, RUNNING, COMPLETED, FAILED, SKIPPED)

#### 2. Migration SQL
**Fichier**: `20251019182500_add_n8n_workflow_tracking/migration.sql` (134 lignes)

**Opérations exécutées**:
```sql
✅ CREATE TYPE "WorkflowStatus" (7 valeurs)
✅ CREATE TYPE "StepStatus" (5 valeurs)
✅ CREATE TABLE "workflow_executions" (25 colonnes)
✅ CREATE TABLE "workflow_steps" (18 colonnes)
✅ CREATE TABLE "user_budgets" (15 colonnes)
✅ CREATE INDEX workflow_executions_userId_idx
✅ CREATE INDEX workflow_executions_workflowId_idx
✅ CREATE INDEX workflow_executions_status_idx
✅ CREATE INDEX workflow_executions_startedAt_idx
✅ CREATE INDEX workflow_executions_parentId_idx
✅ CREATE INDEX workflow_steps_executionId_idx
✅ CREATE INDEX workflow_steps_stepName_idx
✅ CREATE INDEX workflow_steps_status_idx
✅ CREATE UNIQUE INDEX user_budgets_userId_key
✅ CREATE INDEX user_budgets_userId_idx
✅ CREATE INDEX user_budgets_periodEnd_idx
✅ ADD FOREIGN KEY workflow_executions → users
✅ ADD FOREIGN KEY workflow_executions → workflow_executions (parent)
✅ ADD FOREIGN KEY workflow_steps → workflow_executions
✅ ADD FOREIGN KEY user_budgets → users
```

**Migration appliquée avec succès** :
```bash
Applying migration `20251019182500_add_n8n_workflow_tracking`
All migrations have been successfully applied.
```

#### 3. Script d'Initialisation
**Fichier**: `backend-mern/src/init-user-budgets.ts` (70 lignes)

**Fonctionnalités**:
- Détecte les utilisateurs sans budget
- Crée un budget par défaut ($50/mois)
- Définit la période mensuelle
- Active les alertes par défaut

**Résultat d'exécution** :
```
🔄 Initialisation des budgets utilisateurs...
📊 1 utilisateurs trouvés sans budget
✅ Budget créé pour boujraf.hicham@gmail.com (hicham)

🎉 1 budgets initialisés avec succès !
💰 Budget mensuel par défaut: $50 USD
📅 Période: 10/19/2025 - 10/31/2025
```

---

## 🗄️ Structure de Base de Données

### Tables Créées

| Table | Lignes | Indexes | Relations |
|-------|--------|---------|-----------|
| `workflow_executions` | 0 | 5 | 4 FK |
| `workflow_steps` | 0 | 3 | 1 FK |
| `user_budgets` | 1 | 3 | 1 FK |

### Vérification Production
```bash
docker exec blog-postgres psql -U blog_user -d blog_mern -c '\dt'

 public | user_budgets        | table | blog_user ✅
 public | workflow_executions | table | blog_user ✅
 public | workflow_steps      | table | blog_user ✅
```

---

## 📈 Capacités du Système

### 1. Tracking Complet
- ✅ Suivi de chaque exécution de workflow
- ✅ Historique complet avec timestamps
- ✅ Statuts en temps réel
- ✅ Durées d'exécution précises

### 2. Gestion des Coûts
- ✅ Tracking par provider (OpenAI, StabilityAI)
- ✅ Coût total par exécution
- ✅ Coût par étape individuelle
- ✅ Budget mensuel par utilisateur
- ✅ Alertes de dépassement

### 3. Système de Reprise Intelligent
- ✅ Relation parent/child pour les retries
- ✅ Sauvegarde données intermédiaires (JSONB)
- ✅ Tracking des étapes complétées
- ✅ Support skip d'étapes déjà faites
- ✅ Max retries configurable (default: 3)

### 4. Audit et Debug
- ✅ Messages d'erreur détaillés
- ✅ Stack traces complets
- ✅ Input/output de chaque étape
- ✅ Historique des modifications (createdAt, updatedAt)

---

## 💾 Commits Effectués

### Commit 1: Schema Prisma
```
commit f795183
feat: Add N8N workflow tracking database schema

Phase 2.1: Database Schema Complete

New tables:
- workflow_executions: Track all N8N workflow runs
- workflow_steps: Granular tracking of each step
- user_budgets: Monthly budget tracking per user

Files changed: 2
Insertions: 318, Deletions: 94
```

### Commit 2: Fix Import Path
```
commit 5173c2b
fix: Correct import path in init-user-budgets.ts

Files changed: 1
Insertions: 1, Deletions: 1
```

---

## 🧪 Tests de Validation

### Test 1: Vérification Tables
```bash
✅ PASS - workflow_executions exists
✅ PASS - workflow_steps exists
✅ PASS - user_budgets exists
```

### Test 2: Initialisation Budgets
```bash
✅ PASS - 1 budget créé
✅ PASS - Montant: $50 USD
✅ PASS - Période définie
```

### Test 3: Relations Foreign Keys
```bash
✅ PASS - user_budgets → users
✅ PASS - workflow_executions → users
✅ PASS - workflow_executions → workflow_executions (parent)
✅ PASS - workflow_steps → workflow_executions
```

---

## 📊 Exemple de Données

### UserBudget (Admin)
```json
{
  "id": "...",
  "userId": "a5b32aa6-3b3d-4691-9b7f-49064258564a",
  "monthlyLimit": 50.0,
  "currentSpent": 0,
  "periodStart": "2025-10-19T20:30:00Z",
  "periodEnd": "2025-10-31T23:59:59Z",
  "alertAt80": true,
  "alertAt90": true,
  "alertAt100": true,
  "emailAlerts": true,
  "totalExecutions": 0,
  "successfulRuns": 0,
  "failedRuns": 0
}
```

### Exemple Workflow Execution (structure)
```typescript
{
  id: uuid,
  workflowId: "reddit-to-blog-v2",
  workflowName: "Reddit to Blog Article Generator",
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED" | ...,
  startedAt: Date,
  completedAt: Date | null,
  duration: number | null, // secondes
  inputData: { url: "https://reddit.com/r/...", ... },
  outputData: { article: {...}, images: [...], ... },
  openaiCost: 0.15,
  stabilityAiCost: 0.10,
  totalCost: 0.25,
  stepsTotal: 5,
  stepsCompleted: 5,
  stepsFailed: 0,
  retryCount: 0,
  parentId: null,
  userId: uuid,
  steps: WorkflowStep[]
}
```

---

## 🎯 Prochaine Phase: 2.2 - Backend API Services

### À Créer
1. **WorkflowExecutionService** (services/workflow-execution.service.ts)
   - `executeWorkflow(workflowId, inputData, userId)`
   - `trackStep(executionId, stepName, stepData)`
   - `calculateCost(provider, operation, data)`
   - `updateStatus(executionId, status)`

2. **WorkflowRecoveryService** (services/workflow-recovery.service.ts)
   - `saveIntermediateData(executionId, stepName, data)`
   - `resumeFromFailedStep(executionId)`
   - `skipCompletedSteps(steps[])`
   - `getRecoveryData(executionId)`

3. **BudgetService** (services/budget.service.ts)
   - `checkBudget(userId, estimatedCost)`
   - `deductCost(userId, actualCost)`
   - `sendAlert(userId, percentage)`
   - `resetMonthlyBudget(userId)`

### Estimation
- **Durée**: 2-3 heures
- **Lignes de code**: ~400-500 lignes
- **Fichiers créés**: 3

---

## ✅ Checklist Phase 2.1

- [x] Créer schema.prisma avec 3 nouveaux modèles
- [x] Créer 2 nouveaux enums (WorkflowStatus, StepStatus)
- [x] Générer migration SQL
- [x] Appliquer migration en production
- [x] Vérifier tables créées dans PostgreSQL
- [x] Créer script init-user-budgets.ts
- [x] Exécuter initialisation budgets
- [x] Vérifier budget admin créé
- [x] Commit et push sur GitHub
- [x] Documentation complète

**Status**: ✅ **100% COMPLETED**

---

**Temps total**: ~45 minutes  
**Prochaine session**: Phase 2.2 - Backend API Services  
**Objectif suivant**: Créer les 3 services principaux (Execution, Recovery, Budget)
