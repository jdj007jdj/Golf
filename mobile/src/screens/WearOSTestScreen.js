import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  SafeAreaView,
} from 'react-native';
import { NativeModules } from 'react-native';
import { wearableService } from '../services/wearableService';

const { WearableModule } = NativeModules;

const WearOSTestScreen = () => {
  const [logs, setLogs] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [nodeId, setNodeId] = useState('');

  useEffect(() => {
    checkConnection();
  }, []);

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [{
      time: timestamp,
      message,
      type
    }, ...prev].slice(0, 50)); // Keep last 50 logs
  };

  const checkConnection = async () => {
    try {
      // Check Wearable API connection
      addLog('Checking for connected nodes...', 'info');
      const result = await WearableModule.getConnectedNodes();
      
      if (result && result.nodes && result.nodes.length > 0) {
        const node = result.nodes[0];
        setNodeId(node.id);
        setIsConnected(true);
        addLog(`Connected to: ${node.displayName} (${node.id})`, 'success');
      } else {
        setIsConnected(false);
        addLog('No watch connected via Wearable API', 'warning');
      }
      
      // ADB connection check removed - using Wearable API only
    } catch (error) {
      addLog(`Connection check failed: ${error.message}`, 'error');
      setIsConnected(false);
    }
  };

  const sendTestMessage = async (message) => {
    try {
      addLog(`Sending: "${message}"`, 'info');
      const result = await WearableModule.sendMessage(nodeId, '/test/message', message);
      
      if (result.success) {
        addLog(`Message sent successfully to ${nodeId}`, 'success');
      } else {
        addLog(`Send failed: ${result.error}`, 'error');
      }
    } catch (error) {
      addLog(`Send error: ${error.message}`, 'error');
    }
  };

  const sendPing = () => sendTestMessage('PING');
  const sendTimestamp = () => sendTestMessage(`Time: ${new Date().toISOString()}`);
  const sendData = () => sendTestMessage(JSON.stringify({ test: true, value: 42 }));
  
  // Message test methods
  const sendBroadcastTest = async () => {
    try {
      addLog('Sending test message...', 'info');
      const success = await wearableService.sendTestMessage('Hello from phone via Wearable API!');
      if (success) {
        addLog('Test message sent successfully', 'success');
      } else {
        addLog('Test message failed', 'error');
      }
    } catch (error) {
      addLog(`Message error: ${error.message}`, 'error');
    }
  };
  
  const sendRoundData = async () => {
    try {
      addLog('Sending round data...', 'info');
      const roundData = {
        roundId: 'test-round-123',
        courseName: 'Augusta National',
        currentHole: 1,
        totalHoles: 18
      };
      const success = await wearableService.startRound(roundData);
      if (success) {
        addLog('Round data sent successfully', 'success');
      } else {
        addLog('Round data send failed', 'error');
      }
    } catch (error) {
      addLog(`Round data error: ${error.message}`, 'error');
    }
  };
  
  const sendHoleData = async () => {
    try {
      addLog('Sending hole data...', 'info');
      const holeData = {
        holeNumber: 9,
        par: 4,
        distance: 460
      };
      const success = await wearableService.sendHoleData(holeData);
      if (success) {
        addLog('Hole data sent successfully', 'success');
      } else {
        addLog('Hole data send failed', 'error');
      }
    } catch (error) {
      addLog(`Hole data error: ${error.message}`, 'error');
    }
  };

  const getLogColor = (type) => {
    switch (type) {
      case 'success': return '#4CAF50';
      case 'error': return '#F44336';
      case 'warning': return '#FF9800';
      default: return '#2196F3';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <Text style={styles.title}>WearOS Communication Test</Text>
        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, { backgroundColor: isConnected ? '#4CAF50' : '#F44336' }]}>
            <Text style={styles.statusText}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </Text>
          </View>
        </View>
      </View>

      {nodeId ? (
        <Text style={styles.nodeInfo}>Node ID: {nodeId}</Text>
      ) : null}

      <View style={styles.buttonSection}>
        <TouchableOpacity 
          style={[styles.button, styles.refreshButton]} 
          onPress={checkConnection}
        >
          <Text style={styles.buttonText}>Refresh Connection</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Wearable API Tests</Text>
        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={[styles.button, styles.testButton, !isConnected && styles.disabledButton]} 
            onPress={sendPing}
            disabled={!isConnected}
          >
            <Text style={styles.buttonText}>Send PING</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.testButton, !isConnected && styles.disabledButton]} 
            onPress={sendTimestamp}
            disabled={!isConnected}
          >
            <Text style={styles.buttonText}>Send Time</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.testButton, !isConnected && styles.disabledButton]} 
            onPress={sendData}
            disabled={!isConnected}
          >
            <Text style={styles.buttonText}>Send JSON</Text>
          </TouchableOpacity>
        </View>
        
        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Message Tests</Text>
        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={[styles.button, styles.broadcastButton]} 
            onPress={sendBroadcastTest}
          >
            <Text style={styles.buttonText}>Test Message</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.broadcastButton]} 
            onPress={sendRoundData}
          >
            <Text style={styles.buttonText}>Round Data</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.broadcastButton]} 
            onPress={sendHoleData}
          >
            <Text style={styles.buttonText}>Hole Data</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.logsSection}>
        <Text style={styles.logsTitle}>Communication Logs:</Text>
        <View style={styles.logsContainer}>
          {logs.length === 0 ? (
            <Text style={styles.noLogs}>No logs yet...</Text>
          ) : (
            logs.map((log, index) => (
              <View key={index} style={styles.logEntry}>
                <Text style={styles.logTime}>{log.time}</Text>
                <Text style={[styles.logMessage, { color: getLogColor(log.type) }]}>
                  {log.message}
                </Text>
              </View>
            ))
          )}
        </View>
      </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statusContainer: {
    flexDirection: 'row',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 10,
  },
  nodeInfo: {
    padding: 10,
    backgroundColor: '#e3f2fd',
    fontSize: 12,
    fontFamily: 'monospace',
  },
  buttonSection: {
    padding: 20,
    backgroundColor: 'white',
    marginTop: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  button: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  refreshButton: {
    backgroundColor: '#2196F3',
  },
  testButton: {
    backgroundColor: '#4CAF50',
    flex: 1,
    marginHorizontal: 5,
  },
  broadcastButton: {
    backgroundColor: '#FF9800',
    flex: 1,
    marginHorizontal: 5,
  },
  disabledButton: {
    backgroundColor: '#cccccc',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  logsSection: {
    flex: 1,
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
  },
  logsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  logsContainer: {
    maxHeight: 400,
  },
  logEntry: {
    flexDirection: 'row',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  logTime: {
    fontSize: 12,
    color: '#666',
    marginRight: 10,
    fontFamily: 'monospace',
  },
  logMessage: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'monospace',
  },
  noLogs: {
    textAlign: 'center',
    color: '#999',
    marginTop: 20,
  },
});

export default WearOSTestScreen;