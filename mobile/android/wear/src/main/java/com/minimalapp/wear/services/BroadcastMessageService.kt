package com.minimalapp.wear.services
import com.minimalapp.R

import android.app.Service
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.IBinder
import android.util.Log
import android.widget.Toast
import org.json.JSONObject

/**
 * Service that handles broadcast-based communication from the phone
 * This is our fallback communication method since Wearable API is failing
 */
class BroadcastMessageService : Service() {
    
    companion object {
        const val TAG = "BroadcastMsgService"
        
        // Actions for different message types
        const val ACTION_ROUND_DATA = "com.minimalapp.wear.ROUND_DATA"
        const val ACTION_HOLE_DATA = "com.minimalapp.wear.HOLE_DATA"
        const val ACTION_SHOT_DATA = "com.minimalapp.wear.SHOT_DATA"
        const val ACTION_STATS_DATA = "com.minimalapp.wear.STATS_DATA"
        const val ACTION_TEST_MESSAGE = "com.minimalapp.wear.TEST_MESSAGE"
        
        // Keys for intent extras
        const val EXTRA_DATA = "data"
        const val EXTRA_MESSAGE = "message"
    }
    
    private val messageReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context, intent: Intent) {
            Log.e(TAG, "==== BROADCAST MESSAGE RECEIVED ====")
            Log.e(TAG, "Action: ${intent.action}")
            
            when (intent.action) {
                ACTION_ROUND_DATA -> handleRoundData(intent)
                ACTION_HOLE_DATA -> handleHoleData(intent)
                ACTION_SHOT_DATA -> handleShotData(intent)
                ACTION_STATS_DATA -> handleStatsData(intent)
                ACTION_TEST_MESSAGE -> handleTestMessage(intent)
            }
            
            Log.e(TAG, "==================================")
        }
    }
    
    override fun onCreate() {
        super.onCreate()
        Log.e(TAG, "BroadcastMessageService created")
        
        // Register for all our custom actions
        val filter = IntentFilter().apply {
            addAction(ACTION_ROUND_DATA)
            addAction(ACTION_HOLE_DATA)
            addAction(ACTION_SHOT_DATA)
            addAction(ACTION_STATS_DATA)
            addAction(ACTION_TEST_MESSAGE)
        }
        
        registerReceiver(messageReceiver, filter, Context.RECEIVER_EXPORTED)
        Log.e(TAG, "Broadcast receiver registered for all actions")
    }
    
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        Log.e(TAG, "Service onStartCommand called")
        return START_STICKY
    }
    
    override fun onDestroy() {
        super.onDestroy()
        try {
            unregisterReceiver(messageReceiver)
            Log.e(TAG, "Broadcast receiver unregistered")
        } catch (e: Exception) {
            Log.e(TAG, "Error unregistering receiver: ${e.message}")
        }
    }
    
    override fun onBind(intent: Intent?): IBinder? = null
    
    private fun handleRoundData(intent: Intent) {
        val data = intent.getStringExtra(EXTRA_DATA) ?: return
        Log.e(TAG, "Round data received: $data")
        
        try {
            val json = JSONObject(data)
            val courseName = json.optString("courseName", "Unknown Course")
            val currentHole = json.optInt("currentHole", 1)
            val totalScore = json.optInt("totalScore", 0)
            
            // Broadcast to activities
            sendBroadcast(Intent("com.minimalapp.wear.ROUND_UPDATE").apply {
                putExtra("courseName", courseName)
                putExtra("currentHole", currentHole)
                putExtra("totalScore", totalScore)
            })
            
            // Show confirmation
            Toast.makeText(this, "Round: $courseName Hole $currentHole", Toast.LENGTH_SHORT).show()
        } catch (e: Exception) {
            Log.e(TAG, "Error parsing round data: ${e.message}")
        }
    }
    
    private fun handleHoleData(intent: Intent) {
        val data = intent.getStringExtra(EXTRA_DATA) ?: return
        Log.e(TAG, "Hole data received: $data")
        
        try {
            val json = JSONObject(data)
            val holeNumber = json.optInt("holeNumber", 1)
            val par = json.optInt("par", 4)
            val distance = json.optInt("distance", 0)
            
            // Broadcast to activities
            sendBroadcast(Intent("com.minimalapp.wear.HOLE_UPDATE").apply {
                putExtra("holeNumber", holeNumber)
                putExtra("par", par)
                putExtra("distance", distance)
            })
        } catch (e: Exception) {
            Log.e(TAG, "Error parsing hole data: ${e.message}")
        }
    }
    
    private fun handleShotData(intent: Intent) {
        val data = intent.getStringExtra(EXTRA_DATA) ?: return
        Log.e(TAG, "Shot data received: $data")
        
        try {
            val json = JSONObject(data)
            val club = json.optString("club", "")
            val distance = json.optInt("distance", 0)
            
            // Broadcast to activities
            sendBroadcast(Intent("com.minimalapp.wear.SHOT_UPDATE").apply {
                putExtra("club", club)
                putExtra("distance", distance)
            })
        } catch (e: Exception) {
            Log.e(TAG, "Error parsing shot data: ${e.message}")
        }
    }
    
    private fun handleStatsData(intent: Intent) {
        val data = intent.getStringExtra(EXTRA_DATA) ?: return
        Log.e(TAG, "Stats data received: $data")
        
        // Broadcast raw stats data to activities
        sendBroadcast(Intent("com.minimalapp.wear.STATS_UPDATE").apply {
            putExtra("stats", data)
        })
    }
    
    private fun handleTestMessage(intent: Intent) {
        val message = intent.getStringExtra(EXTRA_MESSAGE) ?: "No message"
        Log.e(TAG, "Test message received: $message")
        
        Toast.makeText(this, "Phone says: $message", Toast.LENGTH_LONG).show()
        
        // Broadcast to activities
        sendBroadcast(Intent("com.minimalapp.wear.TEST_MESSAGE_RECEIVED").apply {
            putExtra("message", message)
        })
    }
}