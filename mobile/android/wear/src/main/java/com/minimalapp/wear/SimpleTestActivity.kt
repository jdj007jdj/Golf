package com.minimalapp.wear

import android.os.Bundle
import android.widget.Button
import android.widget.TextView
import android.app.Activity
import com.google.android.gms.wearable.*
import java.text.SimpleDateFormat
import java.util.*
import android.net.Uri
import com.minimalapp.R

class SimpleTestActivity : Activity(), 
    MessageClient.OnMessageReceivedListener,
    CapabilityClient.OnCapabilityChangedListener {

    private lateinit var statusText: TextView
    private lateinit var logText: TextView
    private lateinit var sendButton: Button
    
    private lateinit var messageClient: MessageClient
    private lateinit var nodeClient: NodeClient
    private lateinit var capabilityClient: CapabilityClient
    
    private val logs = mutableListOf<String>()
    private var connectedNodeId: String? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Simple layout
        setContentView(R.layout.activity_simple_test)
        
        statusText = findViewById(R.id.status_text)
        logText = findViewById(R.id.log_text)
        sendButton = findViewById(R.id.send_button)
        
        // Force start our services
        try {
            val intent1 = android.content.Intent(this, com.minimalapp.wear.services.WearableListenerService::class.java)
            startService(intent1)
            addLog("Started WearableListenerService")
        } catch (e: Exception) {
            addLog("Failed to start service: ${e.message}")
        }
        
        try {
            val intent2 = android.content.Intent(this, com.minimalapp.wear.services.MinimalWearableService::class.java)
            startService(intent2)
            addLog("Started MinimalWearableService")
        } catch (e: Exception) {
            addLog("Failed to start minimal service: ${e.message}")
        }
        
        try {
            val intent3 = android.content.Intent(this, com.minimalapp.wear.services.DirectMessageService::class.java)
            startService(intent3)
            addLog("Started DirectMessageService")
        } catch (e: Exception) {
            addLog("Failed to start direct service: ${e.message}")
        }
        
        // Initialize Wearable API
        messageClient = Wearable.getMessageClient(this)
        nodeClient = Wearable.getNodeClient(this)
        capabilityClient = Wearable.getCapabilityClient(this)
        
        // Add listeners
        messageClient.addListener(this)
        capabilityClient.addListener(this, Uri.parse("wear://"), CapabilityClient.FILTER_REACHABLE)
        
        sendButton.setOnClickListener {
            sendTestMessage()
        }
        
        addLog("App started")
        checkConnection()
    }
    
    override fun onDestroy() {
        super.onDestroy()
        messageClient.removeListener(this)
        capabilityClient.removeListener(this)
    }
    
    override fun onMessageReceived(messageEvent: MessageEvent) {
        val message = String(messageEvent.data)
        addLog("RECEIVED: ${messageEvent.path} - $message")
        
        runOnUiThread {
            statusText.text = "Last message: $message"
            statusText.setTextColor(android.graphics.Color.GREEN)
        }
    }
    
    override fun onCapabilityChanged(capabilityInfo: CapabilityInfo) {
        addLog("Capability changed: ${capabilityInfo.name}")
        checkConnection()
    }
    
    private fun checkConnection() {
        nodeClient.connectedNodes.addOnSuccessListener { nodes ->
            connectedNodeId = nodes.firstOrNull()?.id
            val status = if (nodes.isNotEmpty()) {
                "Connected to: ${nodes.first().displayName}"
            } else {
                "No phone connected"
            }
            
            addLog("Connection check: ${nodes.size} nodes")
            nodes.forEach { node ->
                addLog("  - ${node.displayName} (${node.id})")
            }
            
            runOnUiThread {
                statusText.text = status
                sendButton.isEnabled = nodes.isNotEmpty()
            }
        }.addOnFailureListener { e ->
            addLog("Connection check failed: ${e.message}")
            runOnUiThread {
                statusText.text = "Connection check failed"
                sendButton.isEnabled = false
            }
        }
    }
    
    private fun sendTestMessage() {
        val nodeId = connectedNodeId ?: return
        val message = "Test from watch ${System.currentTimeMillis()}"
        
        messageClient.sendMessage(nodeId, "/test", message.toByteArray())
            .addOnSuccessListener {
                addLog("SENT: $message")
            }
            .addOnFailureListener { e ->
                addLog("SEND FAILED: ${e.message}")
            }
    }
    
    private fun addLog(message: String) {
        val timestamp = SimpleDateFormat("HH:mm:ss", Locale.getDefault()).format(Date())
        logs.add(0, "$timestamp: $message")
        if (logs.size > 20) logs.removeLast()
        
        runOnUiThread {
            logText.text = logs.joinToString("\n")
        }
    }
}