package com.minimalapp.wear
import com.minimalapp.R

import android.app.Application
import android.content.Intent
import android.util.Log

class WearApplication : Application() {
    
    companion object {
        const val TAG = "WearApplication"
    }
    
    override fun onCreate() {
        super.onCreate()
        
        Log.e(TAG, "==== WEAR APPLICATION CREATED ====")
        Log.e(TAG, "Starting GlobalListenerService...")
        
        try {
            val intent = Intent(this, GlobalListenerService::class.java)
            startService(intent)
            Log.e(TAG, "GlobalListenerService start initiated")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to start GlobalListenerService: ${e.message}")
        }
        
        // Start our broadcast message service
        try {
            val broadcastIntent = Intent(this, com.minimalapp.wear.services.BroadcastMessageService::class.java)
            startService(broadcastIntent)
            Log.e(TAG, "BroadcastMessageService start initiated")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to start BroadcastMessageService: ${e.message}")
        }
        
        Log.e(TAG, "==================================")
    }
}