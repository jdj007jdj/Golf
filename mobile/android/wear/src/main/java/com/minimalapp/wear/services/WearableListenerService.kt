package com.minimalapp.wear.services
import com.minimalapp.R

import android.content.Intent
import android.util.Log
import com.google.android.gms.wearable.DataEventBuffer
import com.google.android.gms.wearable.MessageEvent
import com.google.android.gms.wearable.WearableListenerService
import com.minimalapp.wear.MainActivity
import org.json.JSONObject

class WearableListenerService : WearableListenerService() {
    
    companion object {
        const val TAG = "WearListenerService"
        const val ACTION_ROUND_STARTED = "com.minimalapp.wear.ROUND_STARTED"
        const val ACTION_ROUND_ENDED = "com.minimalapp.wear.ROUND_ENDED"
        const val ACTION_STATS_UPDATE = "com.minimalapp.wear.STATS_UPDATE"
        const val ACTION_HOLE_CHANGED = "com.minimalapp.wear.HOLE_CHANGED"
    }
    
    override fun onCreate() {
        super.onCreate()
        Log.d(TAG, "===============================================")
        Log.d(TAG, "SERVICE CREATED! WearableListenerService is running")
        Log.d(TAG, "===============================================")
    }
    
    override fun onDestroy() {
        Log.d(TAG, "===============================================")
        Log.d(TAG, "SERVICE DESTROYED! WearableListenerService stopped")
        Log.d(TAG, "===============================================")
        super.onDestroy()
    }
    
    override fun onMessageReceived(messageEvent: MessageEvent) {
        super.onMessageReceived(messageEvent)
        
        // Comprehensive logging
        Log.d(TAG, "===============================================")
        Log.d(TAG, "MESSAGE RECEIVED!")
        Log.d(TAG, "Path: ${messageEvent.path}")
        Log.d(TAG, "From Node: ${messageEvent.sourceNodeId}")
        Log.d(TAG, "Data Size: ${messageEvent.data.size} bytes")
        Log.d(TAG, "Data String: ${String(messageEvent.data)}")
        Log.d(TAG, "===============================================")
        
        when (messageEvent.path) {
            "/round/start" -> handleRoundStart(messageEvent.data)
            "/round/end" -> handleRoundEnd()
            "/stats/update" -> handleStatsUpdate(messageEvent.data)
            "/hole/change" -> handleHoleChange(messageEvent.data)
            "/shot/confirmed" -> handleShotConfirmed()
            "/club/confirmed" -> handleClubConfirmed()
            "/putt/confirmed" -> handlePuttConfirmed()
            "/test/message" -> handleTestMessage(messageEvent.data, messageEvent.sourceNodeId)
            else -> {
                Log.w(TAG, "Unknown message path: ${messageEvent.path}")
                Log.w(TAG, "Message content: ${String(messageEvent.data)}")
            }
        }
    }
    
    override fun onDataChanged(dataEvents: DataEventBuffer) {
        super.onDataChanged(dataEvents)
        Log.d(TAG, "Data changed events: ${dataEvents.count}")
        
        dataEvents.forEach { event ->
            Log.d(TAG, "Data changed: ${event.dataItem.uri.path}")
            when (event.dataItem.uri.path) {
                "/round/data" -> {
                    // Forward to MainActivity
                    val intent = Intent(this, MainActivity::class.java).apply {
                        action = ACTION_ROUND_STARTED
                        putExtra("data", event.dataItem.data)
                        flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP
                    }
                    startActivity(intent)
                }
            }
        }
    }
    
    private fun handleRoundStart(data: ByteArray) {
        try {
            val dataString = String(data)
            Log.d(TAG, "Round start data: $dataString")
            
            // Start MainActivity with round data
            val intent = Intent(this, MainActivity::class.java).apply {
                action = ACTION_ROUND_STARTED
                putExtra("roundData", dataString)
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP
            }
            startActivity(intent)
        } catch (e: Exception) {
            Log.e(TAG, "Error handling round start", e)
        }
    }
    
    private fun handleRoundEnd() {
        Log.d(TAG, "Round ended")
        
        val intent = Intent(this, MainActivity::class.java).apply {
            action = ACTION_ROUND_ENDED
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP
        }
        startActivity(intent)
    }
    
    private fun handleStatsUpdate(data: ByteArray) {
        try {
            val dataString = String(data)
            Log.d(TAG, "Stats update: $dataString")
            
            // Broadcast to MainActivity if it's running
            val intent = Intent(ACTION_STATS_UPDATE).apply {
                putExtra("stats", dataString)
            }
            sendBroadcast(intent)
        } catch (e: Exception) {
            Log.e(TAG, "Error handling stats update", e)
        }
    }
    
    private fun handleHoleChange(data: ByteArray) {
        try {
            val dataString = String(data)
            Log.d(TAG, "Hole change: $dataString")
            
            val intent = Intent(ACTION_HOLE_CHANGED).apply {
                putExtra("holeData", dataString)
            }
            sendBroadcast(intent)
        } catch (e: Exception) {
            Log.e(TAG, "Error handling hole change", e)
        }
    }
    
    private fun handleShotConfirmed() {
        Log.d(TAG, "Shot confirmed by phone")
    }
    
    private fun handleClubConfirmed() {
        Log.d(TAG, "Club selection confirmed by phone")
    }
    
    private fun handlePuttConfirmed() {
        Log.d(TAG, "Putt count confirmed by phone")
    }
    
    private fun handleTestMessage(data: ByteArray, nodeId: String) {
        val message = String(data)
        Log.d(TAG, "===============================================")
        Log.d(TAG, "TEST MESSAGE RECEIVED!")
        Log.d(TAG, "Content: $message")
        Log.d(TAG, "From Node: $nodeId")
        Log.d(TAG, "===============================================")
        
        // Optional: Show notification or update UI
        // For now, just log it clearly
    }
}