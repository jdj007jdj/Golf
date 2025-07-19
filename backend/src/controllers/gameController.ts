import { Request, Response } from 'express';
import { prisma } from '@/config/database';
import { logger } from '@/utils/logger';

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    username: string;
    firstName?: string;
    lastName?: string;
    handicap?: number;
    profileImageUrl?: string;
    preferences: any;
  };
}

const gameController = {
  /**
   * Create a new game for a round
   */
  async createGame(req: AuthRequest, res: Response) {
    try {
      const { roundId, gameType, settings, participants } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated'
          }
        });
      }

      logger.info(`Creating game for round ${roundId}`);

      // Verify the user is part of this round
      const round = await prisma.round.findFirst({
        where: {
          id: roundId,
          participants: {
            some: {
              userId: userId
            }
          }
        },
        include: {
          participants: true
        }
      });

      if (!round) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'ROUND_NOT_FOUND',
            message: 'Round not found or you do not have access'
          }
        });
      }

      // Check if a game already exists for this round
      const existingGame = await prisma.game.findFirst({
        where: {
          roundId: roundId,
          status: 'active'
        }
      });

      if (existingGame) {
        return res.status(200).json({
          success: true,
          data: existingGame
        });
      }

      // Create the game
      const game = await prisma.game.create({
        data: {
          roundId,
          gameType,
          settings: settings || {},
          status: 'active'
        }
      });

      logger.info(`Game created with ID: ${game.id}`);

      return res.status(201).json({
        success: true,
        data: game
      });
    } catch (error) {
      logger.error('Error creating game:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create game'
        }
      });
    }
  },

  /**
   * Get game by ID
   */
  async getGame(req: AuthRequest, res: Response) {
    try {
      const { gameId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated'
          }
        });
      }

      const game = await prisma.game.findFirst({
        where: {
          id: gameId,
          round: {
            participants: {
              some: {
                userId: userId
              }
            }
          }
        },
        include: {
          round: {
            include: {
              participants: {
                include: {
                  user: {
                    select: {
                      id: true,
                      firstName: true,
                      lastName: true,
                      email: true
                    }
                  }
                }
              }
            }
          },
          gameScores: {
            orderBy: {
              holeNumber: 'asc'
            }
          }
        }
      });

      if (!game) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'GAME_NOT_FOUND',
            message: 'Game not found'
          }
        });
      }

      return res.status(200).json({
        success: true,
        data: game
      });
    } catch (error) {
      logger.error('Error fetching game:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch game'
        }
      });
    }
  },

  /**
   * Update game scores
   */
  async updateGameScore(req: AuthRequest, res: Response) {
    try {
      const { gameId } = req.params;
      const { roundParticipantId, holeNumber, scoreData } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated'
          }
        });
      }

      // Verify the user has access to this game
      const game = await prisma.game.findFirst({
        where: {
          id: gameId,
          round: {
            participants: {
              some: {
                userId: userId
              }
            }
          }
        },
        include: {
          round: {
            include: {
              participants: true
            }
          }
        }
      });

      if (!game) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'GAME_NOT_FOUND',
            message: 'Game not found or you do not have access'
          }
        });
      }

      // Verify the participant exists in this round
      const participantExists = game.round.participants.some(
        (p: any) => p.id === roundParticipantId
      );

      if (!participantExists) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PARTICIPANT',
            message: 'Participant not found in this round'
          }
        });
      }

      // Upsert the game score
      const gameScore = await prisma.gameScore.upsert({
        where: {
          gameId_roundParticipantId_holeNumber: {
            gameId,
            roundParticipantId,
            holeNumber
          }
        },
        update: {
          scoreData: scoreData || {}
        },
        create: {
          gameId,
          roundParticipantId,
          holeNumber,
          scoreData: scoreData || {}
        }
      });

      logger.info(`Game score updated for game ${gameId}, hole ${holeNumber}`);

      return res.status(200).json({
        success: true,
        data: gameScore
      });
    } catch (error) {
      logger.error('Error updating game score:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update game score'
        }
      });
    }
  },

  /**
   * Get games for a round
   */
  async getGamesForRound(req: AuthRequest, res: Response) {
    try {
      const { roundId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated'
          }
        });
      }

      // Verify the user has access to this round
      const round = await prisma.round.findFirst({
        where: {
          id: roundId,
          participants: {
            some: {
              userId: userId
            }
          }
        }
      });

      if (!round) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'ROUND_NOT_FOUND',
            message: 'Round not found or you do not have access'
          }
        });
      }

      const games = await prisma.game.findMany({
        where: {
          roundId: roundId
        },
        include: {
          gameScores: {
            orderBy: {
              holeNumber: 'asc'
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return res.status(200).json({
        success: true,
        data: games
      });
    } catch (error) {
      logger.error('Error fetching games for round:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch games'
        }
      });
    }
  },

  /**
   * Complete a game
   */
  async completeGame(req: AuthRequest, res: Response) {
    try {
      const { gameId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated'
          }
        });
      }

      // Verify the user has access to this game
      const game = await prisma.game.findFirst({
        where: {
          id: gameId,
          round: {
            participants: {
              some: {
                userId: userId
              }
            }
          }
        }
      });

      if (!game) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'GAME_NOT_FOUND',
            message: 'Game not found or you do not have access'
          }
        });
      }

      // Update game status to completed
      const updatedGame = await prisma.game.update({
        where: {
          id: gameId
        },
        data: {
          status: 'completed'
        }
      });

      logger.info(`Game ${gameId} marked as completed`);

      return res.status(200).json({
        success: true,
        data: updatedGame
      });
    } catch (error) {
      logger.error('Error completing game:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to complete game'
        }
      });
    }
  },

  /**
   * Get user's game history
   */
  async getGameHistory(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { limit = '50', offset = '0' } = req.query;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated'
          }
        });
      }

      const games = await prisma.game.findMany({
        where: {
          round: {
            participants: {
              some: {
                userId: userId
              }
            }
          },
          status: 'completed'
        },
        include: {
          round: {
            include: {
              course: {
                select: {
                  id: true,
                  name: true
                }
              },
              participants: {
                include: {
                  user: {
                    select: {
                      id: true,
                      firstName: true,
                      lastName: true
                    }
                  }
                }
              }
            }
          },
          gameScores: {
            orderBy: {
              holeNumber: 'asc'
            }
          }
        },
        orderBy: {
          updatedAt: 'desc'
        },
        take: parseInt(limit as string),
        skip: parseInt(offset as string)
      });

      return res.status(200).json({
        success: true,
        data: games
      });
    } catch (error) {
      logger.error('Error fetching game history:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch game history'
        }
      });
    }
  }
};

export default gameController;