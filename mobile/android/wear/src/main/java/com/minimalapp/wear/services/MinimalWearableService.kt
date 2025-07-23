package com.minimalapp.wear.services
import com.minimalapp.R

import android.util.Log
import com.google.android.gms.wearable.MessageEvent
import com.google.android.gms.wearable.WearableListenerService

class MinimalWearableService : WearableListenerService() {
    
    companion object {
        const val TAG = "MinimalWearService"
    }
    
    override fun onCreate() {
        super.onCreate()
        Log.e(TAG, "========== MINIMAL SERVICE CREATED ==========")
        Log.e(TAG, "Package: ${packageName}")
        Log.e(TAG, "Process: ${android.os.Process.myPid()}")
        
        // Broadcast that service started
        sendBroadcast(android.content.Intent("com.minimalapp.wear.SERVICE_LOG").apply {
            putExtra("message", "MinimalWearableService CREATED")
        })
    }
    
    override fun onMessageReceived(messageEvent: MessageEvent) {
        Log.e(TAG, "========== MESSAGE RECEIVED ==========")
        Log.e(TAG, "Path: ${messageEvent.path}")
        Log.e(TAG, "Data: ${String(messageEvent.data)}")
        Log.e(TAG, "From: ${messageEvent.sourceNodeId}")
        Log.e(TAG, "=====================================")
        
        // Broadcast message received
        sendBroadcast(android.content.Intent("com.minimalapp.wear.SERVICE_LOG").apply {
            putExtra("message", "Message received: ${messageEvent.path} - ${String(messageEvent.data)}")
        })
        
        // Call super to maintain compatibility
        super.onMessageReceived(messageEvent)
    }
    
    override fun onDestroy() {
        Log.e(TAG, "========== SERVICE DESTROYED ==========")
        super.onDestroy()
    }
}