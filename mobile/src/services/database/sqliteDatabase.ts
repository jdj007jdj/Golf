import { open, NitroSQLiteConnection } from 'react-native-nitro-sqlite';
import { logger } from '@/utils/logger';
import { Course, Round, Score, Hole } from '@/types';

interface OfflineOperation {
  id: string;
  type: 'insert' | 'update' | 'delete';
  table: string;
  data: any;
  timestamp: number;
  retryCount: number;
}

class SQLiteDatabase {
  private static instance: SQLiteDatabase;
  private db: NitroSQLiteConnection | null = null;
  private isInitialized = false;

  static getInstance(): SQLiteDatabase {
    if (!SQLiteDatabase.instance) {
      SQLiteDatabase.instance = new SQLiteDatabase();
    }
    return SQLiteDatabase.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized && this.db) return;

    try {
      // Open SQLite database
      this.db = await open({
        name: 'golf.db',
        location: 'default', // Documents directory
      });

      // Create tables
      await this.createTables();
      
      this.isInitialized = true;
      logger.info('SQLite database initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize SQLite database:', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      // Courses table
      await this.db.execute(`
        CREATE TABLE IF NOT EXISTS courses (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          location TEXT,
          created_by TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          synced INTEGER DEFAULT 0
        )
      `);

      // Holes table
      await this.db.execute(`
        CREATE TABLE IF NOT EXISTS holes (
          id TEXT PRIMARY KEY,
          course_id TEXT NOT NULL,
          number INTEGER NOT NULL,
          par INTEGER NOT NULL,
          name TEXT,
          yardage INTEGER,
          latitude REAL,
          longitude REAL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          synced INTEGER DEFAULT 0,
          FOREIGN KEY (course_id) REFERENCES courses (id) ON DELETE CASCADE
        )
      `);

      // Rounds table
      await this.db.execute(`
        CREATE TABLE IF NOT EXISTS rounds (
          id TEXT PRIMARY KEY,
          course_id TEXT NOT NULL,
          player_id TEXT NOT NULL,
          status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
          tees TEXT,
          started_at TEXT NOT NULL,
          completed_at TEXT,
          weather TEXT,
          notes TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          synced INTEGER DEFAULT 0,
          FOREIGN KEY (course_id) REFERENCES courses (id) ON DELETE CASCADE
        )
      `);

      // Scores table
      await this.db.execute(`
        CREATE TABLE IF NOT EXISTS scores (
          id TEXT PRIMARY KEY,
          round_id TEXT NOT NULL,
          hole_id TEXT NOT NULL,
          strokes INTEGER NOT NULL CHECK (strokes > 0),
          putts INTEGER CHECK (putts >= 0),
          penalties INTEGER DEFAULT 0,
          notes TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          synced INTEGER DEFAULT 0,
          FOREIGN KEY (round_id) REFERENCES rounds (id) ON DELETE CASCADE,
          FOREIGN KEY (hole_id) REFERENCES holes (id) ON DELETE CASCADE,
          UNIQUE(round_id, hole_id)
        )
      `);

      // Offline operations queue table
      await this.db.execute(`
        CREATE TABLE IF NOT EXISTS offline_operations (
          id TEXT PRIMARY KEY,
          type TEXT NOT NULL CHECK (type IN ('insert', 'update', 'delete')),
          table_name TEXT NOT NULL,
          data TEXT NOT NULL,
          timestamp INTEGER NOT NULL,
          retry_count INTEGER DEFAULT 0,
          max_retries INTEGER DEFAULT 3,
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        )
      `);

      // Create indexes for performance
      await this.db.execute('CREATE INDEX IF NOT EXISTS idx_holes_course_id ON holes (course_id)');
      await this.db.execute('CREATE INDEX IF NOT EXISTS idx_holes_number ON holes (course_id, number)');
      await this.db.execute('CREATE INDEX IF NOT EXISTS idx_rounds_player ON rounds (player_id, started_at DESC)');
      await this.db.execute('CREATE INDEX IF NOT EXISTS idx_rounds_status ON rounds (status)');
      await this.db.execute('CREATE INDEX IF NOT EXISTS idx_scores_round ON scores (round_id)');
      await this.db.execute('CREATE INDEX IF NOT EXISTS idx_scores_hole ON scores (hole_id)');
      await this.db.execute('CREATE INDEX IF NOT EXISTS idx_offline_ops_timestamp ON offline_operations (timestamp)');

      logger.info('SQLite tables and indexes created successfully');
    } catch (error) {
      logger.error('Failed to create tables:', error);
      throw error;
    }
  }

  // Utility method to generate UUID
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // Helper to safely convert QueryResultRowItem to string
  private toStringOrUndefined(value: any): string | undefined {
    return value != null ? String(value) : undefined;
  }

  // Helper to safely convert QueryResultRowItem to string (required)
  private toString(value: any): string {
    return String(value || '');
  }

  // Helper to safely convert QueryResultRowItem to number
  private toNumberOrUndefined(value: any): number | undefined {
    return value != null ? Number(value) : undefined;
  }

  // Course operations
  async getCourses(): Promise<Course[]> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const result = await this.db.execute(`
        SELECT c.*, 
               COUNT(h.id) as hole_count,
               COUNT(r.id) as round_count
        FROM courses c
        LEFT JOIN holes h ON c.id = h.course_id
        LEFT JOIN rounds r ON c.id = r.course_id
        GROUP BY c.id
        ORDER BY c.name
      `);

      const courses: Course[] = [];
      
      // React-native-nitro-sqlite returns results in result.rows._array
      const rows = result.rows?._array || [];
      
      for (const row of rows) {
        const holes = await this.getHolesByCourse(String(row.id));
        courses.push({
          id: String(row.id),
          name: String(row.name),
          location: row.location ? String(row.location) : undefined,
          createdBy: row.created_by ? String(row.created_by) : undefined,
          createdAt: String(row.created_at),
          updatedAt: String(row.updated_at),
          holes,
          _count: {
            rounds: Number(row.round_count) || 0
          }
        });
      }

      return courses;
    } catch (error) {
      logger.error('Failed to get courses:', error);
      return [];
    }
  }

  async getCourse(id: string): Promise<Course | null> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const result = await this.db.execute(
        'SELECT * FROM courses WHERE id = ?',
        [id]
      );

      const rows = result.rows?._array || [];
      if (rows.length === 0) return null;

      const row = rows[0];
      const holes = await this.getHolesByCourse(id);

      return {
        id: String(row.id),
        name: String(row.name),
        location: row.location ? String(row.location) : undefined,
        createdBy: row.created_by ? String(row.created_by) : undefined,
        createdAt: String(row.created_at),
        updatedAt: String(row.updated_at),
        holes
      };
    } catch (error) {
      logger.error('Failed to get course:', error);
      return null;
    }
  }

  async saveCourse(course: Course, isOffline = false): Promise<Course> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const now = new Date().toISOString();
      const courseId = course.id || this.generateUUID();
      
      const courseToSave = {
        ...course,
        id: courseId,
        createdAt: course.createdAt || now,
        updatedAt: now,
      };

      // Check if course exists
      const existingResult = await this.db.execute(
        'SELECT id FROM courses WHERE id = ?',
        [courseId]
      );
      const existing = (existingResult.rows?._array || []).length > 0;
      
      if (existing) {
        // Update existing course
        await this.db.execute(`
          UPDATE courses 
          SET name = ?, location = ?, updated_at = ?, synced = ?
          WHERE id = ?
        `, [
          courseToSave.name,
          courseToSave.location || null,
          courseToSave.updatedAt,
          isOffline ? 0 : 1,
          courseId
        ]);
      } else {
        // Insert new course
        await this.db.execute(`
          INSERT INTO courses (id, name, location, created_by, created_at, updated_at, synced)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
          courseId,
          courseToSave.name,
          courseToSave.location || null,
          courseToSave.createdBy || null,
          courseToSave.createdAt,
          courseToSave.updatedAt,
          isOffline ? 0 : 1
        ]);
      }

      // Save holes if provided
      if (course.holes && course.holes.length > 0) {
        for (const hole of course.holes) {
          await this.saveHole({
            ...hole,
            courseId: courseId
          }, isOffline);
        }
      }

      // Queue for offline sync if needed
      if (isOffline) {
        await this.queueOfflineOperation({
          id: this.generateUUID(),
          type: existing ? 'update' : 'insert',
          table: 'courses',
          data: courseToSave,
          timestamp: Date.now(),
          retryCount: 0
        });
      }

      logger.info('Course saved to SQLite:', courseToSave.name);
      return courseToSave;
    } catch (error) {
      logger.error('Failed to save course:', error);
      throw error;
    }
  }

  // Hole operations
  async getHolesByCourse(courseId: string): Promise<Hole[]> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const result = await this.db.execute(
        'SELECT * FROM holes WHERE course_id = ? ORDER BY number ASC',
        [courseId]
      );

      const rows = result.rows?._array || [];
      return rows.map(row => ({
        id: String(row.id),
        courseId: String(row.course_id),
        number: Number(row.number),
        par: Number(row.par),
        name: row.name ? String(row.name) : undefined,
        yardage: row.yardage ? Number(row.yardage) : undefined,
        latitude: row.latitude ? Number(row.latitude) : undefined,
        longitude: row.longitude ? Number(row.longitude) : undefined,
        createdAt: String(row.created_at),
        updatedAt: String(row.updated_at)
      }));
    } catch (error) {
      logger.error('Failed to get holes:', error);
      return [];
    }
  }

  async saveHole(hole: Hole, isOffline = false): Promise<Hole> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const now = new Date().toISOString();
      const holeId = hole.id || this.generateUUID();
      
      const holeToSave = {
        ...hole,
        id: holeId,
        createdAt: hole.createdAt || now,
        updatedAt: now,
      };

      // Check if hole exists
      const existingResult = await this.db.execute(
        'SELECT id FROM holes WHERE id = ?',
        [holeId]
      );
      const existing = (existingResult.rows?._array || []).length > 0;

      if (existing) {
        // Update existing hole
        await this.db.execute(`
          UPDATE holes 
          SET course_id = ?, number = ?, par = ?, name = ?, yardage = ?, 
              latitude = ?, longitude = ?, updated_at = ?, synced = ?
          WHERE id = ?
        `, [
          holeToSave.courseId,
          holeToSave.number,
          holeToSave.par,
          holeToSave.name || null,
          holeToSave.yardage || null,
          holeToSave.latitude || null,
          holeToSave.longitude || null,
          holeToSave.updatedAt,
          isOffline ? 0 : 1,
          holeId
        ]);
      } else {
        // Insert new hole
        await this.db.execute(`
          INSERT INTO holes (id, course_id, number, par, name, yardage, latitude, longitude, created_at, updated_at, synced)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          holeId,
          holeToSave.courseId,
          holeToSave.number,
          holeToSave.par,
          holeToSave.name || null,
          holeToSave.yardage || null,
          holeToSave.latitude || null,
          holeToSave.longitude || null,
          holeToSave.createdAt,
          holeToSave.updatedAt,
          isOffline ? 0 : 1
        ]);
      }

      // Queue for offline sync if needed
      if (isOffline) {
        await this.queueOfflineOperation({
          id: this.generateUUID(),
          type: existing ? 'update' : 'insert',
          table: 'holes',
          data: holeToSave,
          timestamp: Date.now(),
          retryCount: 0
        });
      }

      return holeToSave;
    } catch (error) {
      logger.error('Failed to save hole:', error);
      throw error;
    }
  }

  // Round operations
  async getRounds(playerId?: string): Promise<Round[]> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      let query = `
        SELECT r.*, c.name as course_name, c.location as course_location
        FROM rounds r
        JOIN courses c ON r.course_id = c.id
      `;
      let params: any[] = [];

      if (playerId) {
        query += ' WHERE r.player_id = ?';
        params.push(playerId);
      }

      query += ' ORDER BY r.started_at DESC';

      const result = await this.db.execute(query, params);

      const rounds: Round[] = [];

      const rows = result.rows?._array || [];
      for (const row of rows) {
        const course = await this.getCourse(row.course_id);
        const scores = await this.getScoresByRound(row.id);

        rounds.push({
          id: row.id,
          courseId: row.course_id,
          playerId: row.player_id,
          status: row.status,
          tees: row.tees,
          startedAt: row.started_at,
          completedAt: row.completed_at,
          weather: row.weather,
          notes: row.notes,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          course: course || {
            id: row.course_id,
            name: row.course_name,
            location: row.course_location,
            holes: []
          },
          scores
        });
      }

      return rounds;
    } catch (error) {
      logger.error('Failed to get rounds:', error);
      return [];
    }
  }

  async saveRound(round: Round, isOffline = false): Promise<Round> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const now = new Date().toISOString();
      const roundId = round.id || this.generateUUID();
      
      const roundToSave = {
        ...round,
        id: roundId,
        createdAt: round.createdAt || now,
        updatedAt: now,
      };

      // Check if round exists
      const existingResult = await this.db.execute(
        'SELECT id FROM rounds WHERE id = ?',
        [roundId]
      );
      const existing = (existingResult.rows?._array || []).length > 0;

      if (existing) {
        // Update existing round
        await this.db.execute(`
          UPDATE rounds 
          SET course_id = ?, player_id = ?, status = ?, tees = ?, 
              started_at = ?, completed_at = ?, weather = ?, notes = ?, 
              updated_at = ?, synced = ?
          WHERE id = ?
        `, [
          roundToSave.courseId,
          roundToSave.playerId,
          roundToSave.status,
          roundToSave.tees || null,
          roundToSave.startedAt,
          roundToSave.completedAt || null,
          roundToSave.weather || null,
          roundToSave.notes || null,
          roundToSave.updatedAt,
          isOffline ? 0 : 1,
          roundId
        ]);
      } else {
        // Insert new round
        await this.db.execute(`
          INSERT INTO rounds (id, course_id, player_id, status, tees, started_at, completed_at, weather, notes, created_at, updated_at, synced)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          roundId,
          roundToSave.courseId,
          roundToSave.playerId,
          roundToSave.status,
          roundToSave.tees || null,
          roundToSave.startedAt,
          roundToSave.completedAt || null,
          roundToSave.weather || null,
          roundToSave.notes || null,
          roundToSave.createdAt,
          roundToSave.updatedAt,
          isOffline ? 0 : 1
        ]);
      }

      // Queue for offline sync if needed
      if (isOffline) {
        await this.queueOfflineOperation({
          id: this.generateUUID(),
          type: existing ? 'update' : 'insert',
          table: 'rounds',
          data: roundToSave,
          timestamp: Date.now(),
          retryCount: 0
        });
      }

      logger.info('Round saved to SQLite:', roundId);
      return roundToSave;
    } catch (error) {
      logger.error('Failed to save round:', error);
      throw error;
    }
  }

  // Score operations
  async getScoresByRound(roundId: string): Promise<Score[]> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const result = await this.db.execute(`
        SELECT s.*, h.number as hole_number, h.par as hole_par, h.name as hole_name
        FROM scores s
        JOIN holes h ON s.hole_id = h.id
        WHERE s.round_id = ?
        ORDER BY h.number ASC
      `, [roundId]);

      const rows = result.rows?._array || [];
      return rows.map(row => ({
        id: row.id,
        roundId: row.round_id,
        holeId: row.hole_id,
        strokes: row.strokes,
        putts: row.putts,
        penalties: row.penalties,
        notes: row.notes,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        hole: {
          id: row.hole_id,
          number: row.hole_number,
          par: row.hole_par,
          name: row.hole_name
        }
      }));
    } catch (error) {
      logger.error('Failed to get scores:', error);
      return [];
    }
  }

  async saveScore(score: Score, isOffline = false): Promise<Score> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const now = new Date().toISOString();
      const scoreId = score.id || this.generateUUID();
      
      const scoreToSave = {
        ...score,
        id: scoreId,
        createdAt: score.createdAt || now,
        updatedAt: now,
      };

      // Check if score exists for this round/hole combination
      const existingResult = await this.db.execute(
        'SELECT id FROM scores WHERE round_id = ? AND hole_id = ?',
        [scoreToSave.roundId, scoreToSave.holeId]
      );
      const existing = (existingResult.rows?._array || []).length > 0;

      if (existing) {
        // Update existing score
        await this.db.execute(`
          UPDATE scores 
          SET strokes = ?, putts = ?, penalties = ?, notes = ?, updated_at = ?, synced = ?
          WHERE round_id = ? AND hole_id = ?
        `, [
          scoreToSave.strokes,
          scoreToSave.putts || null,
          scoreToSave.penalties || 0,
          scoreToSave.notes || null,
          scoreToSave.updatedAt,
          isOffline ? 0 : 1,
          scoreToSave.roundId,
          scoreToSave.holeId
        ]);
      } else {
        // Insert new score
        await this.db.execute(`
          INSERT INTO scores (id, round_id, hole_id, strokes, putts, penalties, notes, created_at, updated_at, synced)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          scoreId,
          scoreToSave.roundId,
          scoreToSave.holeId,
          scoreToSave.strokes,
          scoreToSave.putts || null,
          scoreToSave.penalties || 0,
          scoreToSave.notes || null,
          scoreToSave.createdAt,
          scoreToSave.updatedAt,
          isOffline ? 0 : 1
        ]);
      }

      // Queue for offline sync if needed
      if (isOffline) {
        await this.queueOfflineOperation({
          id: this.generateUUID(),
          type: existing ? 'update' : 'insert',
          table: 'scores',
          data: scoreToSave,
          timestamp: Date.now(),
          retryCount: 0
        });
      }

      logger.info('Score saved to SQLite:', scoreId);
      return scoreToSave;
    } catch (error) {
      logger.error('Failed to save score:', error);
      throw error;
    }
  }

  // Offline operations
  private async queueOfflineOperation(operation: OfflineOperation): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      await this.db.execute(`
        INSERT INTO offline_operations (id, type, table_name, data, timestamp, retry_count)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        operation.id,
        operation.type,
        operation.table,
        JSON.stringify(operation.data),
        operation.timestamp,
        operation.retryCount
      ]);

      logger.info('Operation queued for sync:', operation.type, operation.table);
    } catch (error) {
      logger.error('Failed to queue offline operation:', error);
    }
  }

  async getOfflineOperations(): Promise<OfflineOperation[]> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const result = await this.db.execute(`
        SELECT * FROM offline_operations 
        WHERE retry_count < max_retries 
        ORDER BY timestamp ASC
      `);

      const rows = result.rows?._array || [];
      return rows.map(row => ({
        id: row.id,
        type: row.type,
        table: row.table_name,
        data: JSON.parse(row.data),
        timestamp: row.timestamp,
        retryCount: row.retry_count
      }));
    } catch (error) {
      logger.error('Failed to get offline operations:', error);
      return [];
    }
  }

  async removeOfflineOperation(operationId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      await this.db.execute(
        'DELETE FROM offline_operations WHERE id = ?',
        [operationId]
      );
    } catch (error) {
      logger.error('Failed to remove offline operation:', error);
    }
  }

  async incrementRetryCount(operationId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      await this.db.execute(
        'UPDATE offline_operations SET retry_count = retry_count + 1 WHERE id = ?',
        [operationId]
      );
    } catch (error) {
      logger.error('Failed to increment retry count:', error);
    }
  }

  async clearAllData(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      await this.db.execute('DELETE FROM scores');
      await this.db.execute('DELETE FROM rounds');
      await this.db.execute('DELETE FROM holes');
      await this.db.execute('DELETE FROM courses');
      await this.db.execute('DELETE FROM offline_operations');
      
      logger.info('All SQLite data cleared');
    } catch (error) {
      logger.error('Failed to clear SQLite data:', error);
    }
  }

  async close(): Promise<void> {
    if (this.db) {
      await this.db.close();
      this.db = null;
      this.isInitialized = false;
      logger.info('SQLite database closed');
    }
  }
}

export default SQLiteDatabase;