package com.minimalapp.wear
import com.minimalapp.R

import android.app.Activity
import android.os.Bundle
import android.widget.TextView
import android.util.Log
import com.google.android.gms.wearable.*
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.net.Uri
import java.text.SimpleDateFormat
import java.util.*

/**
 * Minimal test activity to diagnose Wear OS communication issues
 */
class TestConnectionActivity : Activity() {
    
    companion object {
        const val TAG = "TestConnection"
    }
    
    private lateinit var logTextView: TextView
    private val logs = mutableListOf<String>()
    
    // Broadcast receiver for service messages
    private val serviceReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            when (intent?.action) {
                "com.minimalapp.wear.SERVICE_LOG" -> {
                    val message = intent.getStringExtra("message") ?: ""
                    addLog("[SERVICE] $message")
                }
            }
        }
    }
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Create simple UI
        logTextView = TextView(this).apply {
            setPadding(20, 20, 20, 20)
            textSize = 10f
            setTextColor(android.graphics.Color.WHITE)
        }
        setContentView(logTextView)
        
        // Register broadcast receiver
        registerReceiver(serviceReceiver, IntentFilter("com.minimalapp.wear.SERVICE_LOG"))
        
        addLog("=== WEAR OS CONNECTION TEST ===")
        addLog("Package: ${packageName}")
        addLog("Process: ${android.os.Process.myPid()}")
        
        // Test 1: Force start services
        testServiceStart()
        
        // Test 2: Check Wearable API availability
        testWearableAPI()
        
        // Test 3: Register message listener directly
        testDirectListener()
    }
    
    override fun onDestroy() {
        super.onDestroy()
        unregisterReceiver(serviceReceiver)
    }
    
    private fun testServiceStart() {
        addLog("\n--- Testing Service Start ---")
        
        try {
            // Try to start WearableListenerService
            val intent1 = Intent(this, com.minimalapp.wear.services.WearableListenerService::class.java)
            val component1 = startService(intent1)
            addLog("WearableListenerService start: ${if (component1 != null) "SUCCESS" else "FAILED"}")
        } catch (e: Exception) {
            addLog("WearableListenerService error: ${e.message}")
        }
        
        try {
            // Try to start MinimalWearableService
            val intent2 = Intent(this, com.minimalapp.wear.services.MinimalWearableService::class.java)
            val component2 = startService(intent2)
            addLog("MinimalWearableService start: ${if (component2 != null) "SUCCESS" else "FAILED"}")
        } catch (e: Exception) {
            addLog("MinimalWearableService error: ${e.message}")
        }
    }
    
    private fun testWearableAPI() {
        addLog("\n--- Testing Wearable API ---")
        
        try {
            val nodeClient = Wearable.getNodeClient(this)
            val messageClient = Wearable.getMessageClient(this)
            val dataClient = Wearable.getDataClient(this)
            
            addLog("NodeClient: ${if (nodeClient != null) "OK" else "NULL"}")
            addLog("MessageClient: ${if (messageClient != null) "OK" else "NULL"}")
            addLog("DataClient: ${if (dataClient != null) "OK" else "NULL"}")
            
            // Check connected nodes
            nodeClient.connectedNodes.addOnSuccessListener { nodes ->
                addLog("\nConnected nodes: ${nodes.size}")
                nodes.forEach { node ->
                    addLog("  - ${node.displayName} (${node.id})")
                    addLog("    isNearby: ${node.isNearby}")
                }
            }.addOnFailureListener { e ->
                addLog("Failed to get nodes: ${e.message}")
            }
            
        } catch (e: Exception) {
            addLog("Wearable API error: ${e.message}")
        }
    }
    
    private fun testDirectListener() {
        addLog("\n--- Testing Direct Message Listener ---")
        
        try {
            val messageClient = Wearable.getMessageClient(this)
            
            // Create a direct listener
            val listener = object : MessageClient.OnMessageReceivedListener {
                override fun onMessageReceived(messageEvent: MessageEvent) {
                    val message = String(messageEvent.data)
                    addLog("\n!!! DIRECT MESSAGE RECEIVED !!!")
                    addLog("Path: ${messageEvent.path}")
                    addLog("Data: $message")
                    addLog("From: ${messageEvent.sourceNodeId}")
                }
            }
            
            messageClient.addListener(listener)
            addLog("Direct listener registered successfully")
            
            // Also add capability listener
            val capabilityClient = Wearable.getCapabilityClient(this)
            capabilityClient.addListener({ capability ->
                addLog("\nCapability changed: ${capability.name}")
            }, Uri.parse("wear://"), CapabilityClient.FILTER_ALL)
            
        } catch (e: Exception) {
            addLog("Direct listener error: ${e.message}")
        }
    }
    
    private fun addLog(message: String) {
        val timestamp = SimpleDateFormat("HH:mm:ss.SSS", Locale.getDefault()).format(Date())
        val logMessage = "$timestamp: $message"
        logs.add(logMessage)
        
        // Keep only last 50 lines
        if (logs.size > 50) {
            logs.removeAt(0)
        }
        
        runOnUiThread {
            logTextView.text = logs.joinToString("\n")
        }
        
        // Also log to logcat with high visibility
        Log.e(TAG, message)
    }
}