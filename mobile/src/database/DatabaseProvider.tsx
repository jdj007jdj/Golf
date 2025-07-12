import React, { useEffect, useState, createContext, useContext } from 'react';
import { Alert } from 'react-native';
import { logger } from '@/utils/logger';
import { dataService } from '@/services/data/dataService';

interface DatabaseContextType {
  dataService: typeof dataService;
  isOffline: boolean;
  isReady: boolean;
  syncStatus: {
    lastSync: string | null;
    pendingChanges: number;
    isSyncing: boolean;
    isOnline: boolean;
  };
  forceSync: () => Promise<void>;
}

interface DatabaseProviderProps {
  children: React.ReactNode;
}

const DatabaseContext = createContext<DatabaseContextType | null>(null);

export const useDatabase = (): DatabaseContextType => {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
};

export const DatabaseProvider: React.FC<DatabaseProviderProps> = ({ children }) => {
  const [isReady, setIsReady] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [syncStatus, setSyncStatus] = useState({
    lastSync: null,
    pendingChanges: 0,
    isSyncing: false,
    isOnline: false,
  });

  useEffect(() => {
    initializeDataService();
    
    // Cleanup on unmount
    return () => {
      dataService.close().catch(error => {
        logger.error('Error closing data service:', error);
      });
    };
  }, []);

  const initializeDataService = async () => {
    try {
      logger.info('Initializing data service...');
      await dataService.initialize();
      setIsReady(true);
      
      // Update sync status periodically
      const updateSyncStatus = async () => {
        try {
          const status = await dataService.getSyncStatus();
          setSyncStatus(status);
          setIsOffline(!status.isOnline);
        } catch (err) {
          logger.warn('Failed to get sync status:', err);
        }
      };
      
      // Initial status update
      updateSyncStatus();
      
      // Update sync status every 30 seconds
      const interval = setInterval(updateSyncStatus, 30000);
      
      logger.info('Data service initialized successfully');
      
      return () => clearInterval(interval);
    } catch (error) {
      logger.error('Failed to initialize data service:', error);
      Alert.alert(
        'Database Error', 
        'Failed to initialize local database. Some features may not work offline.',
        [
          {
            text: 'Continue',
            onPress: () => setIsReady(true)
          }
        ]
      );
    }
  };


  const forceSync = async (): Promise<void> => {
    try {
      await dataService.forceSync();
      logger.info('Force sync completed');
    } catch (error) {
      logger.error('Force sync failed:', error);
    }
  };

  const contextValue: DatabaseContextType = {
    dataService,
    isOffline,
    isReady,
    syncStatus,
    forceSync,
  };

  if (!isReady) {
    // You could show a loading spinner here
    return null;
  }

  return (
    <DatabaseContext.Provider value={contextValue}>
      {children}
    </DatabaseContext.Provider>
  );
};