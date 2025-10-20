# 🤖 Intégration N8N dans Admin - Roadmap

**Date**: 19 Octobre 2025  
**Objectif**: Permettre l'exécution et le monitoring des workflows N8N depuis l'interface admin

## 🎯 Fonctionnalités Demandées

### 1. Exécution de Workflow N8N
- Bouton dans l'admin pour exécuter `n8n/v2` workflow
- Sélection du workflow à exécuter
- Paramètres configurables (titre, sujet, keywords)
- Feedback en temps réel de l'exécution

### 2. Dashboard Statistiques Workflows
**Page Admin** : `/admin/workflows/stats`

**Métriques à afficher**:
- ✅ Workflows exécutés avec succès
- ❌ Workflows échoués (failed)
- 💰 Coût total des workflows
- 📊 Coût par workflow
- 👤 Workflows par utilisateur
- 📈 Tendances (graphiques)

### 3. Système de Reprise (Recovery)
**Problématique**: Éviter de payer 2 fois si une partie du workflow a réussi

**Solution**:
- Sauvegarder l'état du workflow à chaque étape
- Identifier quelle partie a échoué
- Reprendre uniquement la partie échouée
- Éviter de re-générer ce qui a déjà été fait

**États du workflow**:
```
PENDING → GENERATING_CONTENT → CONTENT_GENERATED → 
GENERATING_IMAGE → IMAGE_GENERATED → PUBLISHING → 
COMPLETED ✅ ou FAILED ❌
```

### 4. Tracking des Coûts
**Par workflow**:
- Coût OpenAI (GPT-4o, tokens utilisés)
- Coût StabilityAI (images générées)
- Coût total

**Par utilisateur**:
- Budget alloué
- Budget utilisé
- Budget restant
- Alerte si dépassement

## 🏗️ Architecture Proposée

### Backend - Nouvelles Tables PostgreSQL

#### Table: `workflow_executions`
```sql
CREATE TABLE workflow_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  workflow_type VARCHAR(50), -- 'article_generation', 'image_generation', etc.
  status VARCHAR(20), -- 'pending', 'running', 'completed', 'failed', 'partial'
  
  -- Paramètres d'entrée
  input_params JSONB, -- { title, keywords, category, etc. }
  
  -- Résultats intermédiaires (pour reprise)
  intermediate_data JSONB, -- { content, image_url, etc. }
  current_step VARCHAR(50), -- 'content_generation', 'image_generation', etc.
  
  -- Résultat final
  result_data JSONB, -- { article_id, image_ids, etc. }
  
  -- Coûts
  cost_openai DECIMAL(10, 4), -- En USD
  cost_stability DECIMAL(10, 4), -- En USD
  cost_total DECIMAL(10, 4), -- Total en USD
  tokens_used INTEGER,
  
  -- Erreurs
  error_message TEXT,
  error_step VARCHAR(50),
  retry_count INTEGER DEFAULT 0,
  
  -- Timestamps
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_workflow_user ON workflow_executions(user_id);
CREATE INDEX idx_workflow_status ON workflow_executions(status);
CREATE INDEX idx_workflow_created ON workflow_executions(created_at DESC);
```

#### Table: `user_budgets`
```sql
CREATE TABLE user_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) UNIQUE,
  
  -- Budget
  budget_monthly DECIMAL(10, 2), -- Budget mensuel en USD
  budget_used DECIMAL(10, 2) DEFAULT 0,
  budget_remaining DECIMAL(10, 2),
  
  -- Limites
  max_workflows_per_day INTEGER DEFAULT 10,
  workflows_today INTEGER DEFAULT 0,
  
  -- Période
  period_start DATE,
  period_end DATE,
  
  -- Alertes
  alert_threshold DECIMAL(5, 2) DEFAULT 80.00, -- Alerte à 80%
  alert_sent BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Table: `workflow_steps`
```sql
CREATE TABLE workflow_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id UUID REFERENCES workflow_executions(id),
  
  step_name VARCHAR(50), -- 'content_generation', 'image_generation', etc.
  step_order INTEGER,
  status VARCHAR(20), -- 'pending', 'running', 'completed', 'failed', 'skipped'
  
  -- Données de l'étape
  input_data JSONB,
  output_data JSONB,
  
  -- Coût de l'étape
  cost DECIMAL(10, 4),
  tokens_used INTEGER,
  
  -- Timing
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  duration_seconds INTEGER,
  
  -- Erreur
  error_message TEXT,
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_workflow_step_execution ON workflow_steps(execution_id);
CREATE INDEX idx_workflow_step_status ON workflow_steps(status);
```

### Backend - Nouveaux Endpoints API

#### POST /api/workflows/execute
```typescript
// Démarrer un nouveau workflow
POST /api/workflows/execute
{
  "workflowType": "article_generation_v2",
  "params": {
    "title": "Guide DevOps 2025",
    "keywords": ["docker", "kubernetes", "ci/cd"],
    "category": "DevOps",
    "language": "fr"
  }
}

Response:
{
  "executionId": "uuid",
  "status": "pending",
  "estimatedCost": 0.50
}
```

#### GET /api/workflows/executions
```typescript
// Lister toutes les exécutions
GET /api/workflows/executions?status=all&page=1&limit=10

Response:
{
  "data": [
    {
      "id": "uuid",
      "workflowType": "article_generation_v2",
      "status": "completed",
      "costTotal": 0.45,
      "startedAt": "2025-10-19T19:00:00Z",
      "completedAt": "2025-10-19T19:02:30Z",
      "duration": 150
    }
  ],
  "meta": { "page": 1, "total": 50 }
}
```

#### GET /api/workflows/executions/:id
```typescript
// Détails d'une exécution
GET /api/workflows/executions/uuid

Response:
{
  "id": "uuid",
  "workflowType": "article_generation_v2",
  "status": "completed",
  "inputParams": {...},
  "steps": [
    {
      "name": "content_generation",
      "status": "completed",
      "cost": 0.30,
      "tokensUsed": 2500,
      "duration": 45
    },
    {
      "name": "image_generation",
      "status": "completed",
      "cost": 0.15,
      "duration": 105
    }
  ],
  "result": {
    "articleId": "uuid",
    "articleSlug": "guide-devops-2025"
  },
  "costTotal": 0.45
}
```

#### POST /api/workflows/executions/:id/retry
```typescript
// Reprendre un workflow échoué
POST /api/workflows/executions/uuid/retry

Response:
{
  "executionId": "new-uuid",
  "status": "pending",
  "resumeFrom": "image_generation", // Reprend là où ça a échoué
  "reusedData": {
    "content": true, // On réutilise le contenu généré
    "image": false   // On va régénérer l'image
  }
}
```

#### GET /api/workflows/stats
```typescript
// Statistiques globales
GET /api/workflows/stats?period=month

Response:
{
  "totalExecutions": 150,
  "successful": 142,
  "failed": 8,
  "partial": 0,
  "successRate": 94.67,
  
  "costs": {
    "total": 67.50,
    "openai": 45.30,
    "stability": 22.20,
    "average": 0.45
  },
  
  "byUser": [
    {
      "userId": "uuid",
      "username": "hicham",
      "executions": 50,
      "costTotal": 22.50,
      "budgetUsed": 22.50,
      "budgetRemaining": 27.50
    }
  ],
  
  "byType": {
    "article_generation_v2": {
      "count": 100,
      "cost": 45.00
    },
    "image_generation": {
      "count": 50,
      "cost": 22.50
    }
  },
  
  "timeline": [
    { "date": "2025-10-19", "executions": 15, "cost": 6.75 },
    { "date": "2025-10-18", "executions": 12, "cost": 5.40 }
  ]
}
```

#### GET /api/users/budget
```typescript
// Budget de l'utilisateur connecté
GET /api/users/budget

Response:
{
  "userId": "uuid",
  "budgetMonthly": 50.00,
  "budgetUsed": 22.50,
  "budgetRemaining": 27.50,
  "budgetPercentage": 45.00,
  
  "limits": {
    "maxWorkflowsPerDay": 10,
    "workflowsToday": 3,
    "workflowsRemaining": 7
  },
  
  "period": {
    "start": "2025-10-01",
    "end": "2025-10-31"
  },
  
  "alert": {
    "threshold": 80.00,
    "alertSent": false,
    "willAlert": false
  }
}
```

### Frontend - Nouvelles Pages Admin

#### 1. Page: `/admin/workflows`
**Liste des workflows exécutés**

```tsx
// frontend/app/routes/admin/workflows/index.tsx
export default function AdminWorkflows() {
  return (
    <div>
      <h1>Workflows</h1>
      
      {/* Filtres */}
      <div>
        <select name="status">
          <option value="all">Tous</option>
          <option value="completed">Réussis</option>
          <option value="failed">Échoués</option>
          <option value="running">En cours</option>
        </select>
        
        <select name="type">
          <option value="all">Tous les types</option>
          <option value="article_generation_v2">Génération Article V2</option>
          <option value="image_generation">Génération Image</option>
        </select>
      </div>
      
      {/* Tableau */}
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Type</th>
            <th>Status</th>
            <th>Coût</th>
            <th>Durée</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {executions.map(exec => (
            <tr key={exec.id}>
              <td>{exec.id.slice(0, 8)}</td>
              <td>{exec.workflowType}</td>
              <td>
                <Badge color={exec.status === 'completed' ? 'green' : 'red'}>
                  {exec.status}
                </Badge>
              </td>
              <td>${exec.costTotal}</td>
              <td>{exec.duration}s</td>
              <td>{formatDate(exec.startedAt)}</td>
              <td>
                <button onClick={() => viewDetails(exec.id)}>Voir</button>
                {exec.status === 'failed' && (
                  <button onClick={() => retry(exec.id)}>Réessayer</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

#### 2. Page: `/admin/workflows/new`
**Créer un nouveau workflow**

```tsx
// frontend/app/routes/admin/workflows/new.tsx
export default function NewWorkflow() {
  return (
    <div>
      <h1>Nouveau Workflow</h1>
      
      <form onSubmit={handleSubmit}>
        <div>
          <label>Type de workflow</label>
          <select name="workflowType">
            <option value="article_generation_v2">
              Génération Article (V2) - ~$0.40
            </option>
            <option value="image_generation">
              Génération Image - ~$0.15
            </option>
          </select>
        </div>
        
        <div>
          <label>Titre de l'article</label>
          <input name="title" required />
        </div>
        
        <div>
          <label>Mots-clés (séparés par des virgules)</label>
          <input name="keywords" placeholder="docker, kubernetes, devops" />
        </div>
        
        <div>
          <label>Catégorie</label>
          <select name="category">
            <option value="devops">DevOps</option>
            <option value="development">Development</option>
            <option value="tutorial">Tutorial</option>
          </select>
        </div>
        
        <div>
          <label>Langue</label>
          <select name="language">
            <option value="fr">Français</option>
            <option value="en">English</option>
          </select>
        </div>
        
        <div className="cost-estimate">
          <p>Coût estimé: <strong>${estimatedCost}</strong></p>
          <p>Budget restant: <strong>${budgetRemaining}</strong></p>
        </div>
        
        <button type="submit" disabled={budgetRemaining < estimatedCost}>
          Lancer le workflow
        </button>
      </form>
    </div>
  );
}
```

#### 3. Page: `/admin/workflows/stats`
**Dashboard statistiques**

```tsx
// frontend/app/routes/admin/workflows/stats.tsx
export default function WorkflowStats() {
  return (
    <div>
      <h1>Statistiques Workflows</h1>
      
      {/* Cartes métriques */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <h3>Total Exécutés</h3>
          <p className="text-3xl">{stats.totalExecutions}</p>
        </Card>
        
        <Card>
          <h3>Taux de Succès</h3>
          <p className="text-3xl">{stats.successRate}%</p>
        </Card>
        
        <Card>
          <h3>Coût Total</h3>
          <p className="text-3xl">${stats.costs.total}</p>
        </Card>
        
        <Card>
          <h3>Budget Restant</h3>
          <p className="text-3xl">${budget.remaining}</p>
        </Card>
      </div>
      
      {/* Graphiques */}
      <div className="grid grid-cols-2 gap-4 mt-8">
        <Card>
          <h3>Exécutions par jour</h3>
          <LineChart data={stats.timeline} />
        </Card>
        
        <Card>
          <h3>Coûts par jour</h3>
          <BarChart data={stats.timeline} />
        </Card>
        
        <Card>
          <h3>Répartition par type</h3>
          <PieChart data={stats.byType} />
        </Card>
        
        <Card>
          <h3>Status des workflows</h3>
          <DoughnutChart 
            data={{
              successful: stats.successful,
              failed: stats.failed,
              running: stats.running
            }} 
          />
        </Card>
      </div>
      
      {/* Tableau détaillé par utilisateur */}
      <Card className="mt-8">
        <h3>Utilisation par Utilisateur</h3>
        <table>
          <thead>
            <tr>
              <th>Utilisateur</th>
              <th>Workflows</th>
              <th>Coût Total</th>
              <th>Budget Utilisé</th>
              <th>Budget Restant</th>
            </tr>
          </thead>
          <tbody>
            {stats.byUser.map(user => (
              <tr key={user.userId}>
                <td>{user.username}</td>
                <td>{user.executions}</td>
                <td>${user.costTotal}</td>
                <td>
                  <ProgressBar 
                    value={user.budgetUsed} 
                    max={user.budgetMonthly} 
                  />
                </td>
                <td>${user.budgetRemaining}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
```

#### 4. Page: `/admin/workflows/:id`
**Détails d'un workflow**

```tsx
// frontend/app/routes/admin/workflows/$id.tsx
export default function WorkflowDetails() {
  return (
    <div>
      <h1>Workflow #{execution.id.slice(0, 8)}</h1>
      
      {/* Status général */}
      <Card>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label>Status</label>
            <Badge color={getStatusColor(execution.status)}>
              {execution.status}
            </Badge>
          </div>
          
          <div>
            <label>Coût Total</label>
            <p className="text-2xl">${execution.costTotal}</p>
          </div>
          
          <div>
            <label>Durée</label>
            <p className="text-2xl">{execution.duration}s</p>
          </div>
        </div>
      </Card>
      
      {/* Timeline des étapes */}
      <Card className="mt-8">
        <h3>Progression</h3>
        <Timeline>
          {execution.steps.map(step => (
            <TimelineItem 
              key={step.name}
              status={step.status}
              title={step.name}
              subtitle={`${step.duration}s - $${step.cost}`}
            >
              {step.status === 'completed' && (
                <div>
                  <p>✅ Complété</p>
                  <p>Tokens: {step.tokensUsed}</p>
                </div>
              )}
              
              {step.status === 'failed' && (
                <div>
                  <p>❌ Échoué</p>
                  <p className="text-red-600">{step.errorMessage}</p>
                </div>
              )}
            </TimelineItem>
          ))}
        </Timeline>
      </Card>
      
      {/* Données d'entrée/sortie */}
      <div className="grid grid-cols-2 gap-4 mt-8">
        <Card>
          <h3>Paramètres d'entrée</h3>
          <pre className="bg-gray-100 p-4 rounded">
            {JSON.stringify(execution.inputParams, null, 2)}
          </pre>
        </Card>
        
        <Card>
          <h3>Résultat</h3>
          {execution.result && (
            <div>
              <p>Article ID: {execution.result.articleId}</p>
              <p>Slug: {execution.result.articleSlug}</p>
              <a href={`/blog/${execution.result.articleSlug}`}>
                Voir l'article →
              </a>
            </div>
          )}
        </Card>
      </div>
      
      {/* Actions */}
      {execution.status === 'failed' && (
        <Card className="mt-8 border-red-300">
          <h3>🔄 Reprendre le workflow</h3>
          <p>
            Le workflow a échoué à l'étape: <strong>{execution.errorStep}</strong>
          </p>
          <p>
            Vous pouvez reprendre uniquement cette étape pour économiser.
          </p>
          <button 
            onClick={() => retryWorkflow(execution.id)}
            className="btn btn-primary mt-4"
          >
            Reprendre uniquement l'étape échouée
          </button>
        </Card>
      )}
    </div>
  );
}
```

## 🔧 Système de Reprise Intelligent

### Logique de Reprise

```typescript
// backend/src/services/workflow-recovery.service.ts
export class WorkflowRecoveryService {
  async retryWorkflow(executionId: string): Promise<WorkflowExecution> {
    // 1. Récupérer l'exécution échouée
    const failedExecution = await prisma.workflowExecution.findUnique({
      where: { id: executionId },
      include: { steps: true }
    });
    
    // 2. Identifier l'étape qui a échoué
    const failedStep = failedExecution.steps.find(s => s.status === 'failed');
    
    // 3. Récupérer les données intermédiaires des étapes réussies
    const completedSteps = failedExecution.steps.filter(s => s.status === 'completed');
    const intermediateData = this.extractIntermediateData(completedSteps);
    
    // 4. Créer une nouvelle exécution qui reprend là où ça a échoué
    const newExecution = await prisma.workflowExecution.create({
      data: {
        userId: failedExecution.userId,
        workflowType: failedExecution.workflowType,
        status: 'pending',
        inputParams: failedExecution.inputParams,
        intermediateData, // ⚠️ IMPORTANT: On réutilise ce qui a fonctionné
        currentStep: failedStep.stepName,
        parentExecutionId: executionId // Lien avec l'exécution originale
      }
    });
    
    // 5. Lancer uniquement les étapes manquantes
    await this.executeWorkflowFromStep(newExecution, failedStep.stepName);
    
    return newExecution;
  }
  
  private extractIntermediateData(completedSteps: WorkflowStep[]) {
    const data: any = {};
    
    for (const step of completedSteps) {
      // Sauvegarder les outputs de chaque étape réussie
      if (step.stepName === 'content_generation' && step.outputData) {
        data.generatedContent = step.outputData.content;
        data.contentCost = step.cost; // On a déjà payé pour ça!
      }
      
      if (step.stepName === 'image_generation' && step.outputData) {
        data.generatedImageUrl = step.outputData.imageUrl;
        data.imageCost = step.cost;
      }
    }
    
    return data;
  }
  
  private async executeWorkflowFromStep(
    execution: WorkflowExecution, 
    startFromStep: string
  ) {
    const workflowSteps = this.getWorkflowSteps(execution.workflowType);
    const startIndex = workflowSteps.findIndex(s => s.name === startFromStep);
    
    // Exécuter uniquement les étapes à partir de celle qui a échoué
    for (let i = startIndex; i < workflowSteps.length; i++) {
      const step = workflowSteps[i];
      
      try {
        await this.executeStep(execution, step);
      } catch (error) {
        // Si ça échoue encore, sauvegarder l'erreur
        await this.markStepFailed(execution.id, step.name, error);
        throw error;
      }
    }
  }
}
```

### Exemple de Workflow avec Reprise

**Scénario**: L'utilisateur lance un workflow d'article

1. **Première exécution** (coût: $0.30)
   - ✅ Génération contenu → $0.30 (OpenAI GPT-4o)
   - ❌ Génération image → FAILED (StabilityAI timeout)
   - **Total payé**: $0.30

2. **Reprise** (coût: $0.15 au lieu de $0.45)
   - ⏭️ Génération contenu → **SKIP** (déjà fait, coût $0 !)
   - 🔄 Génération image → RETRY → ✅ Success ($0.15)
   - ✅ Publication article → Success
   - **Total payé**: $0.15 (économie de $0.30)

**Total final**: $0.45 au lieu de $0.75 (économie de 40%) 💰

## 📋 Plan d'Implémentation

### Phase 1: Backend API (2-3 jours)
- [ ] Créer migrations Prisma pour les 3 tables
- [ ] Implémenter endpoints `/api/workflows/*`
- [ ] Créer service de reprise (recovery)
- [ ] Ajouter tracking des coûts
- [ ] Tests unitaires

### Phase 2: Frontend Admin (2-3 jours)
- [ ] Page liste workflows
- [ ] Page nouveau workflow
- [ ] Page statistiques avec graphiques
- [ ] Page détails workflow
- [ ] Intégration hooks useWorkflows

### Phase 3: Intégration N8N (1-2 jours)
- [ ] Adapter workflow n8n/v2 pour API tracking
- [ ] Webhooks pour mises à jour en temps réel
- [ ] Tests d'intégration

### Phase 4: Monitoring & Alertes (1 jour)
- [ ] Système d'alertes budget
- [ ] Email notifications
- [ ] Dashboard temps réel

## 🎯 Prochaines Actions

1. **Créer les migrations Prisma**
   ```bash
   npx prisma migrate dev --name add_workflow_tracking
   ```

2. **Implémenter le premier endpoint**
   ```typescript
   POST /api/workflows/execute
   ```

3. **Créer la page admin de base**
   ```bash
   mkdir -p frontend/app/routes/admin/workflows
   ```

---

**Date de création**: 19 Octobre 2025  
**Estimation totale**: 6-9 jours de développement  
**ROI**: Économie de 30-50% sur les coûts d'échec de workflows
