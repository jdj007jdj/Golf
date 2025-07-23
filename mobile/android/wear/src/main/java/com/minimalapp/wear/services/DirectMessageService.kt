package com.minimalapp.wear.services
import com.minimalapp.R

import android.app.Service
import android.content.Intent
import android.os.IBinder
import android.util.Log
import com.google.android.gms.wearable.*
import com.minimalapp.wear.MainActivity

/**
 * Alternative service that directly listens for messages
 * This bypasses WearableListenerService issues
 */
class DirectMessageService : Service(), MessageClient.OnMessageReceivedListener {
    
    companion object {
        const val TAG = "DirectMessageService"
    }
    
    private lateinit var messageClient: MessageClient
    
    override fun onCreate() {
        super.onCreate()
        Log.e(TAG, "========== DIRECT SERVICE CREATED ==========")
        
        messageClient = Wearable.getMessageClient(this)
        messageClient.addListener(this)
        
        Log.e(TAG, "Direct message listener registered")
    }
    
    override fun onMessageReceived(messageEvent: MessageEvent) {
        Log.e(TAG, "========== DIRECT MESSAGE RECEIVED ==========")
        Log.e(TAG, "Path: ${messageEvent.path}")
        Log.e(TAG, "Data: ${String(messageEvent.data)}")
        Log.e(TAG, "From: ${messageEvent.sourceNodeId}")
        Log.e(TAG, "==========================================")
        
        // Handle specific messages
        when (messageEvent.path) {
            "/test/message" -> {
                Log.e(TAG, "Test message content: ${String(messageEvent.data)}")
                // Send broadcast to UI
                sendBroadcast(Intent("com.minimalapp.wear.MESSAGE_RECEIVED").apply {
                    putExtra("path", messageEvent.path)
                    putExtra("data", String(messageEvent.data))
                })
            }
            "/round/start" -> {
                // Start MainActivity with round data
                val intent = Intent(this, MainActivity::class.java).apply {
                    action = "com.minimalapp.wear.ROUND_STARTED"
                    putExtra("roundData", String(messageEvent.data))
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP
                }
                startActivity(intent)
            }
        }
    }
    
    override fun onDestroy() {
        Log.e(TAG, "========== DIRECT SERVICE DESTROYED ==========")
        messageClient.removeListener(this)
        super.onDestroy()
    }
    
    override fun onBind(intent: Intent?): IBinder? = null
}