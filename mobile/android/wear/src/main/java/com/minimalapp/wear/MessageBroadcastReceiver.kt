package com.minimalapp.wear
import com.minimalapp.R

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import android.widget.Toast
import org.json.JSONObject

/**
 * Static broadcast receiver for phone-to-watch communication
 * This works around Android's implicit broadcast restrictions
 */
class MessageBroadcastReceiver : BroadcastReceiver() {
    
    companion object {
        const val TAG = "MessageReceiver"
        
        // Actions
        const val ACTION_ROUND_DATA = "com.minimalapp.wear.ROUND_DATA"
        const val ACTION_HOLE_DATA = "com.minimalapp.wear.HOLE_DATA"
        const val ACTION_SHOT_DATA = "com.minimalapp.wear.SHOT_DATA"
        const val ACTION_STATS_DATA = "com.minimalapp.wear.STATS_DATA"
        const val ACTION_TEST_MESSAGE = "com.minimalapp.wear.TEST_MESSAGE"
        
        // Keys
        const val EXTRA_DATA = "data"
        const val EXTRA_MESSAGE = "message"
    }
    
    override fun onReceive(context: Context, intent: Intent) {
        Log.e(TAG, "==== MESSAGE BROADCAST RECEIVED ====")
        Log.e(TAG, "Action: ${intent.action}")
        Log.e(TAG, "Extras: ${intent.extras}")
        
        when (intent.action) {
            ACTION_ROUND_DATA -> handleRoundData(context, intent)
            ACTION_HOLE_DATA -> handleHoleData(context, intent)
            ACTION_SHOT_DATA -> handleShotData(context, intent)
            ACTION_STATS_DATA -> handleStatsData(context, intent)
            ACTION_TEST_MESSAGE -> handleTestMessage(context, intent)
        }
        
        Log.e(TAG, "==================================")
    }
    
    private fun handleRoundData(context: Context, intent: Intent) {
        val data = intent.getStringExtra(EXTRA_DATA) ?: return
        Log.e(TAG, "Round data: $data")
        
        try {
            val json = JSONObject(data)
            val courseName = json.optString("courseName", "Unknown")
            val currentHole = json.optInt("currentHole", 1)
            val totalScore = json.optInt("totalScore", 0)
            
            Toast.makeText(context, "Round: $courseName H$currentHole Score:$totalScore", Toast.LENGTH_LONG).show()
            
            // Send to any listening activities
            context.sendBroadcast(Intent("com.minimalapp.wear.ROUND_UPDATE").apply {
                putExtra("courseName", courseName)
                putExtra("currentHole", currentHole)
                putExtra("totalScore", totalScore)
            })
        } catch (e: Exception) {
            Log.e(TAG, "Error parsing round data: ${e.message}")
        }
    }
    
    private fun handleHoleData(context: Context, intent: Intent) {
        val data = intent.getStringExtra(EXTRA_DATA) ?: return
        Log.e(TAG, "Hole data: $data")
        
        try {
            val json = JSONObject(data)
            val holeNumber = json.optInt("holeNumber", 1)
            val par = json.optInt("par", 4)
            val distance = json.optInt("distance", 0)
            
            Toast.makeText(context, "Hole $holeNumber Par $par ${distance}yd", Toast.LENGTH_SHORT).show()
            
            context.sendBroadcast(Intent("com.minimalapp.wear.HOLE_UPDATE").apply {
                putExtra("holeNumber", holeNumber)
                putExtra("par", par)
                putExtra("distance", distance)
            })
        } catch (e: Exception) {
            Log.e(TAG, "Error parsing hole data: ${e.message}")
        }
    }
    
    private fun handleShotData(context: Context, intent: Intent) {
        val data = intent.getStringExtra(EXTRA_DATA) ?: return
        Log.e(TAG, "Shot data: $data")
        
        try {
            val json = JSONObject(data)
            val club = json.optString("club", "")
            val distance = json.optInt("distance", 0)
            
            Toast.makeText(context, "Shot: $club ${distance}yd", Toast.LENGTH_SHORT).show()
            
            context.sendBroadcast(Intent("com.minimalapp.wear.SHOT_UPDATE").apply {
                putExtra("club", club)
                putExtra("distance", distance)
            })
        } catch (e: Exception) {
            Log.e(TAG, "Error parsing shot data: ${e.message}")
        }
    }
    
    private fun handleStatsData(context: Context, intent: Intent) {
        val data = intent.getStringExtra(EXTRA_DATA) ?: return
        Log.e(TAG, "Stats data: $data")
        
        context.sendBroadcast(Intent("com.minimalapp.wear.STATS_UPDATE").apply {
            putExtra("stats", data)
        })
    }
    
    private fun handleTestMessage(context: Context, intent: Intent) {
        val message = intent.getStringExtra(EXTRA_MESSAGE) ?: "No message"
        Log.e(TAG, "Test message: $message")
        
        Toast.makeText(context, "Phone says: $message", Toast.LENGTH_LONG).show()
        
        context.sendBroadcast(Intent("com.minimalapp.wear.TEST_MESSAGE_RECEIVED").apply {
            putExtra("message", message)
        })
    }
}