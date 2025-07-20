package com.minimalapp.wearable

import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.google.android.gms.wearable.*
import android.util.Log
import kotlinx.coroutines.*
import kotlinx.coroutines.tasks.await
import org.json.JSONObject

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

    override fun getName(): String = NAME

    override fun initialize() {
        super.initialize()
        Log.d(TAG, "Initializing WearableModule")
        
        reactApplicationContext?.let { context ->
            dataClient = Wearable.getDataClient(context)
            messageClient = Wearable.getMessageClient(context)
            capabilityClient = Wearable.getCapabilityClient(context)
            nodeClient = Wearable.getNodeClient(context)
            
            // Register listeners
            dataClient?.addListener(this)
            messageClient?.addListener(this)
            capabilityClient?.addListener(this, "wear_app", CapabilityClient.FILTER_REACHABLE)
            
            // Check initial connection
            checkWearableConnection()
        }
    }

    override fun invalidate() {
        Log.d(TAG, "Invalidating WearableModule")
        dataClient?.removeListener(this)
        messageClient?.removeListener(this)
        capabilityClient?.removeListener(this)
        scope.cancel()
        super.invalidate()
    }

    @ReactMethod
    fun startRound(roundData: ReadableMap, promise: Promise) {
        scope.launch {
            try {
                val roundJson = JSONObject().apply {
                    put("roundId", roundData.getString("roundId"))
                    put("courseName", roundData.getString("courseName"))
                    put("currentHole", roundData.getInt("currentHole"))
                    put("totalHoles", roundData.getInt("totalHoles"))
                }
                
                // Send round start message
                sendMessageToAllNodes(PATH_ROUND_START, roundJson.toString().toByteArray())
                
                // Store round data for sync
                dataClient?.putDataItem(
                    PutDataRequest.create(PATH_ROUND_DATA).apply {
                        data = roundJson.toString().toByteArray()
                    }
                )?.await()
                
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
        val nodes = nodeClient?.connectedNodes?.await() ?: return
        nodes.forEach { node ->
            messageClient?.sendMessage(node.id, path, data)?.await()
            Log.d(TAG, "Message sent to ${node.displayName}: $path")
        }
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
}