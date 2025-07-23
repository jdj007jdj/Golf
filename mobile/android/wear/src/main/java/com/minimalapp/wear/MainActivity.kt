package com.minimalapp.wear

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.fragment.app.FragmentActivity
import androidx.viewpager2.adapter.FragmentStateAdapter
import androidx.viewpager2.widget.ViewPager2
import androidx.wear.widget.SwipeDismissFrameLayout
import com.minimalapp.databinding.ActivityMainBinding
import com.minimalapp.R
import com.minimalapp.BuildConfig
import com.minimalapp.wear.fragments.ShotFragment
import com.minimalapp.wear.fragments.ClubFragment
import com.minimalapp.wear.fragments.PuttFragment
import com.minimalapp.wear.fragments.StatsFragment
import com.minimalapp.wear.services.WearableListenerService
import com.google.android.gms.wearable.*
import org.json.JSONObject
import android.widget.TextView
import kotlinx.coroutines.*
import com.google.android.gms.tasks.Tasks
import android.util.Log

class MainActivity : FragmentActivity(), 
    DataClient.OnDataChangedListener,
    MessageClient.OnMessageReceivedListener {

    companion object {
        const val TAG = "GolfWearMain"
    }

    private lateinit var binding: ActivityMainBinding
    private lateinit var dataClient: DataClient
    private lateinit var messageClient: MessageClient
    private lateinit var nodeClient: NodeClient
    private lateinit var viewPager: ViewPager2
    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    
    // Current round data
    private var currentRoundId: String? = null
    private var currentHole: Int = 1
    private var isRoundActive: Boolean = false

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
        dataClient.addListener(this)
        messageClient.addListener(this)
        checkPhoneConnection()
    }

    override fun onPause() {
        super.onPause()
        dataClient.removeListener(this)
        messageClient.removeListener(this)
        
        // Stop location updates in all fragments to save battery
        supportFragmentManager.fragments.forEach { fragment ->
            if (fragment is ShotFragment) {
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

    private fun handleRoundStarted(data: ByteArray) {
        try {
            val roundData = JSONObject(String(data))
            
            isRoundActive = true
            // Use optString to handle missing or null roundId
            currentRoundId = roundData.optString("roundId", "unknown")
            currentHole = roundData.optInt("currentHole", 1)
            
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
            val noRoundLayout = findViewById<View>(R.id.no_round_layout)
            if (!isRoundActive) {
                // Show "waiting for round" screen
                viewPager.visibility = View.GONE
                noRoundLayout?.visibility = View.VISIBLE
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
                is ShotFragment -> fragment.updateHole(currentHole)
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

    private fun setupTestButton() {
        // Add long press on version text to send test message
        findViewById<TextView>(R.id.version_text)?.setOnLongClickListener {
            sendTestMessage()
            true
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
                0 -> ShotFragment()
                1 -> ClubFragment()
                2 -> PuttFragment()
                3 -> StatsFragment()
                else -> ShotFragment()
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error creating fragment at position $position", e)
            // Return a simple fragment as fallback
            ShotFragment()
        }
    }
}