import { PrismaClient, WorkflowStatus, StepStatus } from '@prisma/client';
import axios, { AxiosInstance } from 'axios';
import { credentialsService } from './credentials.service';

const prisma = new PrismaClient();

/**
 * Service d'exécution des workflows N8N
 * Gère la communication avec l'API N8N et le tracking en DB
 */
export class WorkflowExecutorService {
  private n8nClient: AxiosInstance;
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = process.env.N8N_BASE_URL || 'http://localhost:5678';
    this.apiKey = process.env.N8N_API_KEY || '';

    this.n8nClient = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'X-N8N-API-KEY': this.apiKey,
        'Content-Type': 'application/json'
      },
      timeout: 30000 // 30 secondes
    });
  }

  /**
   * Lance un workflow N8N et crée l'exécution en DB
   */
  async executeWorkflow(
    userId: string,
    workflowName: string,
    inputData?: Record<string, any>
  ) {
    try {
      // 1. Récupérer les credentials de l'utilisateur
      const credentials = await this.getUserCredentials(userId);

      // 2. Trouver le workflow N8N par son nom
      const workflow = await this.findWorkflowByName(workflowName);
      if (!workflow) {
        throw new Error(`Workflow "${workflowName}" not found in N8N`);
      }

      // 3. Créer l'exécution en DB
      const execution = await prisma.workflowExecution.create({
        data: {
          userId,
          workflowId: workflow.id,
          workflowName: workflow.name,
          status: WorkflowStatus.PENDING,
          inputData: inputData || {},
          stepsTotal: this.countWorkflowSteps(workflow),
          stepsCompleted: 0,
          stepsFailed: 0
        }
      });

      // 4. Préparer les données pour N8N
      const n8nInput = {
        ...inputData,
        executionId: execution.id,
        userId,
        credentials: {
          reddit: credentials.reddit,
          openai: credentials.openai,
          stabilityAi: credentials.stabilityAi
        }
      };

      // 5. Lancer le workflow sur N8N (async)
      this.executeN8NWorkflow(workflow.id, n8nInput, execution.id)
        .catch(error => {
          console.error(`[WorkflowExecutor] Error executing workflow ${execution.id}:`, error);
        });

      return {
        executionId: execution.id,
        status: execution.status,
        workflowName: execution.workflowName,
        message: 'Workflow started successfully'
      };

    } catch (error: any) {
      console.error('[WorkflowExecutor] Error starting workflow:', error);
      throw new Error(`Failed to start workflow: ${error.message}`);
    }
  }

  /**
   * Exécute le workflow sur N8N et track la progression
   */
  private async executeN8NWorkflow(
    workflowId: string,
    inputData: Record<string, any>,
    executionId: string
  ) {
    try {
      // Mettre à jour le statut à RUNNING
      await prisma.workflowExecution.update({
        where: { id: executionId },
        data: {
          status: WorkflowStatus.RUNNING,
          startedAt: new Date()
        }
      });

      // Lancer le workflow sur N8N
      const response = await this.n8nClient.post(
        `/api/v1/workflows/${workflowId}/execute`,
        { data: inputData }
      );

      const n8nExecutionId = response.data.executionId;

      // Polling pour suivre l'exécution
      await this.pollN8NExecution(n8nExecutionId, executionId);

    } catch (error: any) {
      console.error(`[WorkflowExecutor] N8N execution error:`, error);
      
      // Marquer comme failed
      await prisma.workflowExecution.update({
        where: { id: executionId },
        data: {
          status: WorkflowStatus.FAILED,
          completedAt: new Date(),
          errorMessage: error.message,
          errorStack: error.stack
        }
      });
    }
  }

  /**
   * Poll l'exécution N8N pour mettre à jour le statut
   */
  private async pollN8NExecution(n8nExecutionId: string, executionId: string) {
    const maxAttempts = 60; // 5 minutes max (poll toutes les 5 secondes)
    let attempt = 0;

    while (attempt < maxAttempts) {
      try {
        // Récupérer le statut depuis N8N
        const response = await this.n8nClient.get(
          `/api/v1/executions/${n8nExecutionId}`
        );

        const n8nExecution = response.data;
        const status = n8nExecution.finished ? 
          (n8nExecution.data.resultData.error ? WorkflowStatus.FAILED : WorkflowStatus.COMPLETED) :
          WorkflowStatus.RUNNING;

        // Mettre à jour en DB
        await this.updateExecutionFromN8N(executionId, n8nExecution);

        // Si terminé, sortir de la boucle
        if (status === WorkflowStatus.COMPLETED || status === WorkflowStatus.FAILED) {
          break;
        }

        // Attendre 5 secondes avant le prochain poll
        await new Promise(resolve => setTimeout(resolve, 5000));
        attempt++;

      } catch (error: any) {
        console.error(`[WorkflowExecutor] Polling error:`, error);
        attempt++;
      }
    }

    // Si timeout
    if (attempt >= maxAttempts) {
      await prisma.workflowExecution.update({
        where: { id: executionId },
        data: {
          status: WorkflowStatus.FAILED,
          errorMessage: 'Workflow execution timeout (5 minutes)',
          completedAt: new Date()
        }
      });
    }
  }

  /**
   * Met à jour l'exécution depuis les données N8N
   */
  private async updateExecutionFromN8N(executionId: string, n8nExecution: any) {
    const isFinished = n8nExecution.finished;
    const hasError = n8nExecution.data?.resultData?.error;
    const executionData = n8nExecution.data;

    // Calculer les steps complétés
    const nodes = executionData?.executionData?.executed || {};
    const nodeNames = Object.keys(nodes);
    const stepsCompleted = nodeNames.filter(name => nodes[name]?.length > 0).length;
    const stepsFailed = nodeNames.filter(name => {
      const executions = nodes[name] || [];
      return executions.some((exec: any) => exec.error);
    }).length;

    // Calculer la durée
    const startTime = new Date(n8nExecution.startedAt).getTime();
    const endTime = isFinished ? new Date(n8nExecution.stoppedAt).getTime() : Date.now();
    const duration = Math.floor((endTime - startTime) / 1000); // en secondes

    // Statut final
    const status = isFinished ?
      (hasError ? WorkflowStatus.FAILED : WorkflowStatus.COMPLETED) :
      WorkflowStatus.RUNNING;

    // Mettre à jour l'exécution
    await prisma.workflowExecution.update({
      where: { id: executionId },
      data: {
        status,
        stepsCompleted,
        stepsFailed,
        duration,
        outputData: executionData?.resultData?.runData || {},
        errorMessage: hasError ? executionData.resultData.error.message : null,
        completedAt: isFinished ? new Date(n8nExecution.stoppedAt) : null
      }
    });

    // Créer/Mettre à jour les steps individuels
    await this.updateWorkflowSteps(executionId, executionData);
  }

  /**
   * Met à jour les steps individuels du workflow
   */
  private async updateWorkflowSteps(executionId: string, executionData: any) {
    if (!executionData?.executionData?.executed) return;

    const nodes = executionData.executionData.executed;
    let stepOrder = 0;

    for (const [nodeName, executions] of Object.entries(nodes)) {
      stepOrder++;
      
      const nodeExecutions = executions as any[];
      if (!nodeExecutions || nodeExecutions.length === 0) continue;

      const lastExecution = nodeExecutions[nodeExecutions.length - 1];
      const hasError = !!lastExecution.error;
      const status = hasError ? StepStatus.FAILED :
        lastExecution.data ? StepStatus.COMPLETED : StepStatus.RUNNING;

      // Upsert le step
      await prisma.workflowStep.upsert({
        where: {
          executionId_stepName: {
            executionId,
            stepName: nodeName
          }
        },
        update: {
          status,
          outputData: lastExecution.data?.main?.[0] || [],
          errorMessage: lastExecution.error?.message,
          completedAt: status === StepStatus.COMPLETED ? new Date() : null
        },
        create: {
          executionId,
          stepName: nodeName,
          stepOrder,
          stepType: lastExecution.node?.type || 'UNKNOWN',
          status,
          inputData: lastExecution.data?.main?.[0] || [],
          outputData: lastExecution.data?.main?.[0] || [],
          errorMessage: lastExecution.error?.message
        }
      });
    }
  }

  /**
   * Récupère les credentials d'un utilisateur
   */
  private async getUserCredentials(userId: string) {
    const [reddit, openai, stabilityAi] = await Promise.all([
      credentialsService.getDecryptedCredential(userId, 'REDDIT'),
      credentialsService.getDecryptedCredential(userId, 'OPENAI'),
      credentialsService.getDecryptedCredential(userId, 'STABILITY_AI')
    ]);

    return {
      reddit: reddit || {},
      openai: openai || {},
      stabilityAi: stabilityAi || {}
    };
  }

  /**
   * Trouve un workflow N8N par son nom
   */
  private async findWorkflowByName(workflowName: string) {
    try {
      const response = await this.n8nClient.get('/api/v1/workflows');
      const workflows = response.data.data || [];
      
      return workflows.find((w: any) => 
        w.name.toLowerCase().includes(workflowName.toLowerCase())
      );
    } catch (error: any) {
      console.error('[WorkflowExecutor] Error finding workflow:', error);
      return null;
    }
  }

  /**
   * Compte le nombre d'étapes dans un workflow
   */
  private countWorkflowSteps(workflow: any): number {
    return workflow.nodes?.length || 0;
  }

  /**
   * Liste tous les workflows disponibles sur N8N
   */
  async listAvailableWorkflows() {
    try {
      const response = await this.n8nClient.get('/api/v1/workflows');
      const workflows = response.data.data || [];
      
      return workflows.map((w: any) => ({
        id: w.id,
        name: w.name,
        active: w.active,
        tags: w.tags,
        nodes: w.nodes?.length || 0
      }));
    } catch (error: any) {
      console.error('[WorkflowExecutor] Error listing workflows:', error);
      return [];
    }
  }

  /**
   * Teste la connexion à N8N
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.n8nClient.get('/api/v1/workflows');
      return true;
    } catch (error) {
      console.error('[WorkflowExecutor] N8N connection failed:', error);
      return false;
    }
  }
}

export const workflowExecutorService = new WorkflowExecutorService();
