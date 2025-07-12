/**
 * @file __tests__/sqliteDatabase.test.ts
 * @description Tests for SQLite database operations
 */

import SQLiteDatabase from '../sqliteDatabase';
import { Course, Hole, Round, Score } from '@/types';

// Mock react-native-nitro-sqlite
jest.mock('react-native-nitro-sqlite', () => ({
  open: jest.fn().mockResolvedValue({
    execute: jest.fn(),
    close: jest.fn(),
  }),
}));

describe('SQLiteDatabase', () => {
  let db: SQLiteDatabase;
  let mockDb: any;

  beforeEach(() => {
    db = SQLiteDatabase.getInstance();
    mockDb = {
      execute: jest.fn(),
      close: jest.fn(),
    };
    
    // Reset the mock
    jest.clearAllMocks();
  });

  describe('Course Operations', () => {
    test('should create and save a course', async () => {
      const mockCourse: Course = {
        id: 'test-course-1',
        name: 'Test Golf Course',
        location: 'Test Location',
        createdAt: '2025-01-11T18:00:00Z',
        updatedAt: '2025-01-11T18:00:00Z',
        holes: [
          {
            id: 'hole-1',
            courseId: 'test-course-1',
            number: 1,
            par: 4,
            name: 'Hole 1',
            createdAt: '2025-01-11T18:00:00Z',
            updatedAt: '2025-01-11T18:00:00Z',
          }
        ]
      };

      // Mock successful database operations
      mockDb.execute
        .mockResolvedValueOnce({ rows: { _array: [] } }) // Check if exists
        .mockResolvedValueOnce({}) // Insert course
        .mockResolvedValueOnce({ rows: { _array: [] } }) // Check hole exists
        .mockResolvedValueOnce({}); // Insert hole

      // Set up the database instance with mocked db
      (db as any).db = mockDb;
      (db as any).isInitialized = true;

      const result = await db.saveCourse(mockCourse, false);

      expect(result).toEqual(expect.objectContaining({
        name: 'Test Golf Course',
        location: 'Test Location',
      }));
      
      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO courses'),
        expect.any(Array)
      );
    });

    test('should retrieve courses', async () => {
      const mockRows = [
        {
          id: 'course-1',
          name: 'Test Course',
          location: 'Test Location',
          created_by: 'user-1',
          created_at: '2025-01-11T18:00:00Z',
          updated_at: '2025-01-11T18:00:00Z',
          hole_count: 18,
          round_count: 5,
        }
      ];

      mockDb.execute
        .mockResolvedValueOnce({ rows: { _array: mockRows } }) // Get courses
        .mockResolvedValueOnce({ rows: { _array: [] } }); // Get holes

      (db as any).db = mockDb;
      (db as any).isInitialized = true;

      const courses = await db.getCourses();

      expect(courses).toHaveLength(1);
      expect(courses[0]).toEqual(expect.objectContaining({
        id: 'course-1',
        name: 'Test Course',
        location: 'Test Location',
      }));
    });
  });

  describe('Round Operations', () => {
    test('should create and save a round', async () => {
      const mockRound: Round = {
        id: 'test-round-1',
        courseId: 'test-course-1',
        playerId: 'test-player-1',
        status: 'active',
        tees: 'Regular',
        startedAt: '2025-01-11T18:00:00Z',
        createdAt: '2025-01-11T18:00:00Z',
        updatedAt: '2025-01-11T18:00:00Z',
      };

      mockDb.execute
        .mockResolvedValueOnce({ rows: { _array: [] } }) // Check if exists
        .mockResolvedValueOnce({}); // Insert round

      (db as any).db = mockDb;
      (db as any).isInitialized = true;

      const result = await db.saveRound(mockRound, false);

      expect(result).toEqual(expect.objectContaining({
        courseId: 'test-course-1',
        playerId: 'test-player-1',
        status: 'active',
      }));
    });
  });

  describe('Score Operations', () => {
    test('should save a score', async () => {
      const mockScore: Score = {
        id: 'test-score-1',
        roundId: 'test-round-1',
        holeId: 'test-hole-1',
        strokes: 4,
        putts: 2,
        createdAt: '2025-01-11T18:00:00Z',
        updatedAt: '2025-01-11T18:00:00Z',
      };

      mockDb.execute
        .mockResolvedValueOnce({ rows: { _array: [] } }) // Check if exists
        .mockResolvedValueOnce({}); // Insert score

      (db as any).db = mockDb;
      (db as any).isInitialized = true;

      const result = await db.saveScore(mockScore, false);

      expect(result).toEqual(expect.objectContaining({
        roundId: 'test-round-1',
        holeId: 'test-hole-1',
        strokes: 4,
        putts: 2,
      }));
    });
  });

  describe('Offline Operations', () => {
    test('should queue operations for offline sync', async () => {
      const mockCourse: Course = {
        id: 'test-course-offline',
        name: 'Offline Course',
        createdAt: '2025-01-11T18:00:00Z',
        updatedAt: '2025-01-11T18:00:00Z',
      };

      mockDb.execute
        .mockResolvedValueOnce({ rows: { _array: [] } }) // Check if exists
        .mockResolvedValueOnce({}) // Insert course
        .mockResolvedValueOnce({}); // Queue offline operation

      (db as any).db = mockDb;
      (db as any).isInitialized = true;

      const result = await db.saveCourse(mockCourse, true); // isOffline = true

      expect(result).toEqual(expect.objectContaining({
        name: 'Offline Course',
      }));
      
      // Should have called to queue the offline operation
      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO offline_operations'),
        expect.any(Array)
      );
    });

    test('should retrieve offline operations', async () => {
      const mockOperations = [
        {
          id: 'op-1',
          type: 'insert',
          table_name: 'courses',
          data: '{"id":"course-1","name":"Test"}',
          timestamp: Date.now(),
          retry_count: 0,
        }
      ];

      mockDb.execute.mockResolvedValueOnce({ rows: { _array: mockOperations } });

      (db as any).db = mockDb;
      (db as any).isInitialized = true;

      const operations = await db.getOfflineOperations();

      expect(operations).toHaveLength(1);
      expect(operations[0]).toEqual(expect.objectContaining({
        id: 'op-1',
        type: 'insert',
        table: 'courses',
      }));
    });
  });

  describe('Database Initialization', () => {
    test('should initialize database and create tables', async () => {
      const { open } = require('react-native-nitro-sqlite');
      open.mockResolvedValueOnce(mockDb);

      // Mock table creation calls
      mockDb.execute.mockResolvedValue({});

      await db.initialize();

      expect(open).toHaveBeenCalledWith({
        name: 'golf.db',
        location: 'default',
      });
      
      // Should create all required tables
      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.stringContaining('CREATE TABLE IF NOT EXISTS courses')
      );
      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.stringContaining('CREATE TABLE IF NOT EXISTS holes')
      );
      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.stringContaining('CREATE TABLE IF NOT EXISTS rounds')
      );
      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.stringContaining('CREATE TABLE IF NOT EXISTS scores')
      );
    });
  });
});