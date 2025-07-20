package com.golfapp.wear.fragments

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import com.golfapp.wear.R
import com.golfapp.wear.databinding.FragmentStatsBinding

class StatsFragment : Fragment() {
    
    private var _binding: FragmentStatsBinding? = null
    private val binding get() = _binding!!
    
    private var currentHole: Int = 1
    private var distanceToPin: Int = -1
    private var distanceLastShot: Int = -1
    private var measurementUnit: String = "imperial"
    private var lastUpdateTime: Long = 0
    
    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentStatsBinding.inflate(inflater, container, false)
        return binding.root
    }
    
    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        
        updateHoleDisplay()
        updateStatsDisplay()
        setupRefreshButton()
    }
    
    private fun setupRefreshButton() {
        // Manual refresh button for debugging/testing
        binding.refreshButton.setOnClickListener {
            binding.refreshButton.animate()
                .rotation(binding.refreshButton.rotation + 360f)
                .setDuration(500)
                .start()
            
            // In a real app, this would request fresh data from phone
            updateStatsDisplay()
        }
    }
    
    fun updateStats(toPinDistance: Int, lastShotDistance: Int, unit: String) {
        distanceToPin = toPinDistance
        distanceLastShot = lastShotDistance
        measurementUnit = unit
        lastUpdateTime = System.currentTimeMillis()
        
        if (_binding != null) {
            updateStatsDisplay()
        }
    }
    
    private fun updateStatsDisplay() {
        // Distance to Pin
        if (distanceToPin > 0) {
            binding.distanceToPinCard.visibility = View.VISIBLE
            val unitSymbol = if (measurementUnit == "metric") "m" else "y"
            binding.distanceToPinValue.text = "$distanceToPin$unitSymbol"
        } else {
            binding.distanceToPinCard.visibility = View.GONE
        }
        
        // Last Shot Distance
        if (distanceLastShot > 0) {
            binding.lastShotCard.visibility = View.VISIBLE
            val unitSymbol = if (measurementUnit == "metric") "m" else "y"
            binding.lastShotValue.text = "$distanceLastShot$unitSymbol"
        } else {
            binding.lastShotCard.visibility = View.GONE
        }
        
        // Show no data message if both are hidden
        if (distanceToPin <= 0 && distanceLastShot <= 0) {
            binding.noDataText.visibility = View.VISIBLE
            binding.statsContainer.visibility = View.GONE
        } else {
            binding.noDataText.visibility = View.GONE
            binding.statsContainer.visibility = View.VISIBLE
        }
        
        // Update last update time
        if (lastUpdateTime > 0) {
            val secondsAgo = (System.currentTimeMillis() - lastUpdateTime) / 1000
            val timeText = when {
                secondsAgo < 5 -> "Just now"
                secondsAgo < 60 -> "${secondsAgo}s ago"
                else -> "${secondsAgo / 60}m ago"
            }
            binding.lastUpdateText.text = getString(R.string.last_update, timeText)
            binding.lastUpdateText.visibility = View.VISIBLE
        }
    }
    
    fun updateHole(hole: Int) {
        currentHole = hole
        updateHoleDisplay()
        
        // Reset stats when hole changes
        distanceToPin = -1
        distanceLastShot = -1
        updateStatsDisplay()
    }
    
    private fun updateHoleDisplay() {
        binding.holeNumber.text = getString(R.string.hole_label, currentHole)
    }
    
    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}