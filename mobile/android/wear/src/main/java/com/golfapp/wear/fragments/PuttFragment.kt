package com.golfapp.wear.fragments

import android.os.Bundle
import android.os.VibrationEffect
import android.os.Vibrator
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import com.golfapp.wear.MainActivity
import com.golfapp.wear.R
import com.golfapp.wear.databinding.FragmentPuttBinding
import org.json.JSONObject

class PuttFragment : Fragment() {
    
    private var _binding: FragmentPuttBinding? = null
    private val binding get() = _binding!!
    
    private lateinit var vibrator: Vibrator
    private var currentHole: Int = 1
    private var puttCount: Int = 0
    private val puttCounts = mutableMapOf<Int, Int>() // Store putts per hole
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        vibrator = requireContext().getSystemService(Vibrator::class.java)
        loadPuttCounts()
    }
    
    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentPuttBinding.inflate(inflater, container, false)
        return binding.root
    }
    
    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        
        updateHoleDisplay()
        updatePuttDisplay()
        setupButtons()
    }
    
    private fun setupButtons() {
        // Decrease button
        binding.decreaseButton.setOnClickListener {
            if (puttCount > 0) {
                updatePuttCount(puttCount - 1)
                // Short haptic feedback
                vibrator.vibrate(VibrationEffect.createOneShot(30, VibrationEffect.DEFAULT_AMPLITUDE))
            }
        }
        
        // Increase button
        binding.increaseButton.setOnClickListener {
            if (puttCount < 10) { // Reasonable maximum
                updatePuttCount(puttCount + 1)
                // Medium haptic feedback
                vibrator.vibrate(VibrationEffect.createOneShot(50, VibrationEffect.DEFAULT_AMPLITUDE))
            }
        }
        
        // Reset button (long press)
        binding.puttCountText.setOnLongClickListener {
            // Strong haptic feedback for reset
            vibrator.vibrate(VibrationEffect.createOneShot(100, VibrationEffect.EFFECT_HEAVY_CLICK))
            updatePuttCount(0)
            true
        }
    }
    
    private fun updatePuttCount(newCount: Int) {
        puttCount = newCount
        puttCounts[currentHole] = puttCount
        savePuttCounts()
        updatePuttDisplay()
        
        // Send update to phone
        sendPuttUpdate()
    }
    
    private fun sendPuttUpdate() {
        val activity = activity as? MainActivity ?: return
        
        val puttData = JSONObject().apply {
            put("putts", puttCount)
            put("holeNumber", currentHole)
            put("timestamp", System.currentTimeMillis())
        }
        
        activity.sendMessageToPhone("/putt/updated", puttData.toString().toByteArray())
    }
    
    private fun updatePuttDisplay() {
        binding.puttCountText.text = puttCount.toString()
        
        // Update button states
        binding.decreaseButton.isEnabled = puttCount > 0
        binding.increaseButton.isEnabled = puttCount < 10
        
        // Show performance indicator
        val performance = when {
            puttCount == 0 -> ""
            puttCount == 1 -> getString(R.string.putt_excellent)
            puttCount == 2 -> getString(R.string.putt_good)
            puttCount == 3 -> getString(R.string.putt_average)
            else -> getString(R.string.putt_needs_work)
        }
        
        binding.performanceText.text = performance
        binding.performanceText.visibility = if (puttCount > 0) View.VISIBLE else View.GONE
    }
    
    fun updateHole(hole: Int) {
        // Save current hole's putts before switching
        if (currentHole != hole) {
            puttCounts[currentHole] = puttCount
            savePuttCounts()
        }
        
        currentHole = hole
        puttCount = puttCounts[hole] ?: 0
        updateHoleDisplay()
        updatePuttDisplay()
    }
    
    private fun updateHoleDisplay() {
        binding.holeNumber.text = getString(R.string.hole_label, currentHole)
    }
    
    private fun loadPuttCounts() {
        // Load from SharedPreferences
        val prefs = requireContext().getSharedPreferences("golf_wear", 0)
        for (hole in 1..18) {
            val putts = prefs.getInt("putts_hole_$hole", 0)
            if (putts > 0) {
                puttCounts[hole] = putts
            }
        }
        puttCount = puttCounts[currentHole] ?: 0
    }
    
    private fun savePuttCounts() {
        // Save to SharedPreferences
        val prefs = requireContext().getSharedPreferences("golf_wear", 0)
        val editor = prefs.edit()
        puttCounts.forEach { (hole, putts) ->
            editor.putInt("putts_hole_$hole", putts)
        }
        editor.apply()
    }
    
    fun resetRound() {
        // Clear all putt counts
        puttCounts.clear()
        puttCount = 0
        savePuttCounts()
        updatePuttDisplay()
    }
    
    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}