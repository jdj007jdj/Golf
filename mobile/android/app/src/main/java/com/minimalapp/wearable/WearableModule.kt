package com.minimalapp.wearable

import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.google.android.gms.wearable.*
import com.google.android.gms.tasks.Tasks
import android.net.Uri
import android.util.Log
import kotlinx.coroutines.*
import kotlinx.coroutines.tasks.await
import org.json.JSONObject
import android.content.Intent
import android.os.Process
import java.io.BufferedReader
import java.io.InputStreamReader
import android.content.BroadcastReceiver
import android.content.Context
import android.content.IntentFilter
import android.os.Build

class WearableModule(reactContext: ReactApplicationContext) : 
    ReactContextBaseJavaModule(reactContext),
    DataClient.OnDataChangedListener,
    MessageClient.OnMessageReceivedListener,
    CapabilityClient.OnCapabilityChangedListener {

    companion object {
        const val TAG = "WearableModule"
        const val NAME = "WearableModule"
        
        // Message paths
        const val PATH_ROUND_START = "/round/start"
        const val PATH_ROUND_END = "/round/end"
        const val PATH_STATS_UPDATE = "/stats/update"
        const val PATH_HOLE_CHANGE = "/hole/change"
        const val PATH_SHOT_RECORDED = "/shot/recorded"
        const val PATH_CLUB_SELECTED = "/club/selected"
        const val PATH_PUTT_UPDATED = "/putt/updated"
        const val PATH_ROUND_REQUEST = "/round/request"
        const val PATH_ROUND_RESPONSE = "/round/response"
        
        // Data paths
        const val PATH_ROUND_DATA = "/round/data"
        const val PATH_STATS_DATA = "/stats/data"
        
        // Events
        const val EVENT_SHOT_RECORDED = "onShotRecorded"
        const val EVENT_CLUB_SELECTED = "onClubSelected"
        const val EVENT_PUTT_UPDATED = "onPuttUpdated"
        const val EVENT_CONNECTION_STATUS = "onConnectionStatusChanged"
        const val EVENT_SYNC_STATUS = "onSyncStatusChanged"
    }

    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    private var dataClient: DataClient? = null
    private var messageClient: MessageClient? = null
    private var capabilityClient: CapabilityClient? = null
    private var nodeClient: NodeClient? = null
    private var connectedNodes = setOf<String>()
    private var isBluetoothConnected = false
    private var companionDeviceReceiver: BroadcastReceiver? = null
    
    // Store current round data for reconnection
    private var currentRoundData: String? = null

    override fun getName(): String = NAME

    override fun initialize() {
        super.initialize()
        Log.d(TAG, "Initializing WearableModule - currentRoundData: $currentRoundData")
        
        reactApplicationContext?.let { context ->
            dataClient = Wearable.getDataClient(context)
            messageClient = Wearable.getMessageClient(context)
            capabilityClient = Wearable.getCapabilityClient(context)
            nodeClient = Wearable.getNodeClient(context)
            
            // Register listeners
            dataClient?.addListener(this)
            messageClient?.addListener(this)
            capabilityClient?.addListener(this, Uri.parse("wear://*/wear_app"), CapabilityClient.FILTER_REACHABLE)
            
            // Register for Bluetooth connection broadcasts
            companionDeviceReceiver = object : BroadcastReceiver() {
                override fun onReceive(context: Context?, intent: Intent?) {
                    when (intent?.action) {
                        CompanionDeviceService.ACTION_DEVICE_CONNECTED -> {
                            isBluetoothConnected = true
                            Log.d(TAG, "Bluetooth connected to watch")
                            sendEvent(EVENT_CONNECTION_STATUS, Arguments.createMap().apply {
                                putBoolean("bluetoothConnected", true)
                                putBoolean("connected", true)
                            })
                        }
                        CompanionDeviceService.ACTION_DEVICE_DISCONNECTED -> {
                            isBluetoothConnected = false
                            Log.d(TAG, "Bluetooth disconnected from watch")
                            sendEvent(EVENT_CONNECTION_STATUS, Arguments.createMap().apply {
                                putBoolean("bluetoothConnected", false)
                                putBoolean("connected", false)
                            })
                        }
                    }
                }
            }
            
            val filter = IntentFilter().apply {
                addAction(CompanionDeviceService.ACTION_DEVICE_CONNECTED)
                addAction(CompanionDeviceService.ACTION_DEVICE_DISCONNECTED)
            }
            
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                context.registerReceiver(companionDeviceReceiver, filter, Context.RECEIVER_NOT_EXPORTED)
            } else {
                context.registerReceiver(companionDeviceReceiver, filter)
            }
            
            // Start Companion Device Service
            val serviceIntent = Intent(context, CompanionDeviceService::class.java).apply {
                action = CompanionDeviceService.ACTION_START_SERVICE
            }
            context.startService(serviceIntent)
            
            // Check initial connection
            checkWearableConnection()
        }
    }

    override fun invalidate() {
        Log.d(TAG, "Invalidating WearableModule")
        dataClient?.removeListener(this)
        messageClient?.removeListener(this)
        capabilityClient?.removeListener(this)
        
        // Unregister Bluetooth receiver
        companionDeviceReceiver?.let {
            reactApplicationContext?.unregisterReceiver(it)
        }
        
        // Stop Companion Device Service
        reactApplicationContext?.let { context ->
            val serviceIntent = Intent(context, CompanionDeviceService::class.java)
            context.stopService(serviceIntent)
        }
        
        scope.cancel()
        super.invalidate()
    }

    @ReactMethod
    fun startRound(roundData: ReadableMap, promise: Promise) {
        Log.d(TAG, "startRound called with data: $roundData")
        scope.launch {
            try {
                val roundJson = JSONObject().apply {
                    put("roundId", roundData.getString("roundId") ?: "unknown")
                    put("courseName", roundData.getString("courseName") ?: "Unknown Course")
                    put("currentHole", if (roundData.hasKey("currentHole")) roundData.getInt("currentHole") else 1)
                    put("totalHoles", if (roundData.hasKey("totalHoles")) roundData.getInt("totalHoles") else 18)
                }
                
                Log.d(TAG, "Sending round data to watch: $roundJson")
                
                // Store round data for later requests
                currentRoundData = roundJson.toString()
                Log.d(TAG, "Stored round data for future requests: $currentRoundData")
                
                // Send round start message
                sendMessageToAllNodes(PATH_ROUND_START, roundJson.toString().toByteArray())
                
                // Store round data for sync
                val putDataRequest = PutDataRequest.create(PATH_ROUND_DATA).apply {
                    data = roundJson.toString().toByteArray()
                    setUrgent()
                }
                
                val result = dataClient?.putDataItem(putDataRequest)?.await()
                Log.d(TAG, "Round data stored: ${result?.uri}")
                
                promise.resolve(true)
            } catch (e: Exception) {
                Log.e(TAG, "Error starting round", e)
                promise.reject("ROUND_START_ERROR", e.message, e)
            }
        }
    }

    @ReactMethod
    fun endRound(promise: Promise) {
        scope.launch {
            try {
                sendMessageToAllNodes(PATH_ROUND_END, ByteArray(0))
                
                // Clear round data
                dataClient?.deleteDataItems(Uri.parse("wear://*/round/data"))?.await()
                currentRoundData = null
                
                promise.resolve(true)
            } catch (e: Exception) {
                Log.e(TAG, "Error ending round", e)
                promise.reject("ROUND_END_ERROR", e.message, e)
            }
        }
    }

    @ReactMethod
    fun sendStatsToWatch(stats: ReadableMap, promise: Promise) {
        scope.launch {
            try {
                val statsJson = JSONObject().apply {
                    stats.getInt("distanceToPin").let {
                        if (it > 0) put("distanceToPin", it)
                    }
                    stats.getInt("distanceLastShot").let {
                        if (it > 0) put("distanceLastShot", it)
                    }
                    put("measurementUnit", stats.getString("measurementUnit") ?: "imperial")
                    put("currentHole", stats.getInt("currentHole"))
                }
                
                // Send immediate message
                sendMessageToAllNodes(PATH_STATS_UPDATE, statsJson.toString().toByteArray())
                
                // Store for sync
                dataClient?.putDataItem(
                    PutDataRequest.create(PATH_STATS_DATA).apply {
                        data = statsJson.toString().toByteArray()
                    }
                )?.await()
                
                promise.resolve(true)
            } catch (e: Exception) {
                Log.e(TAG, "Error sending stats", e)
                promise.reject("STATS_UPDATE_ERROR", e.message, e)
            }
        }
    }

    @ReactMethod
    fun updateCurrentHole(holeNumber: Int, promise: Promise) {
        scope.launch {
            try {
                val data = JSONObject().apply {
                    put("currentHole", holeNumber)
                }.toString().toByteArray()
                
                sendMessageToAllNodes(PATH_HOLE_CHANGE, data)
                promise.resolve(true)
            } catch (e: Exception) {
                Log.e(TAG, "Error updating hole", e)
                promise.reject("HOLE_UPDATE_ERROR", e.message, e)
            }
        }
    }

    @ReactMethod
    fun isWatchConnected(promise: Promise) {
        scope.launch {
            try {
                val nodes = nodeClient?.connectedNodes?.await()
                val connected = !nodes.isNullOrEmpty()
                promise.resolve(connected)
            } catch (e: Exception) {
                Log.e(TAG, "Error checking connection", e)
                promise.resolve(false)
            }
        }
    }

    override fun onDataChanged(dataEvents: DataEventBuffer) {
        dataEvents.forEach { event ->
            when (event.type) {
                DataEvent.TYPE_CHANGED -> {
                    Log.d(TAG, "Data changed: ${event.dataItem.uri.path}")
                }
                DataEvent.TYPE_DELETED -> {
                    Log.d(TAG, "Data deleted: ${event.dataItem.uri.path}")
                }
            }
        }
    }

    override fun onMessageReceived(messageEvent: MessageEvent) {
        Log.d(TAG, "Message received: ${messageEvent.path}")
        
        val data = String(messageEvent.data)
        val params = Arguments.createMap().apply {
            putString("path", messageEvent.path)
            putString("data", data)
            putString("nodeId", messageEvent.sourceNodeId)
        }
        
        when (messageEvent.path) {
            PATH_SHOT_RECORDED -> {
                try {
                    val shotData = JSONObject(data)
                    val shotParams = Arguments.createMap().apply {
                        putDouble("timestamp", shotData.getLong("timestamp").toDouble())
                        putDouble("latitude", shotData.getDouble("latitude"))
                        putDouble("longitude", shotData.getDouble("longitude"))
                        putDouble("accuracy", shotData.getDouble("accuracy"))
                        putInt("holeNumber", shotData.getInt("holeNumber"))
                        putInt("shotNumber", shotData.optInt("shotNumber", 1))
                        putString("club", shotData.optString("club", ""))
                    }
                    sendEvent(EVENT_SHOT_RECORDED, shotParams)
                } catch (e: Exception) {
                    Log.e(TAG, "Error parsing shot data", e)
                }
            }
            PATH_CLUB_SELECTED -> {
                try {
                    val clubData = JSONObject(data)
                    val clubParams = Arguments.createMap().apply {
                        putString("club", clubData.getString("club"))
                        putDouble("timestamp", clubData.getLong("timestamp").toDouble())
                    }
                    sendEvent(EVENT_CLUB_SELECTED, clubParams)
                } catch (e: Exception) {
                    Log.e(TAG, "Error parsing club data", e)
                }
            }
            PATH_PUTT_UPDATED -> {
                try {
                    val puttData = JSONObject(data)
                    val puttParams = Arguments.createMap().apply {
                        putInt("putts", puttData.getInt("putts"))
                        putInt("holeNumber", puttData.getInt("holeNumber"))
                    }
                    sendEvent(EVENT_PUTT_UPDATED, puttParams)
                } catch (e: Exception) {
                    Log.e(TAG, "Error parsing putt data", e)
                }
            }
            "/test/response" -> {
                Log.d(TAG, "===============================================")
                Log.d(TAG, "TEST RESPONSE RECEIVED FROM WATCH!")
                Log.d(TAG, "Message: $data")
                Log.d(TAG, "From: ${messageEvent.sourceNodeId}")
                Log.d(TAG, "===============================================")
            }
            PATH_ROUND_REQUEST -> {
                Log.d(TAG, "Round request received from watch - currentRoundData is ${if (currentRoundData != null) "present" else "null"}")
                scope.launch {
                    try {
                        // First check memory
                        var roundData = currentRoundData
                        
                        // If not in memory, check DataClient
                        if (roundData == null) {
                            Log.d(TAG, "Checking DataClient for round data...")
                            try {
                                val dataItems = dataClient?.getDataItems(Uri.parse("wear://*/round/data"))?.await()
                                dataItems?.forEach { item ->
                                    val data = item.data
                                    if (data != null && data.isNotEmpty()) {
                                        roundData = String(data)
                                        currentRoundData = roundData
                                        Log.d(TAG, "Found round data in DataClient: $roundData")
                                    }
                                }
                                dataItems?.release()
                            } catch (e: Exception) {
                                Log.e(TAG, "Error checking DataClient", e)
                            }
                        }
                        
                        val response = if (roundData != null) {
                            // Send the current round data
                            Log.d(TAG, "Sending active round data: $roundData")
                            roundData!!.toByteArray()
                        } else {
                            // No active round
                            Log.d(TAG, "No active round data available in memory or DataClient")
                            "NO_ACTIVE_ROUND".toByteArray()
                        }
                        
                        messageClient?.sendMessage(
                            messageEvent.sourceNodeId,
                            PATH_ROUND_RESPONSE,
                            response
                        )?.await()
                        
                        Log.d(TAG, "Sent round response to watch: ${String(response)}")
                    } catch (e: Exception) {
                        Log.e(TAG, "Failed to send round response", e)
                    }
                }
            }
            "/test" -> {
                Log.d(TAG, "===============================================")
                Log.d(TAG, "SIMPLE TEST MESSAGE FROM WATCH!")
                Log.d(TAG, "Message: $data")
                Log.d(TAG, "From: ${messageEvent.sourceNodeId}")
                Log.d(TAG, "===============================================")
                
                // Send response back
                scope.launch {
                    try {
                        messageClient?.sendMessage(
                            messageEvent.sourceNodeId,
                            "/test/reply",
                            "Phone received: $data".toByteArray()
                        )?.await()
                        Log.d(TAG, "Sent reply back to watch")
                    } catch (e: Exception) {
                        Log.e(TAG, "Failed to send reply", e)
                    }
                }
            }
        }
    }

    override fun onCapabilityChanged(capabilityInfo: CapabilityInfo) {
        updateConnectedNodes(capabilityInfo.nodes)
    }

    private fun updateConnectedNodes(nodes: Set<Node>) {
        val nodeIds = nodes.map { it.id }.toSet()
        if (nodeIds != connectedNodes) {
            connectedNodes = nodeIds
            val connected = connectedNodes.isNotEmpty()
            
            Log.d(TAG, "Connected nodes updated: ${connectedNodes.size} nodes")
            sendEvent(EVENT_CONNECTION_STATUS, Arguments.createMap().apply {
                putBoolean("connected", connected)
                putInt("nodeCount", connectedNodes.size)
            })
        }
    }

    private suspend fun sendMessageToAllNodes(path: String, data: ByteArray) {
        Log.d(TAG, "===============================================")
        Log.d(TAG, "sendMessageToAllNodes called")
        Log.d(TAG, "Path: $path")
        Log.d(TAG, "Data size: ${data.size} bytes")
        Log.d(TAG, "Data content: ${String(data)}")
        
        val nodes = nodeClient?.connectedNodes?.await()
        if (nodes == null || nodes.isEmpty()) {
            Log.w(TAG, "No connected nodes found - CHECK BLUETOOTH/WIFI CONNECTION")
            Log.d(TAG, "===============================================")
            return
        }
        
        Log.d(TAG, "Found ${nodes.size} connected nodes:")
        nodes.forEach { node: Node ->
            Log.d(TAG, "  - ${node.displayName} (${node.id}) nearby: ${node.isNearby}")
        }
        
        nodes.forEach { node: Node ->
            try {
                Log.d(TAG, "Sending message to ${node.displayName}...")
                val result = messageClient?.sendMessage(node.id, path, data)?.await()
                Log.d(TAG, "✓ Message sent successfully to ${node.displayName}")
            } catch (e: Exception) {
                Log.e(TAG, "✗ Failed to send to ${node.displayName}: ${e.message}", e)
            }
        }
        Log.d(TAG, "===============================================")
    }

    private fun checkWearableConnection() {
        scope.launch {
            try {
                val nodes = nodeClient?.connectedNodes?.await()
                val connected = !nodes.isNullOrEmpty()
                
                sendEvent(EVENT_CONNECTION_STATUS, Arguments.createMap().apply {
                    putBoolean("connected", connected)
                    putInt("nodeCount", nodes?.size ?: 0)
                })
            } catch (e: Exception) {
                Log.e(TAG, "Error checking connection", e)
            }
        }
    }

    private fun sendEvent(eventName: String, params: WritableMap) {
        reactApplicationContext
            ?.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            ?.emit(eventName, params)
    }
    
    // Test methods for debugging
    @ReactMethod
    fun getConnectedNodes(promise: Promise) {
        scope.launch {
            try {
                val nodes = nodeClient?.connectedNodes?.await()
                val result = Arguments.createMap()
                val nodeArray = Arguments.createArray()
                
                nodes?.forEach { node ->
                    val nodeMap = Arguments.createMap().apply {
                        putString("id", node.id)
                        putString("displayName", node.displayName)
                        putBoolean("isNearby", node.isNearby)
                    }
                    nodeArray.pushMap(nodeMap)
                }
                
                result.putArray("nodes", nodeArray)
                result.putInt("count", nodes?.size ?: 0)
                promise.resolve(result)
            } catch (e: Exception) {
                Log.e(TAG, "Error getting connected nodes", e)
                promise.reject("GET_NODES_ERROR", e.message, e)
            }
        }
    }
    
    @ReactMethod
    fun sendMessage(nodeId: String, path: String, message: String, promise: Promise) {
        scope.launch {
            try {
                Log.d(TAG, "TEST: Sending message to $nodeId on path $path: $message")
                val result = messageClient?.sendMessage(nodeId, path, message.toByteArray())?.await()
                Log.d(TAG, "TEST: Message sent successfully")
                
                promise.resolve(Arguments.createMap().apply {
                    putBoolean("success", true)
                    putString("nodeId", nodeId)
                    putString("path", path)
                })
            } catch (e: Exception) {
                Log.e(TAG, "TEST: Error sending message", e)
                promise.reject("SEND_MESSAGE_ERROR", e.message, e)
            }
        }
    }
    
    // Required for NativeEventEmitter
    @ReactMethod
    fun addListener(eventName: String) {
        // Keep track of listeners if needed
        Log.d(TAG, "addListener called for: $eventName")
    }
    
    @ReactMethod
    fun removeListeners(count: Int) {
        // Remove listeners if needed
        Log.d(TAG, "removeListeners called with count: $count")
    }
    
    // ============================================
    
    @ReactMethod
    fun sendTestBroadcast(message: String, promise: Promise) {
        scope.launch {
            try {
                val testData = JSONObject().apply {
                    put("message", message)
                    put("timestamp", System.currentTimeMillis())
                }.toString().toByteArray()
                
                sendMessageToAllNodes("/test/message", testData)
                promise.resolve(true)
            } catch (e: Exception) {
                promise.reject("MESSAGE_ERROR", e.message, e)
            }
        }
    }
    
    /**
     * Send round data via Wearable API
     */
    @ReactMethod
    fun sendRoundDataMessage(roundData: ReadableMap, promise: Promise) {
        scope.launch {
            try {
                val roundJson = JSONObject().apply {
                    put("roundId", roundData.getString("roundId") ?: "unknown")
                    put("courseName", roundData.getString("courseName") ?: "Unknown Course")
                    put("currentHole", if (roundData.hasKey("currentHole")) roundData.getInt("currentHole") else 1)
                    put("totalHoles", if (roundData.hasKey("totalHoles")) roundData.getInt("totalHoles") else 18)
                    put("timestamp", System.currentTimeMillis())
                }
                
                sendMessageToAllNodes(PATH_ROUND_START, roundJson.toString().toByteArray())
                
                // Also store in DataClient for persistence
                val putDataRequest = PutDataRequest.create(PATH_ROUND_DATA).apply {
                    data = roundJson.toString().toByteArray()
                    setUrgent()
                }
                dataClient?.putDataItem(putDataRequest)?.await()
                
                Log.d(TAG, "Round data sent via Wearable API")
                promise.resolve(true)
            } catch (e: Exception) {
                Log.e(TAG, "Error sending round data", e)
                promise.reject("ROUND_DATA_ERROR", e.message, e)
            }
        }
    }
    
    /**
     * Send hole data via Wearable API
     */
    @ReactMethod
    fun sendHoleDataMessage(holeData: ReadableMap, promise: Promise) {
        scope.launch {
            try {
                val holeJson = JSONObject().apply {
                    put("holeNumber", holeData.getInt("holeNumber"))
                    put("par", holeData.getInt("par"))
                    put("distance", holeData.getInt("distance"))
                    put("timestamp", System.currentTimeMillis())
                }
                
                sendMessageToAllNodes(PATH_HOLE_CHANGE, holeJson.toString().toByteArray())
                promise.resolve(true)
            } catch (e: Exception) {
                promise.reject("MESSAGE_ERROR", e.message, e)
            }
        }
    }
    
    /**
     * Send shot data via Wearable API
     */
    @ReactMethod
    fun sendShotDataMessage(shotData: ReadableMap, promise: Promise) {
        scope.launch {
            try {
                val shotJson = JSONObject().apply {
                    put("club", shotData.getString("club"))
                    put("distance", shotData.getInt("distance"))
                    put("latitude", shotData.getDouble("latitude"))
                    put("longitude", shotData.getDouble("longitude"))
                    put("timestamp", System.currentTimeMillis())
                }
                
                sendMessageToAllNodes(PATH_SHOT_RECORDED, shotJson.toString().toByteArray())
                promise.resolve(true)
            } catch (e: Exception) {
                promise.reject("MESSAGE_ERROR", e.message, e)
            }
        }
    }
    
    /**
     * Get current round data
     */
    @ReactMethod
    fun getCurrentRoundData(promise: Promise) {
        if (currentRoundData != null) {
            promise.resolve(currentRoundData)
        } else {
            promise.resolve(null)
        }
    }
    
    /**
     * Send stats update via Wearable API
     */
    @ReactMethod
    fun sendStatsDataMessage(statsData: ReadableMap, promise: Promise) {
        scope.launch {
            try {
                val statsJson = JSONObject().apply {
                    put("distanceToPin", statsData.getInt("distanceToPin"))
                    put("currentScore", statsData.getInt("currentScore"))
                    put("totalScore", statsData.getInt("totalScore"))
                    put("timestamp", System.currentTimeMillis())
                }
                
                sendMessageToAllNodes(PATH_STATS_UPDATE, statsJson.toString().toByteArray())
                
                // Also store in DataClient for persistence
                dataClient?.putDataItem(
                    PutDataRequest.create(PATH_STATS_DATA).apply {
                        data = statsJson.toString().toByteArray()
                        setUrgent()
                    }
                )?.await()
                
                promise.resolve(true)
            } catch (e: Exception) {
                promise.reject("MESSAGE_ERROR", e.message, e)
            }
        }
    }
    
}