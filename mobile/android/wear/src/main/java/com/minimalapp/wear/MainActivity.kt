package com.minimalapp.wear

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.view.MotionEvent
import android.widget.Toast
import androidx.fragment.app.FragmentActivity
import androidx.viewpager2.adapter.FragmentStateAdapter
import androidx.viewpager2.widget.ViewPager2
import androidx.wear.widget.SwipeDismissFrameLayout
import com.minimalapp.databinding.ActivityMainBinding
import com.minimalapp.R
import com.minimalapp.BuildConfig
import com.minimalapp.wear.fragments.ShotRecordingFragment
import com.minimalapp.wear.fragments.ClubFragment
import com.minimalapp.wear.fragments.PuttFragment
import com.minimalapp.wear.fragments.StatsFragment
import com.minimalapp.wear.services.WearableListenerService
import com.google.android.gms.wearable.*
import org.json.JSONObject
import android.widget.TextView
import android.widget.Button
import android.widget.ScrollView
import kotlinx.coroutines.*
import com.google.android.gms.tasks.Tasks
import android.util.Log
import com.google.android.material.button.MaterialButton

class MainActivity : FragmentActivity(), 
    DataClient.OnDataChangedListener,
    MessageClient.OnMessageReceivedListener {

    companion object {
        const val TAG = "GolfWearMain"
        const val PATH_REQUEST_ROUND = "/round/request"
        const val PATH_ROUND_RESPONSE = "/round/response"
    }

    private lateinit var binding: ActivityMainBinding
    private lateinit var dataClient: DataClient
    private lateinit var messageClient: MessageClient
    private lateinit var nodeClient: NodeClient
    private lateinit var viewPager: ViewPager2
    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    
    // UI elements
    private var connectButton: MaterialButton? = null
    private var connectionStatus: TextView? = null
    
    // Current round data
    private var currentRoundId: String? = null
    private var currentHole: Int = 1
    private var isRoundActive: Boolean = false
    private val holeScores = mutableMapOf<Int, Int>() // Track scores for each hole

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        // Initialize Wearable API clients
        dataClient = Wearable.getDataClient(this)
        messageClient = Wearable.getMessageClient(this)
        nodeClient = Wearable.getNodeClient(this)

        // Register listeners directly
        Log.d(TAG, "Registering message and data listeners")
        messageClient.addListener(this)
        dataClient.addListener(this)

        setupViewPager()
        setupSwipeDismiss()
        setupTestButton()
        
        // Get UI references and setup connect button with multiple approaches
        connectButton = findViewById<MaterialButton>(R.id.connect_round_button)
        connectionStatus = findViewById<TextView>(R.id.connection_status)
        
        // Try multiple ways to ensure button works
        connectButton?.let { button ->
            Log.d(TAG, "Connect button found: $button")
            Log.d(TAG, "Button visibility: ${button.visibility}, enabled: ${button.isEnabled}")
            
            // Add touch listener to debug
            button.setOnTouchListener { v, event ->
                Log.d(TAG, "Connect button touched! Event: $event")
                false // Return false to allow click to process
            }
            
            button.setOnClickListener {
                Log.d(TAG, "Connect button clicked (direct)!")
                requestActiveRound()
            }
        } ?: Log.e(TAG, "Connect button is NULL!")
        
        // Also try finding by different approach
        findViewById<View>(R.id.connect_round_button)?.setOnClickListener {
            Log.d(TAG, "Connect button clicked (findViewById)!")
            requestActiveRound()
        }
        
        setupConnectButton()
        
        // Set version text
        findViewById<TextView>(R.id.version_text)?.text = "v${BuildConfig.VERSION_NAME}"
        
        // Handle intent from WearableListenerService
        handleIntent(intent)
        
        // Try to manually start the services
        try {
            val serviceIntent = Intent(this, WearableListenerService::class.java)
            startService(serviceIntent)
            Log.d(TAG, "Manually started WearableListenerService")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to start WearableListenerService", e)
        }
        
        // Also start DirectMessageService as backup
        try {
            val directIntent = Intent(this, com.minimalapp.wear.services.DirectMessageService::class.java)
            startService(directIntent)
            Log.d(TAG, "Started DirectMessageService as backup")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to start DirectMessageService", e)
        }
    }
    
    override fun onNewIntent(intent: Intent?) {
        super.onNewIntent(intent)
        intent?.let { handleIntent(it) }
    }
    
    private fun handleIntent(intent: Intent) {
        when (intent.action) {
            WearableListenerService.ACTION_ROUND_STARTED -> {
                val roundData = intent.getStringExtra("roundData")
                if (roundData != null) {
                    try {
                        val json = JSONObject(roundData)
                        isRoundActive = true
                        currentRoundId = json.optString("roundId", "unknown")
                        currentHole = json.optInt("currentHole", 1)
                        
                        Log.d(TAG, "Round started from intent with data: $json")
                        
                        runOnUiThread {
                            updateUIForRoundStatus()
                            updateAllFragmentsHole()
                            val courseName = json.optString("courseName", "Unknown Course")
                            Toast.makeText(this, "Round Started at $courseName!", Toast.LENGTH_SHORT).show()
                        }
                    } catch (e: Exception) {
                        Log.e(TAG, "Error handling round start from intent", e)
                        e.printStackTrace()
                    }
                }
            }
            WearableListenerService.ACTION_ROUND_ENDED -> {
                isRoundActive = false
                currentRoundId = null
                runOnUiThread {
                    updateUIForRoundStatus()
                    Toast.makeText(this, "Round Ended", Toast.LENGTH_SHORT).show()
                }
            }
        }
    }

    private fun setupViewPager() {
        try {
            viewPager = findViewById(R.id.view_pager)
            val pagerAdapter = ScreenSlidePagerAdapter(this)
            viewPager.adapter = pagerAdapter
            
            // Disable swipe when no round is active
            viewPager.isUserInputEnabled = isRoundActive
            
            // Show appropriate screen based on round status
            updateUIForRoundStatus()
        } catch (e: Exception) {
            Log.e(TAG, "Error setting up ViewPager", e)
            Toast.makeText(this, "Error initializing UI: ${e.message}", Toast.LENGTH_LONG).show()
        }
    }

    private fun setupSwipeDismiss() {
        binding.swipeDismissRoot.addCallback(object : SwipeDismissFrameLayout.Callback() {
            override fun onDismissed(layout: SwipeDismissFrameLayout) {
                finish()
            }
        })
    }

    override fun onResume() {
        super.onResume()
        Log.d(TAG, "onResume called")
        dataClient.addListener(this)
        messageClient.addListener(this)
        checkPhoneConnection()
        
        // If no round is active, try to connect automatically
        if (!isRoundActive) {
            Log.d(TAG, "No active round on resume, checking for active round on phone")
            // Give a small delay for services to reconnect
            scope.launch {
                delay(500)
                runOnUiThread {
                    if (!isRoundActive && connectButton?.isEnabled == true) {
                        requestActiveRound()
                    }
                }
            }
        }
    }

    override fun onPause() {
        super.onPause()
        dataClient.removeListener(this)
        messageClient.removeListener(this)
        
        // Stop location updates in all fragments to save battery
        supportFragmentManager.fragments.forEach { fragment ->
            if (fragment is ShotRecordingFragment) {
                fragment.onPause()
            }
        }
    }

    private fun checkPhoneConnection() {
        Wearable.getNodeClient(this).connectedNodes
            .addOnSuccessListener { nodes ->
                val isConnected = nodes.isNotEmpty()
                updateConnectionStatus(isConnected)
            }
    }

    private fun updateConnectionStatus(isConnected: Boolean) {
        if (!isConnected) {
            Toast.makeText(this, R.string.not_connected, Toast.LENGTH_SHORT).show()
        }
    }

    override fun onDataChanged(dataEvents: DataEventBuffer) {
        Log.d(TAG, "===============================================")
        Log.d(TAG, "DATA CHANGED IN MAINACTIVITY!")
        dataEvents.forEach { event ->
            Log.d(TAG, "Data event path: ${event.dataItem.uri.path}")
            when (event.dataItem.uri.path) {
                "/round/data" -> handleRoundData(event.dataItem)
                "/stats/data" -> handleStatsData(event.dataItem)
            }
        }
        Log.d(TAG, "===============================================")
    }

    override fun onMessageReceived(messageEvent: MessageEvent) {
        Log.d(TAG, "===============================================")
        Log.d(TAG, "MESSAGE RECEIVED IN MAINACTIVITY!")
        Log.d(TAG, "Path: ${messageEvent.path}")
        Log.d(TAG, "From: ${messageEvent.sourceNodeId}")
        Log.d(TAG, "Data: ${String(messageEvent.data)}")
        Log.d(TAG, "===============================================")
        
        when (messageEvent.path) {
            "/round/start" -> handleRoundStarted(messageEvent.data)
            "/round/end" -> handleRoundEnded()
            "/stats/update" -> handleStatsUpdate(messageEvent.data)
            "/hole/change" -> handleHoleChange(messageEvent.data)
            "/score/update" -> handleScoreUpdate(messageEvent.data)
            PATH_ROUND_RESPONSE -> handleRoundResponse(messageEvent.data)
            "/test/message" -> {
                runOnUiThread {
                    Toast.makeText(this, "Test received: ${String(messageEvent.data)}", Toast.LENGTH_LONG).show()
                }
            }
        }
    }

    private fun handleRoundData(dataItem: DataItem) {
        try {
            val dataString = String(dataItem.data ?: return)
            val roundData = JSONObject(dataString)
            
            isRoundActive = true
            currentRoundId = roundData.optString("roundId", "unknown")
            currentHole = roundData.optInt("currentHole", 1)
            
            Log.d(TAG, "Round data received from DataClient: $roundData")
            
            runOnUiThread {
                updateUIForRoundStatus()
                updateAllFragmentsHole()
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error handling round data from DataClient", e)
            e.printStackTrace()
        }
    }

    private fun handleStatsData(dataItem: DataItem) {
        try {
            val dataString = String(dataItem.data ?: return)
            val statsData = JSONObject(dataString)
            
            val distanceToPin = if (statsData.has("distanceToPin")) statsData.getInt("distanceToPin") else -1
            val distanceLastShot = if (statsData.has("distanceLastShot")) statsData.getInt("distanceLastShot") else -1
            val measurementUnit = statsData.getString("measurementUnit")
            
            runOnUiThread {
                // Update stats fragment if visible
                val statsFragment = supportFragmentManager.findFragmentByTag("f3") as? StatsFragment
                statsFragment?.updateStats(distanceToPin, distanceLastShot, measurementUnit)
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    private fun handleStatsUpdate(data: ByteArray) {
        try {
            val statsData = JSONObject(String(data))
            
            val distanceToPin = if (statsData.has("distanceToPin")) statsData.getInt("distanceToPin") else -1
            val distanceLastShot = if (statsData.has("distanceLastShot")) statsData.getInt("distanceLastShot") else -1
            val measurementUnit = statsData.getString("measurementUnit")
            
            runOnUiThread {
                // Update stats fragment if visible
                val statsFragment = supportFragmentManager.findFragmentByTag("f3") as? StatsFragment
                statsFragment?.updateStats(distanceToPin, distanceLastShot, measurementUnit)
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    private fun handleHoleChange(data: ByteArray) {
        try {
            val holeData = JSONObject(String(data))
            currentHole = holeData.getInt("currentHole")
            
            runOnUiThread {
                updateAllFragmentsHole()
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
    
    private fun handleScoreUpdate(data: ByteArray) {
        try {
            val scoreData = JSONObject(String(data))
            val holeNumber = scoreData.getInt("holeNumber")
            val score = scoreData.getInt("score")
            
            Log.d(TAG, "Score update received: Hole $holeNumber, Score $score")
            
            // Store the score
            holeScores[holeNumber] = score
            
            runOnUiThread {
                // Update shot count in ShotRecordingFragment
                supportFragmentManager.fragments.forEach { fragment ->
                    if (fragment is ShotRecordingFragment) {
                        fragment.updateShotCount(holeNumber, score)
                    }
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error handling score update", e)
        }
    }

    private fun handleRoundStarted(data: ByteArray) {
        try {
            val roundData = JSONObject(String(data))
            
            isRoundActive = true
            // Use optString to handle missing or null roundId
            currentRoundId = roundData.optString("roundId", "unknown")
            currentHole = roundData.optInt("currentHole", 1)
            
            // Clear scores for new round
            holeScores.clear()
            
            // Log the received data for debugging
            Log.d(TAG, "Round started with data: $roundData")
            Log.d(TAG, "RoundId: $currentRoundId, CurrentHole: $currentHole")
            
            runOnUiThread {
                viewPager.isUserInputEnabled = true
                updateUIForRoundStatus()
                updateAllFragmentsHole()
                
                val courseName = roundData.optString("courseName", "Unknown Course")
                Toast.makeText(this, "Round Started at $courseName", Toast.LENGTH_SHORT).show()
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error handling round start", e)
            e.printStackTrace()
            runOnUiThread {
                Toast.makeText(this, "Error starting round: ${e.message}", Toast.LENGTH_LONG).show()
            }
        }
    }

    private fun handleRoundEnded() {
        isRoundActive = false
        currentRoundId = null
        holeScores.clear()
        runOnUiThread {
            viewPager.isUserInputEnabled = false
            updateUIForRoundStatus()
            Toast.makeText(this, "Round Ended", Toast.LENGTH_SHORT).show()
        }
    }

    private fun handleShotConfirmed() {
        runOnUiThread {
            Toast.makeText(this, R.string.shot_recorded, Toast.LENGTH_SHORT).show()
            // Navigate to club selection
            viewPager.currentItem = 1
        }
    }

    private fun handleClubConfirmed() {
        runOnUiThread {
            Toast.makeText(this, R.string.club_selected, Toast.LENGTH_SHORT).show()
        }
    }

    private fun updateUIForRoundStatus() {
        try {
            val noRoundLayout = findViewById<ScrollView>(R.id.no_round_layout)
            if (!isRoundActive) {
                // Show "waiting for round" screen
                viewPager.visibility = View.GONE
                noRoundLayout?.visibility = View.VISIBLE
                
                // Re-setup connect button when showing no round layout
                val button = findViewById<MaterialButton>(R.id.connect_round_button)
                Log.d(TAG, "updateUIForRoundStatus - Connect button: $button, enabled: ${button?.isEnabled}")
                button?.setOnClickListener {
                    Log.d(TAG, "Connect button clicked from updateUI!")
                    requestActiveRound()
                }
            } else {
                viewPager.visibility = View.VISIBLE
                noRoundLayout?.visibility = View.GONE
                // Notify adapter of data change when round becomes active
                viewPager.adapter?.notifyDataSetChanged()
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error updating UI for round status", e)
        }
    }

    private fun updateAllFragmentsHole() {
        // Update each fragment with current hole
        supportFragmentManager.fragments.forEach { fragment ->
            when (fragment) {
                is ShotRecordingFragment -> fragment.updateHole(currentHole)
                is ClubFragment -> fragment.updateHole(currentHole)
                is PuttFragment -> fragment.updateHole(currentHole)
                is StatsFragment -> fragment.updateHole(currentHole)
            }
        }
    }

    fun sendMessageToPhone(path: String, data: ByteArray = byteArrayOf()) {
        Wearable.getNodeClient(this).connectedNodes
            .addOnSuccessListener { nodes ->
                nodes.forEach { node ->
                    messageClient.sendMessage(node.id, path, data)
                }
            }
    }

    fun getCurrentHole(): Int = currentHole
    
    fun getCurrentScore(hole: Int): Int = holeScores[hole] ?: 0
    
    // Public method to trigger connect - can be called from anywhere
    fun connectToRound() {
        Log.d(TAG, "connectToRound() called publicly")
        runOnUiThread {
            requestActiveRound()
        }
    }

    private fun setupTestButton() {
        // Add long press on version text to send test message
        findViewById<TextView>(R.id.version_text)?.setOnLongClickListener {
            sendTestMessage()
            true
        }
    }
    
    private fun setupConnectButton() {
        Log.d(TAG, "Setting up connect button")
        connectButton?.let { button ->
            button.setOnClickListener {
                Log.d(TAG, "Connect button clicked!")
                requestActiveRound()
            }
            Log.d(TAG, "Connect button listener set")
        } ?: Log.e(TAG, "Connect button is null!")
    }
    
    private fun requestActiveRound() {
        Log.d(TAG, "requestActiveRound called")
        connectionStatus?.apply {
            text = "Connecting..."
            visibility = View.VISIBLE
        }
        connectButton?.isEnabled = false
        
        scope.launch {
            try {
                Log.d(TAG, "Getting connected nodes...")
                val nodes = Tasks.await(nodeClient.connectedNodes)
                Log.d(TAG, "Found ${nodes.size} connected nodes")
                
                if (nodes.isEmpty()) {
                    Log.w(TAG, "No connected nodes found")
                    runOnUiThread {
                        connectionStatus?.text = "No phone connected"
                        connectButton?.isEnabled = true
                    }
                    return@launch
                }
                
                // Send request to phone for active round
                nodes.forEach { node ->
                    Log.d(TAG, "Sending round request to node: ${node.displayName}")
                    val result = Tasks.await(
                        messageClient.sendMessage(
                            node.id,
                            PATH_REQUEST_ROUND,
                            ByteArray(0)
                        )
                    )
                    Log.d(TAG, "Round request sent successfully to ${node.displayName}")
                }
                
                // Set timeout for response
                runOnUiThread {
                    connectionStatus?.text = "Waiting for response..."
                }
                
                // Re-enable button after delay if no response
                delay(5000)
                runOnUiThread {
                    if (!isRoundActive) {
                        Log.d(TAG, "Timeout - no round response received")
                        connectionStatus?.text = "No active round found"
                        connectButton?.isEnabled = true
                    }
                }
                
            } catch (e: Exception) {
                Log.e(TAG, "Error requesting round", e)
                e.printStackTrace()
                runOnUiThread {
                    connectionStatus?.text = "Error: ${e.message}"
                    connectButton?.isEnabled = true
                }
            }
        }
    }
    
    private fun handleRoundResponse(data: ByteArray) {
        Log.d(TAG, "handleRoundResponse called with data size: ${data.size}")
        try {
            val response = String(data)
            Log.d(TAG, "Round response: $response")
            
            if (response == "NO_ACTIVE_ROUND") {
                Log.d(TAG, "No active round on phone")
                runOnUiThread {
                    connectionStatus?.text = "No active round on phone"
                    connectButton?.isEnabled = true
                }
            } else {
                // Handle as round data
                Log.d(TAG, "Active round data received, starting round")
                handleRoundStarted(data)
                runOnUiThread {
                    connectionStatus?.visibility = View.GONE
                    connectButton?.isEnabled = true
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error handling round response", e)
            e.printStackTrace()
            runOnUiThread {
                connectionStatus?.text = "Error: ${e.message}"
                connectButton?.isEnabled = true
            }
        }
    }

    private fun sendTestMessage() {
        scope.launch {
            try {
                Log.d(TAG, "===============================================")
                Log.d(TAG, "SENDING TEST MESSAGE FROM WATCH")
                
                val nodes = Tasks.await(nodeClient.connectedNodes)
                Log.d(TAG, "Found ${nodes.size} connected nodes")
                
                if (nodes.isEmpty()) {
                    runOnUiThread {
                        Toast.makeText(this@MainActivity, "No phone connected!", Toast.LENGTH_SHORT).show()
                    }
                    return@launch
                }
                
                nodes.forEach { node ->
                    Log.d(TAG, "Sending to node: ${node.displayName} (${node.id})")
                    val result = Tasks.await(
                        messageClient.sendMessage(
                            node.id,
                            "/test/response",
                            "Hello from Watch!".toByteArray()
                        )
                    )
                    Log.d(TAG, "Message sent successfully!")
                }
                
                runOnUiThread {
                    Toast.makeText(this@MainActivity, "Test sent to ${nodes.size} nodes!", Toast.LENGTH_LONG).show()
                }
                Log.d(TAG, "===============================================")
                
            } catch (e: Exception) {
                Log.e(TAG, "Error sending test message", e)
                runOnUiThread {
                    Toast.makeText(this@MainActivity, "Send failed: ${e.message}", Toast.LENGTH_SHORT).show()
                }
            }
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        scope.cancel()
        messageClient.removeListener(this)
        dataClient.removeListener(this)
        Log.d(TAG, "Removed message and data listeners")
    }

    private inner class ScreenSlidePagerAdapter(fa: FragmentActivity) : FragmentStateAdapter(fa) {
        override fun getItemCount(): Int = if (isRoundActive) 4 else 0

        override fun createFragment(position: Int) = try {
            when (position) {
                0 -> ShotRecordingFragment()
                1 -> ClubFragment()
                2 -> PuttFragment()
                3 -> StatsFragment()
                else -> ShotRecordingFragment()
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error creating fragment at position $position", e)
            // Return a simple fragment as fallback
            ShotRecordingFragment()
        }
    }
}