import { Router } from 'express';
import gameController from '@/controllers/gameController';

const router = Router();

// Create a new game
router.post('/', gameController.createGame);

// Get user's game history
router.get('/history', gameController.getGameHistory);

// Get games for a specific round
router.get('/round/:roundId', gameController.getGamesForRound);

// Get a specific game
router.get('/:gameId', gameController.getGame);

// Update game score
router.post('/:gameId/scores', gameController.updateGameScore);

// Complete a game
router.patch('/:gameId/complete', gameController.completeGame);

export default router;