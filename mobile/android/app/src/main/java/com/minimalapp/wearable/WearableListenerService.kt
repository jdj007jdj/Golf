package com.minimalapp.wearable

import android.content.Intent
import android.util.Log
import com.google.android.gms.wearable.MessageEvent
import com.google.android.gms.wearable.WearableListenerService
import org.json.JSONObject

class WearableListenerService : WearableListenerService() {
    
    companion object {
        const val TAG = "WearableListener"
        const val ACTION_SHOT_RECORDED = "com.minimalapp.SHOT_RECORDED"
        const val ACTION_CLUB_SELECTED = "com.minimalapp.CLUB_SELECTED"
        const val ACTION_PUTT_UPDATED = "com.minimalapp.PUTT_UPDATED"
        
        const val EXTRA_DATA = "data"
        const val EXTRA_NODE_ID = "nodeId"
    }
    
    override fun onMessageReceived(messageEvent: MessageEvent) {
        super.onMessageReceived(messageEvent)
        
        Log.d(TAG, "Message received in service: ${messageEvent.path}")
        
        val data = String(messageEvent.data)
        
        when (messageEvent.path) {
            WearableModule.PATH_SHOT_RECORDED -> {
                broadcastToApp(ACTION_SHOT_RECORDED, data, messageEvent.sourceNodeId)
            }
            WearableModule.PATH_CLUB_SELECTED -> {
                broadcastToApp(ACTION_CLUB_SELECTED, data, messageEvent.sourceNodeId)
            }
            WearableModule.PATH_PUTT_UPDATED -> {
                broadcastToApp(ACTION_PUTT_UPDATED, data, messageEvent.sourceNodeId)
            }
        }
    }
    
    private fun broadcastToApp(action: String, data: String, nodeId: String) {
        val intent = Intent(action).apply {
            putExtra(EXTRA_DATA, data)
            putExtra(EXTRA_NODE_ID, nodeId)
            setPackage(packageName)
        }
        sendBroadcast(intent)
        
        Log.d(TAG, "Broadcast sent: $action")
    }
}