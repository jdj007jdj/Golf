package com.minimalapp.wear
import com.minimalapp.R

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import android.widget.Toast

/**
 * Test receiver that bypasses Wearable API completely
 */
class DirectTestReceiver : BroadcastReceiver() {
    
    companion object {
        const val TAG = "DirectTestReceiver"
        const val ACTION_TEST = "com.minimalapp.wear.DIRECT_TEST"
    }
    
    override fun onReceive(context: Context, intent: Intent) {
        Log.e(TAG, "==== DIRECT BROADCAST RECEIVED ====")
        Log.e(TAG, "Action: ${intent.action}")
        Log.e(TAG, "Message: ${intent.getStringExtra("message")}")
        Log.e(TAG, "==================================")
        
        // Show toast to confirm receipt
        Toast.makeText(context, "DIRECT MESSAGE: ${intent.getStringExtra("message")}", Toast.LENGTH_LONG).show()
    }
}