package com.minimalapp.wear.fragments
import com.minimalapp.R

import android.os.Bundle
import android.os.VibrationEffect
import android.os.Vibrator
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.GridLayout
import android.widget.TextView
import androidx.fragment.app.Fragment
import androidx.wear.widget.WearableRecyclerView
import androidx.wear.widget.WearableLinearLayoutManager
import com.minimalapp.wear.MainActivity
import com.google.android.material.button.MaterialButton
import org.json.JSONObject
import com.minimalapp.databinding.FragmentClubBinding

class ClubFragment : Fragment() {
    
    private var _binding: FragmentClubBinding? = null
    private val binding get() = _binding!!
    
    private lateinit var vibrator: Vibrator
    private var currentHole: Int = 1
    private var recentClubs = mutableListOf<String>()
    
    // Full list of clubs
    private val allClubs = listOf(
        // Woods
        "D" to "Driver",
        "3W" to "3 Wood",
        "5W" to "5 Wood",
        "7W" to "7 Wood",
        // Hybrids
        "2H" to "2 Hybrid",
        "3H" to "3 Hybrid", 
        "4H" to "4 Hybrid",
        // Irons
        "3I" to "3 Iron",
        "4I" to "4 Iron",
        "5I" to "5 Iron",
        "6I" to "6 Iron",
        "7I" to "7 Iron",
        "8I" to "8 Iron",
        "9I" to "9 Iron",
        // Wedges
        "PW" to "Pitching Wedge",
        "AW" to "Approach Wedge",
        "SW" to "Sand Wedge",
        "LW" to "Lob Wedge",
        // Putter
        "P" to "Putter"
    )
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        vibrator = requireContext().getSystemService(Vibrator::class.java)
        loadRecentClubs()
    }
    
    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentClubBinding.inflate(inflater, container, false)
        return binding.root
    }
    
    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        
        updateHoleDisplay()
        setupRecentClubs()
        setupAllClubs()
    }
    
    private fun setupRecentClubs() {
        binding.recentClubsContainer.removeAllViews()
        
        // Show up to 3 recent clubs
        val recentToShow = recentClubs.take(3)
        
        recentToShow.forEach { club ->
            val button = createClubButton(club)
            binding.recentClubsContainer.addView(button)
        }
        
        // Hide recent section if no recent clubs
        binding.recentSection.visibility = if (recentClubs.isEmpty()) View.GONE else View.VISIBLE
    }
    
    private fun setupAllClubs() {
        binding.allClubsGrid.removeAllViews()
        
        // Set up grid with 3 columns
        binding.allClubsGrid.columnCount = 3
        
        allClubs.forEach { (shortName, _) ->
            val button = createClubButton(shortName)
            val params = GridLayout.LayoutParams().apply {
                width = 0
                height = ViewGroup.LayoutParams.WRAP_CONTENT
                columnSpec = GridLayout.spec(GridLayout.UNDEFINED, 1f)
                setMargins(4, 4, 4, 4)
            }
            button.layoutParams = params
            binding.allClubsGrid.addView(button)
        }
    }
    
    private fun createClubButton(clubShortName: String): MaterialButton {
        return MaterialButton(requireContext()).apply {
            text = clubShortName
            textSize = 14f
            minimumHeight = 48.dpToPx()
            setPadding(8, 4, 8, 4)
            setOnClickListener {
                selectClub(clubShortName)
            }
        }
    }
    
    private fun selectClub(clubShortName: String) {
        // Haptic feedback
        vibrator.vibrate(VibrationEffect.createOneShot(50, VibrationEffect.DEFAULT_AMPLITUDE))
        
        // Add to recent clubs if not already there
        if (!recentClubs.contains(clubShortName)) {
            recentClubs.add(0, clubShortName)
            // Keep only last 5 recent clubs
            if (recentClubs.size > 5) {
                recentClubs = recentClubs.take(5).toMutableList()
            }
            saveRecentClubs()
            setupRecentClubs()
        }
        
        // Send club selection to phone
        val activity = activity as? MainActivity ?: return
        
        val clubData = JSONObject().apply {
            put("club", clubShortName)
            put("timestamp", System.currentTimeMillis())
            put("holeNumber", currentHole)
        }
        
        activity.sendMessageToPhone("/club/selected", clubData.toString().toByteArray())
        
        // Show confirmation
        binding.confirmationText.text = "$clubShortName Selected"
        binding.confirmationText.visibility = View.VISIBLE
        
        // Hide confirmation after 1.5 seconds
        binding.confirmationText.postDelayed({
            binding.confirmationText.visibility = View.GONE
        }, 1500)
    }
    
    private fun loadRecentClubs() {
        // Load from SharedPreferences
        val prefs = requireContext().getSharedPreferences("golf_wear", 0)
        val recentString = prefs.getString("recent_clubs", "") ?: ""
        recentClubs = if (recentString.isNotEmpty()) {
            recentString.split(",").toMutableList()
        } else {
            mutableListOf()
        }
    }
    
    private fun saveRecentClubs() {
        // Save to SharedPreferences
        val prefs = requireContext().getSharedPreferences("golf_wear", 0)
        prefs.edit().putString("recent_clubs", recentClubs.joinToString(",")).apply()
    }
    
    fun updateHole(hole: Int) {
        currentHole = hole
        updateHoleDisplay()
    }
    
    private fun updateHoleDisplay() {
        binding.holeNumber.text = getString(R.string.hole_label, currentHole)
    }
    
    private fun Int.dpToPx(): Int {
        return (this * resources.displayMetrics.density).toInt()
    }
    
    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}