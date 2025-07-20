package com.golfapp.wear

import android.os.Bundle
import android.widget.Toast
import androidx.fragment.app.FragmentActivity
import androidx.viewpager2.adapter.FragmentStateAdapter
import androidx.viewpager2.widget.ViewPager2
import androidx.wear.widget.SwipeDismissFrameLayout
import com.golfapp.wear.databinding.ActivityMainBinding
import com.golfapp.wear.fragments.*
import com.google.android.gms.wearable.*
import org.json.JSONObject

class MainActivity : FragmentActivity(), 
    DataClient.OnDataChangedListener,
    MessageClient.OnMessageReceivedListener {

    private lateinit var binding: ActivityMainBinding
    private lateinit var dataClient: DataClient
    private lateinit var messageClient: MessageClient
    private lateinit var viewPager: ViewPager2
    
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

        setupViewPager()
        setupSwipeDismiss()
    }

    private fun setupViewPager() {
        viewPager = binding.viewPager
        val pagerAdapter = ScreenSlidePagerAdapter(this)
        viewPager.adapter = pagerAdapter
        
        // Disable swipe when no round is active
        viewPager.isUserInputEnabled = isRoundActive
        
        // Show appropriate screen based on round status
        updateUIForRoundStatus()
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
        dataEvents.forEach { event ->
            when (event.dataItem.uri.path) {
                "/round/data" -> handleRoundData(event.dataItem)
                "/stats/data" -> handleStatsData(event.dataItem)
            }
        }
    }

    override fun onMessageReceived(messageEvent: MessageEvent) {
        when (messageEvent.path) {
            "/round/start" -> handleRoundStarted(messageEvent.data)
            "/round/end" -> handleRoundEnded()
            "/stats/update" -> handleStatsUpdate(messageEvent.data)
            "/hole/change" -> handleHoleChange(messageEvent.data)
        }
    }

    private fun handleRoundData(dataItem: DataItem) {
        try {
            val dataString = String(dataItem.data)
            val roundData = JSONObject(dataString)
            
            isRoundActive = true
            currentRoundId = roundData.getString("roundId")
            currentHole = roundData.getInt("currentHole")
            
            runOnUiThread {
                updateUIForRoundStatus()
                updateAllFragmentsHole()
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    private fun handleStatsData(dataItem: DataItem) {
        try {
            val dataString = String(dataItem.data)
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
            currentRoundId = roundData.getString("roundId")
            currentHole = roundData.getInt("currentHole")
            
            runOnUiThread {
                viewPager.isUserInputEnabled = true
                updateUIForRoundStatus()
                updateAllFragmentsHole()
                Toast.makeText(this, "Round Started", Toast.LENGTH_SHORT).show()
            }
        } catch (e: Exception) {
            e.printStackTrace()
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
        if (!isRoundActive) {
            // Show "waiting for round" screen
            binding.viewPager.visibility = ViewPager2.GONE
            binding.noRoundLayout.visibility = android.view.View.VISIBLE
        } else {
            binding.viewPager.visibility = ViewPager2.VISIBLE
            binding.noRoundLayout.visibility = android.view.View.GONE
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

    private inner class ScreenSlidePagerAdapter(fa: FragmentActivity) : FragmentStateAdapter(fa) {
        override fun getItemCount(): Int = 4

        override fun createFragment(position: Int) = when (position) {
            0 -> ShotFragment()
            1 -> ClubFragment()
            2 -> PuttFragment()
            3 -> StatsFragment()
            else -> ShotFragment()
        }
    }
}