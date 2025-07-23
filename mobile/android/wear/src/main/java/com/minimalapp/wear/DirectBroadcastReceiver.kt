package com.minimalapp.wear
import com.minimalapp.R

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log

/**
 * Direct broadcast receiver to catch any messages
 * This completely bypasses the Wearable API
 */
class DirectBroadcastReceiver : BroadcastReceiver() {
    
    companion object {
        const val TAG = "DirectBroadcast"
        const val ACTION_MESSAGE = "com.minimalapp.wear.MESSAGE"
    }
    
    override fun onReceive(context: Context, intent: Intent) {
        Log.e(TAG, "==== BROADCAST RECEIVED ====")
        Log.e(TAG, "Action: ${intent.action}")
        Log.e(TAG, "Extras: ${intent.extras}")
        
        when (intent.action) {
            ACTION_MESSAGE -> {
                val message = intent.getStringExtra("message") ?: "No message"
                val path = intent.getStringExtra("path") ?: "No path"
                
                Log.e(TAG, "Message: $message")
                Log.e(TAG, "Path: $path")
                
                // Start MainActivity if needed
                if (path == "/round/start") {
                    val activityIntent = Intent(context, MainActivity::class.java).apply {
                        action = "com.minimalapp.wear.ROUND_STARTED"
                        putExtra("roundData", message)
                        flags = Intent.FLAG_ACTIVITY_NEW_TASK
                    }
                    context.startActivity(activityIntent)
                }
            }
        }
        
        Log.e(TAG, "===========================")
    }
}