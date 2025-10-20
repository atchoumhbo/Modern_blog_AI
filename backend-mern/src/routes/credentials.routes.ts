import { Router } from 'express';
import { credentialsController } from '../controllers/credentials.controller';
import { authenticateJWT } from '../middlewares/auth';

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(authenticateJWT);

/**
 * @route   POST /api/credentials
 * @desc    Créer ou mettre à jour un credential
 * @access  Private
 */
router.post('/', (req, res) => credentialsController.upsertCredential(req, res));

/**
 * @route   GET /api/credentials
 * @desc    Lister tous les credentials de l'utilisateur
 * @access  Private
 */
router.get('/', (req, res) => credentialsController.listCredentials(req, res));

/**
 * @route   GET /api/credentials/services
 * @desc    Lister les services disponibles
 * @access  Private
 */
router.get('/services', (req, res) => credentialsController.listServices(req, res));

/**
 * @route   GET /api/credentials/:service/schema
 * @desc    Obtenir le schéma des champs requis pour un service
 * @access  Private
 */
router.get('/:service/schema', (req, res) => credentialsController.getCredentialSchema(req, res));

/**
 * @route   GET /api/credentials/:service
 * @desc    Récupérer un credential spécifique (sans données sensibles)
 * @access  Private
 */
router.get('/:service', (req, res) => credentialsController.getCredential(req, res));

/**
 * @route   PATCH /api/credentials/:service/toggle
 * @desc    Activer/Désactiver un credential
 * @access  Private
 */
router.patch('/:service/toggle', (req, res) => credentialsController.toggleCredential(req, res));

/**
 * @route   DELETE /api/credentials/:service
 * @desc    Supprimer un credential
 * @access  Private
 */
router.delete('/:service', (req, res) => credentialsController.deleteCredential(req, res));

export default router;
