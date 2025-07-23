package com.minimalapp.wearable

import android.app.Service
import android.bluetooth.*
import android.content.Intent
import android.os.IBinder
import android.util.Log
import java.io.IOException
import java.io.InputStream
import java.io.OutputStream
import java.util.UUID
import org.json.JSONObject
import kotlinx.coroutines.*

/**
 * Production-ready Bluetooth service for phone-to-watch communication
 * This replaces the ADB-based solution for production use
 */
class CompanionDeviceService : Service() {
    
    companion object {
        const val TAG = "CompanionDeviceService"
        
        // Standard UUID for SPP (Serial Port Profile)
        val SPP_UUID: UUID = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB")
        
        // Custom service UUID for our app
        val GOLF_SERVICE_UUID: UUID = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB")
        
        // Message types
        const val MESSAGE_TYPE_ROUND_DATA = "ROUND_DATA"
        const val MESSAGE_TYPE_HOLE_DATA = "HOLE_DATA"
        const val MESSAGE_TYPE_SHOT_DATA = "SHOT_DATA"
        const val MESSAGE_TYPE_STATS_DATA = "STATS_DATA"
        const val MESSAGE_TYPE_TEST = "TEST_MESSAGE"
        
        // Intent actions
        const val ACTION_START_SERVICE = "com.minimalapp.wearable.START_COMPANION_SERVICE"
        const val ACTION_SEND_MESSAGE = "com.minimalapp.wearable.SEND_MESSAGE"
        const val ACTION_DEVICE_CONNECTED = "com.minimalapp.wearable.DEVICE_CONNECTED"
        const val ACTION_DEVICE_DISCONNECTED = "com.minimalapp.wearable.DEVICE_DISCONNECTED"
        
        // Intent extras
        const val EXTRA_MESSAGE_TYPE = "message_type"
        const val EXTRA_MESSAGE_DATA = "message_data"
    }
    
    private var bluetoothAdapter: BluetoothAdapter? = null
    private var bluetoothSocket: BluetoothSocket? = null
    private var outputStream: OutputStream? = null
    private var inputStream: InputStream? = null
    private var isConnected = false
    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    
    override fun onCreate() {
        super.onCreate()
        Log.d(TAG, "CompanionDeviceService created")
        
        bluetoothAdapter = BluetoothAdapter.getDefaultAdapter()
        if (bluetoothAdapter == null) {
            Log.e(TAG, "Device doesn't support Bluetooth")
            stopSelf()
        }
    }
    
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_START_SERVICE -> {
                connectToWatch()
            }
            ACTION_SEND_MESSAGE -> {
                val messageType = intent.getStringExtra(EXTRA_MESSAGE_TYPE) ?: return START_NOT_STICKY
                val messageData = intent.getStringExtra(EXTRA_MESSAGE_DATA) ?: return START_NOT_STICKY
                sendMessage(messageType, messageData)
            }
        }
        
        return START_STICKY
    }
    
    private fun connectToWatch() {
        scope.launch {
            try {
                // Find paired watch device
                val pairedDevices = bluetoothAdapter?.bondedDevices
                val watchDevice = pairedDevices?.find { device ->
                    device.name.contains("Watch", ignoreCase = true) || 
                    device.name.contains("Galaxy", ignoreCase = true) ||
                    device.name.contains("Wear", ignoreCase = true)
                }
                
                if (watchDevice == null) {
                    Log.e(TAG, "No paired watch found")
                    return@launch
                }
                
                Log.d(TAG, "Found watch: ${watchDevice.name} - ${watchDevice.address}")
                
                // Create socket and connect
                bluetoothSocket = watchDevice.createRfcommSocketToServiceRecord(GOLF_SERVICE_UUID)
                bluetoothAdapter?.cancelDiscovery()
                
                try {
                    bluetoothSocket?.connect()
                    outputStream = bluetoothSocket?.outputStream
                    inputStream = bluetoothSocket?.inputStream
                    isConnected = true
                    
                    Log.d(TAG, "Connected to watch successfully")
                    sendBroadcast(Intent(ACTION_DEVICE_CONNECTED))
                    
                    // Start listening for incoming messages
                    listenForMessages()
                    
                } catch (e: IOException) {
                    Log.e(TAG, "Connection failed: ${e.message}")
                    
                    // Try fallback method
                    try {
                        val method = watchDevice.javaClass.getMethod("createRfcommSocket", Int::class.java)
                        bluetoothSocket = method.invoke(watchDevice, 1) as BluetoothSocket
                        bluetoothSocket?.connect()
                        outputStream = bluetoothSocket?.outputStream
                        inputStream = bluetoothSocket?.inputStream
                        isConnected = true
                        
                        Log.d(TAG, "Connected to watch using fallback method")
                        sendBroadcast(Intent(ACTION_DEVICE_CONNECTED))
                        listenForMessages()
                        
                    } catch (e2: Exception) {
                        Log.e(TAG, "Fallback connection also failed: ${e2.message}")
                        disconnect()
                    }
                }
                
            } catch (e: Exception) {
                Log.e(TAG, "Error connecting to watch: ${e.message}")
                disconnect()
            }
        }
    }
    
    private fun listenForMessages() {
        scope.launch {
            val buffer = ByteArray(1024)
            
            while (isConnected) {
                try {
                    val bytes = inputStream?.read(buffer) ?: -1
                    if (bytes > 0) {
                        val message = String(buffer, 0, bytes)
                        Log.d(TAG, "Received from watch: $message")
                        handleIncomingMessage(message)
                    }
                } catch (e: IOException) {
                    Log.e(TAG, "Error reading from watch: ${e.message}")
                    disconnect()
                    break
                }
            }
        }
    }
    
    private fun handleIncomingMessage(message: String) {
        try {
            val json = JSONObject(message)
            val type = json.optString("type")
            val data = json.optJSONObject("data")
            
            // Broadcast the received message to the app
            val intent = Intent("com.minimalapp.WATCH_MESSAGE_RECEIVED").apply {
                putExtra("type", type)
                putExtra("data", data?.toString())
            }
            sendBroadcast(intent)
            
        } catch (e: Exception) {
            Log.e(TAG, "Error parsing incoming message: ${e.message}")
        }
    }
    
    private fun sendMessage(messageType: String, messageData: String) {
        if (!isConnected || outputStream == null) {
            Log.w(TAG, "Not connected to watch, cannot send message")
            return
        }
        
        scope.launch {
            try {
                val message = JSONObject().apply {
                    put("type", messageType)
                    put("data", JSONObject(messageData))
                    put("timestamp", System.currentTimeMillis())
                }
                
                val messageBytes = message.toString().toByteArray()
                outputStream?.write(messageBytes)
                outputStream?.flush()
                
                Log.d(TAG, "Message sent to watch: $messageType")
                
            } catch (e: Exception) {
                Log.e(TAG, "Error sending message: ${e.message}")
            }
        }
    }
    
    fun sendRoundData(roundData: String) {
        sendMessage(MESSAGE_TYPE_ROUND_DATA, roundData)
    }
    
    fun sendHoleData(holeData: String) {
        sendMessage(MESSAGE_TYPE_HOLE_DATA, holeData)
    }
    
    fun sendShotData(shotData: String) {
        sendMessage(MESSAGE_TYPE_SHOT_DATA, shotData)
    }
    
    fun sendStatsData(statsData: String) {
        sendMessage(MESSAGE_TYPE_STATS_DATA, statsData)
    }
    
    private fun disconnect() {
        isConnected = false
        
        try {
            inputStream?.close()
            outputStream?.close()
            bluetoothSocket?.close()
        } catch (e: IOException) {
            Log.e(TAG, "Error closing connections: ${e.message}")
        }
        
        inputStream = null
        outputStream = null
        bluetoothSocket = null
        
        sendBroadcast(Intent(ACTION_DEVICE_DISCONNECTED))
    }
    
    override fun onDestroy() {
        super.onDestroy()
        disconnect()
        scope.cancel()
        Log.d(TAG, "CompanionDeviceService destroyed")
    }
    
    override fun onBind(intent: Intent?): IBinder? = null
}