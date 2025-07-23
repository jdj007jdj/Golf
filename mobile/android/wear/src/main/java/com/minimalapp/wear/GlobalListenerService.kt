package com.minimalapp.wear
import com.minimalapp.R

import android.app.Service
import android.content.Intent
import android.os.IBinder
import android.util.Log
import com.google.android.gms.wearable.*
import kotlinx.coroutines.*
import com.google.android.gms.tasks.Tasks

/**
 * Global service that starts immediately and listens for all messages
 * This ensures we catch messages even before activities start
 */
class GlobalListenerService : Service() {
    
    companion object {
        const val TAG = "GlobalListener"
        private var instance: GlobalListenerService? = null
        
        fun getInstance() = instance
    }
    
    private lateinit var messageClient: MessageClient
    private lateinit var dataClient: DataClient
    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    
    private val messageListener = MessageClient.OnMessageReceivedListener { messageEvent ->
        Log.e(TAG, "==== GLOBAL MESSAGE RECEIVED ====")
        Log.e(TAG, "Path: ${messageEvent.path}")
        Log.e(TAG, "Data: ${String(messageEvent.data)}")
        Log.e(TAG, "From: ${messageEvent.sourceNodeId}")
        Log.e(TAG, "================================")
        
        // Try to respond back
        scope.launch {
            try {
                val nodes = Tasks.await(Wearable.getNodeClient(this@GlobalListenerService).connectedNodes)
                nodes.forEach { node ->
                    if (node.id == messageEvent.sourceNodeId) {
                        Tasks.await(
                            messageClient.sendMessage(
                                node.id,
                                "/test/response",
                                "Received: ${String(messageEvent.data)}".toByteArray()
                            )
                        )
                        Log.e(TAG, "Sent response back to phone")
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "Failed to send response: ${e.message}")
            }
        }
        
        // Broadcast to any listening activities
        sendBroadcast(Intent("com.minimalapp.wear.MESSAGE_RECEIVED").apply {
            putExtra("path", messageEvent.path)
            putExtra("data", String(messageEvent.data))
            putExtra("nodeId", messageEvent.sourceNodeId)
        })
    }
    
    private val dataListener = DataClient.OnDataChangedListener { dataEvents ->
        Log.e(TAG, "==== GLOBAL DATA CHANGED ====")
        dataEvents.forEach { event ->
            Log.e(TAG, "Path: ${event.dataItem.uri.path}")
        }
        Log.e(TAG, "=============================")
    }
    
    override fun onCreate() {
        super.onCreate()
        instance = this
        
        Log.e(TAG, "==== GLOBAL LISTENER SERVICE CREATED ====")
        Log.e(TAG, "Package: $packageName")
        Log.e(TAG, "Process: ${android.os.Process.myPid()}")
        
        try {
            messageClient = Wearable.getMessageClient(this)
            dataClient = Wearable.getDataClient(this)
            
            messageClient.addListener(messageListener)
            dataClient.addListener(dataListener)
            
            Log.e(TAG, "Listeners registered successfully")
            
            // Try to send a startup message
            scope.launch {
                try {
                    val nodes = Tasks.await(Wearable.getNodeClient(this@GlobalListenerService).connectedNodes)
                    Log.e(TAG, "Found ${nodes.size} connected nodes")
                    nodes.forEach { node ->
                        Log.e(TAG, "Sending startup message to ${node.displayName}")
                        Tasks.await(
                            messageClient.sendMessage(
                                node.id,
                                "/service/started",
                                "GlobalListenerService started".toByteArray()
                            )
                        )
                    }
                } catch (e: Exception) {
                    Log.e(TAG, "Failed to send startup message: ${e.message}")
                }
            }
            
        } catch (e: Exception) {
            Log.e(TAG, "Failed to register listeners: ${e.message}")
        }
        
        Log.e(TAG, "========================================")
    }
    
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        Log.e(TAG, "Service onStartCommand called")
        return START_STICKY // Keep running
    }
    
    override fun onDestroy() {
        Log.e(TAG, "==== GLOBAL LISTENER SERVICE DESTROYED ====")
        try {
            messageClient.removeListener(messageListener)
            dataClient.removeListener(dataListener)
        } catch (e: Exception) {
            Log.e(TAG, "Error removing listeners: ${e.message}")
        }
        scope.cancel()
        instance = null
        super.onDestroy()
    }
    
    override fun onBind(intent: Intent?): IBinder? = null
}