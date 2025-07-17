/**
 * Sync Result Tracker
 * 
 * Tracks and stores detailed sync results for better user feedback
 */

class SyncResultTracker {
  constructor() {
    this.lastSyncResults = {
      shots: null,
      courseKnowledge: null,
      timestamp: null
    };
  }

  /**
   * Track shot sync results
   */
  trackShotSync(result) {
    this.lastSyncResults.shots = {
      ...result,
      timestamp: new Date().toISOString()
    };
    this.lastSyncResults.timestamp = new Date().toISOString();
  }

  /**
   * Track course knowledge sync results
   */
  trackCourseKnowledgeSync(result) {
    this.lastSyncResults.courseKnowledge = {
      ...result,
      timestamp: new Date().toISOString()
    };
    this.lastSyncResults.timestamp = new Date().toISOString();
  }

  /**
   * Get last sync results with detailed information
   */
  getLastSyncResults() {
    const results = {
      timestamp: this.lastSyncResults.timestamp,
      summary: {
        totalItems: 0,
        successCount: 0,
        failureCount: 0,
        partialSuccess: false
      },
      details: []
    };

    // Process shot sync results
    if (this.lastSyncResults.shots) {
      const shotResult = this.lastSyncResults.shots;
      if (shotResult.data) {
        const { synced, total, skipped, errors } = shotResult.data;
        results.totalItems += total;
        results.summary.successCount += synced;
        results.summary.failureCount += skipped;
        
        if (skipped > 0) {
          results.summary.partialSuccess = true;
          results.details.push({
            type: 'shots',
            message: `${synced}/${total} shots synced`,
            errors: errors || []
          });
        } else {
          results.details.push({
            type: 'shots',
            message: `All ${synced} shots synced successfully`,
            errors: []
          });
        }
      }
    }

    // Process course knowledge results
    if (this.lastSyncResults.courseKnowledge) {
      const knowledgeResult = this.lastSyncResults.courseKnowledge;
      if (knowledgeResult.data) {
        const { synced, errors } = knowledgeResult.data;
        results.totalItems += synced;
        results.summary.successCount += synced;
        
        if (errors && errors.length > 0) {
          results.summary.failureCount += errors.length;
          results.summary.partialSuccess = true;
          results.details.push({
            type: 'courseKnowledge',
            message: `Course knowledge partially synced`,
            errors: errors
          });
        } else {
          results.details.push({
            type: 'courseKnowledge',
            message: `Course knowledge synced successfully`,
            errors: []
          });
        }
      }
    }

    return results;
  }

  /**
   * Clear sync results
   */
  clear() {
    this.lastSyncResults = {
      shots: null,
      courseKnowledge: null,
      timestamp: null
    };
  }

  /**
   * Format sync errors for display
   */
  formatSyncErrors(errors) {
    if (!Array.isArray(errors) || errors.length === 0) {
      return 'No specific error details available';
    }

    return errors.map(error => {
      if (typeof error === 'string') {
        return error;
      } else if (error.shot) {
        return `Hole ${error.shot}: ${error.error}`;
      } else if (error.hole) {
        return `Hole ${error.hole}: ${error.error}`;
      } else if (error.error) {
        return error.error;
      } else {
        return JSON.stringify(error);
      }
    }).join('\n');
  }
}

// Create singleton instance
const syncResultTracker = new SyncResultTracker();

export default syncResultTracker;