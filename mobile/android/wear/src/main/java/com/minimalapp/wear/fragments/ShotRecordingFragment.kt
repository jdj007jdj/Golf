package com.minimalapp.wear.fragments

import android.Manifest
import android.content.pm.PackageManager
import android.location.Location
import android.os.Bundle
import android.os.VibrationEffect
import android.os.Vibrator
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.GridLayout
import android.widget.ProgressBar
import android.widget.TextView
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.fragment.app.Fragment
import com.google.android.gms.location.*
import com.google.android.material.button.MaterialButton
import com.minimalapp.R
import com.minimalapp.wear.MainActivity
import org.json.JSONObject

class ShotRecordingFragment : Fragment() {
    
    private lateinit var fusedLocationClient: FusedLocationProviderClient
    private lateinit var vibrator: Vibrator
    
    private lateinit var titleText: TextView
    private lateinit var clubGrid: GridLayout
    private lateinit var recordButton: MaterialButton
    private lateinit var progressBar: ProgressBar
    private lateinit var gpsStatus: TextView
    
    private var currentHole: Int = 1
    private var selectedClub: String? = null
    private var lastLocation: Location? = null
    private var isRecording: Boolean = false
    private var shotRecorded: Boolean = false // Track if shot has been recorded
    
    // Track shots per hole
    private val shotsPerHole = mutableMapOf<Int, Int>()
    
    companion object {
        private const val LOCATION_PERMISSION_REQUEST = 1001
        private const val LOCATION_UPDATE_INTERVAL = 5000L
        private const val FASTEST_LOCATION_INTERVAL = 2000L
        
        // Common clubs in order of distance
        private val CLUBS = listOf(
            "Driver", "3W", "5W", "4H",
            "5I", "6I", "7I", "8I",
            "9I", "PW", "SW", "LW"
        )
    }
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        fusedLocationClient = LocationServices.getFusedLocationProviderClient(requireContext())
        vibrator = requireContext().getSystemService(Vibrator::class.java)
    }
    
    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        return inflater.inflate(R.layout.fragment_shot_recording, container, false)
    }
    
    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        
        titleText = view.findViewById(R.id.title_text)
        clubGrid = view.findViewById(R.id.club_grid)
        recordButton = view.findViewById(R.id.record_button)
        progressBar = view.findViewById(R.id.progress_bar)
        gpsStatus = view.findViewById(R.id.gps_status)
        
        updateUI()
        setupClubButtons()
        setupRecordButton()
        checkLocationPermission()
    }
    
    private fun updateUI() {
        val shotNumber = getCurrentShotNumber()
        val shotText = when (shotNumber) {
            1 -> "Tee Shot"
            2 -> "2nd Shot"
            3 -> "3rd Shot"
            else -> "${shotNumber}th Shot"
        }
        
        titleText.text = "Hole $currentHole - $shotText"
        
        when {
            !shotRecorded -> {
                // Show record button first
                clubGrid.visibility = View.GONE
                recordButton.visibility = View.VISIBLE
                recordButton.text = "Record Shot"
                recordButton.isEnabled = !isRecording
                progressBar.visibility = if (isRecording) View.VISIBLE else View.GONE
            }
            selectedClub == null -> {
                // After recording, show club selection
                clubGrid.visibility = View.VISIBLE
                recordButton.visibility = View.GONE
                progressBar.visibility = View.GONE
                titleText.text = "Select Club Used"
            }
            else -> {
                // Club selected, ready to send
                sendShotWithClub()
            }
        }
    }
    
    private fun setupClubButtons() {
        clubGrid.removeAllViews()
        clubGrid.columnCount = 4
        
        CLUBS.forEach { club ->
            val button = MaterialButton(requireContext()).apply {
                text = club
                textSize = 18f
                setTextColor(ContextCompat.getColor(context, android.R.color.black))
                backgroundTintList = ContextCompat.getColorStateList(context, android.R.color.white)
                cornerRadius = 8
                
                // Make button large enough for thumb
                layoutParams = GridLayout.LayoutParams().apply {
                    width = 100
                    height = 100
                    setMargins(2, 2, 2, 2)
                }
                
                setOnClickListener {
                    vibrator.vibrate(VibrationEffect.createOneShot(50, VibrationEffect.DEFAULT_AMPLITUDE))
                    selectedClub = club
                    updateUI()
                }
            }
            clubGrid.addView(button)
        }
    }
    
    private fun setupRecordButton() {
        recordButton.setOnClickListener {
            if (!isRecording && !shotRecorded) {
                vibrator.vibrate(VibrationEffect.createOneShot(100, VibrationEffect.DEFAULT_AMPLITUDE))
                recordShot()
            }
        }
    }
    
    private fun recordShot() {
        if (ActivityCompat.checkSelfPermission(
                requireContext(),
                Manifest.permission.ACCESS_FINE_LOCATION
            ) != PackageManager.PERMISSION_GRANTED
        ) {
            requestLocationPermission()
            return
        }
        
        isRecording = true
        updateUI()
        
        // Get current location
        fusedLocationClient.lastLocation
            .addOnSuccessListener { location ->
                location?.let {
                    sendShotToPhone(it)
                } ?: run {
                    requestFreshLocation()
                }
            }
            .addOnFailureListener {
                isRecording = false
                updateUI()
                gpsStatus.text = "GPS: Failed"
            }
    }
    
    private fun requestFreshLocation() {
        val locationRequest = LocationRequest.Builder(
            Priority.PRIORITY_HIGH_ACCURACY,
            5000L
        )
        .setMaxUpdates(1)
        .build()
        
        if (ActivityCompat.checkSelfPermission(
                requireContext(),
                Manifest.permission.ACCESS_FINE_LOCATION
            ) != PackageManager.PERMISSION_GRANTED
        ) {
            return
        }
        
        fusedLocationClient.requestLocationUpdates(
            locationRequest,
            object : LocationCallback() {
                override fun onLocationResult(locationResult: LocationResult) {
                    fusedLocationClient.removeLocationUpdates(this)
                    locationResult.lastLocation?.let { location ->
                        sendShotToPhone(location)
                    }
                }
            },
            null
        )
    }
    
    private fun sendShotToPhone(location: Location) {
        // Store location for later when club is selected
        lastLocation = location
        shotRecorded = true
        isRecording = false
        
        // Show club selection
        updateUI()
    }
    
    private fun sendShotWithClub() {
        val mainActivity = activity as? MainActivity ?: return
        val location = lastLocation ?: return
        
        // Create shot data with club
        val shotNumber = getCurrentShotNumber()
        val shotData = JSONObject().apply {
            put("timestamp", System.currentTimeMillis())
            put("latitude", location.latitude)
            put("longitude", location.longitude)
            put("accuracy", location.accuracy)
            put("holeNumber", currentHole)
            put("shotNumber", shotNumber)
            put("club", selectedClub)
        }
        
        // Send to phone
        mainActivity.sendMessageToPhone("/shot/recorded", shotData.toString().toByteArray())
        
        // Success feedback
        vibrator.vibrate(
            VibrationEffect.createWaveform(
                longArrayOf(0, 50, 50, 50),
                intArrayOf(0, 128, 0, 255),
                -1
            )
        )
        
        // Increment shot count for current hole
        shotsPerHole[currentHole] = shotNumber
        
        // Reset for next shot
        selectedClub = null
        shotRecorded = false
        lastLocation = null
        updateUI()
    }
    
    private fun getCurrentShotNumber(): Int {
        // First check if MainActivity has a score for this hole
        val mainActivity = activity as? MainActivity
        val currentScore = mainActivity?.getCurrentScore(currentHole) ?: 0
        
        // If we have a score from phone, use that + 1 for next shot
        // Otherwise fall back to our local tracking
        return if (currentScore > 0) {
            currentScore + 1
        } else {
            (shotsPerHole[currentHole] ?: 0) + 1
        }
    }
    
    private fun checkLocationPermission() {
        if (ActivityCompat.checkSelfPermission(
                requireContext(),
                Manifest.permission.ACCESS_FINE_LOCATION
            ) != PackageManager.PERMISSION_GRANTED
        ) {
            requestLocationPermission()
        } else {
            startLocationUpdates()
        }
    }
    
    private fun requestLocationPermission() {
        requestPermissions(
            arrayOf(Manifest.permission.ACCESS_FINE_LOCATION),
            LOCATION_PERMISSION_REQUEST
        )
    }
    
    private fun startLocationUpdates() {
        val locationRequest = LocationRequest.Builder(
            Priority.PRIORITY_BALANCED_POWER_ACCURACY,
            LOCATION_UPDATE_INTERVAL
        ).apply {
            setMinUpdateIntervalMillis(FASTEST_LOCATION_INTERVAL)
        }.build()
        
        if (ActivityCompat.checkSelfPermission(
                requireContext(),
                Manifest.permission.ACCESS_FINE_LOCATION
            ) != PackageManager.PERMISSION_GRANTED
        ) {
            return
        }
        
        fusedLocationClient.requestLocationUpdates(
            locationRequest,
            locationCallback,
            null
        )
    }
    
    private val locationCallback = object : LocationCallback() {
        override fun onLocationResult(locationResult: LocationResult) {
            locationResult.lastLocation?.let { location ->
                lastLocation = location
                val accuracy = when {
                    location.accuracy <= 5 -> "Excellent"
                    location.accuracy <= 10 -> "Good"
                    location.accuracy <= 20 -> "Fair"
                    else -> "Poor"
                }
                gpsStatus.text = "GPS: $accuracy (±${location.accuracy.toInt()}m)"
            }
        }
    }
    
    fun updateHole(hole: Int) {
        currentHole = hole
        selectedClub = null
        shotRecorded = false
        lastLocation = null
        updateUI()
    }
    
    fun updateShotCount(hole: Int, shotCount: Int) {
        // Update the shot count for a specific hole
        if (shotCount > 0) {
            shotsPerHole[hole] = shotCount
        } else {
            shotsPerHole.remove(hole)
        }
        
        // If updating current hole, refresh UI immediately
        if (hole == currentHole) {
            selectedClub = null
            shotRecorded = false
            lastLocation = null
            activity?.runOnUiThread {
                updateUI()
            }
        }
    }
    
    fun resetShots() {
        shotsPerHole.clear()
        selectedClub = null
        shotRecorded = false
        lastLocation = null
        updateUI()
    }
    
    override fun onResume() {
        super.onResume()
        if (ActivityCompat.checkSelfPermission(
                requireContext(),
                Manifest.permission.ACCESS_FINE_LOCATION
            ) == PackageManager.PERMISSION_GRANTED
        ) {
            startLocationUpdates()
        }
    }
    
    override fun onPause() {
        super.onPause()
        fusedLocationClient.removeLocationUpdates(locationCallback)
    }
}