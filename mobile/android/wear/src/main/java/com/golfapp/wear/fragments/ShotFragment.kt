package com.golfapp.wear.fragments

import android.Manifest
import android.content.pm.PackageManager
import android.location.Location
import android.os.Bundle
import android.os.VibrationEffect
import android.os.Vibrator
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.core.app.ActivityCompat
import androidx.fragment.app.Fragment
import com.golfapp.wear.MainActivity
import com.golfapp.wear.R
import com.golfapp.wear.databinding.FragmentShotBinding
import com.google.android.gms.location.*
import com.google.android.gms.wearable.PutDataMapRequest
import com.google.android.gms.wearable.Wearable
import org.json.JSONObject
import java.util.Date

class ShotFragment : Fragment() {
    
    private var _binding: FragmentShotBinding? = null
    private val binding get() = _binding!!
    
    private lateinit var fusedLocationClient: FusedLocationProviderClient
    private lateinit var vibrator: Vibrator
    
    private var currentHole: Int = 1
    private var lastLocation: Location? = null
    private var isRecording: Boolean = false
    
    companion object {
        private const val LOCATION_PERMISSION_REQUEST = 1001
        private const val LOCATION_UPDATE_INTERVAL = 5000L // 5 seconds
        private const val FASTEST_LOCATION_INTERVAL = 2000L // 2 seconds
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
    ): View {
        _binding = FragmentShotBinding.inflate(inflater, container, false)
        return binding.root
    }
    
    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        
        updateHoleDisplay()
        setupRecordButton()
        checkLocationPermission()
    }
    
    private fun setupRecordButton() {
        binding.recordShotButton.setOnClickListener {
            if (isRecording) return@setOnClickListener
            
            // Haptic feedback
            vibrator.vibrate(VibrationEffect.createOneShot(100, VibrationEffect.DEFAULT_AMPLITUDE))
            
            recordShot()
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
        binding.recordShotButton.isEnabled = false
        binding.recordingProgress.visibility = View.VISIBLE
        
        // Get current location
        fusedLocationClient.lastLocation
            .addOnSuccessListener { location ->
                location?.let {
                    sendShotToPhone(it)
                } ?: run {
                    // Try to get fresh location
                    requestFreshLocation()
                }
            }
            .addOnFailureListener {
                isRecording = false
                binding.recordShotButton.isEnabled = true
                binding.recordingProgress.visibility = View.GONE
                updateGpsStatus("Failed")
            }
    }
    
    private fun requestFreshLocation() {
        val locationRequest = LocationRequest.Builder(
            Priority.PRIORITY_HIGH_ACCURACY,
            1000 // 1 second
        ).build()
        
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
        val activity = activity as? MainActivity ?: return
        
        // Create shot data as JSON
        val shotData = JSONObject().apply {
            put("timestamp", System.currentTimeMillis())
            put("latitude", location.latitude)
            put("longitude", location.longitude)
            put("accuracy", location.accuracy)
            put("holeNumber", currentHole)
        }
        
        // Send via message for immediate notification
        activity.sendMessageToPhone("/shot/recorded", shotData.toString().toByteArray())
        
        // Also store in DataClient for persistence
        val dataClient = Wearable.getDataClient(requireContext())
        val putDataReq = PutDataMapRequest.create("/shot/latest").apply {
            dataMap.putLong("timestamp", shotData.getLong("timestamp"))
            dataMap.putDouble("latitude", shotData.getDouble("latitude"))
            dataMap.putDouble("longitude", shotData.getDouble("longitude"))
            dataMap.putFloat("accuracy", shotData.getDouble("accuracy").toFloat())
            dataMap.putInt("holeNumber", shotData.getInt("holeNumber"))
        }
        
        dataClient.putDataItem(putDataReq.asPutDataRequest())
            .addOnSuccessListener {
                isRecording = false
                binding.recordShotButton.isEnabled = true
                binding.recordingProgress.visibility = View.GONE
                
                // Success haptic
                vibrator.vibrate(
                    VibrationEffect.createWaveform(
                        longArrayOf(0, 50, 50, 50),
                        intArrayOf(0, 128, 0, 255),
                        -1
                    )
                )
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
    
    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<out String>,
        grantResults: IntArray
    ) {
        if (requestCode == LOCATION_PERMISSION_REQUEST) {
            if (grantResults.isNotEmpty() && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                startLocationUpdates()
            } else {
                updateGpsStatus("No Permission")
            }
        }
    }
    
    private fun startLocationUpdates() {
        val locationRequest = LocationRequest.Builder(
            Priority.PRIORITY_HIGH_ACCURACY,
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
                updateGpsStatus(when {
                    location.accuracy <= 5 -> "Excellent"
                    location.accuracy <= 10 -> "Good"
                    location.accuracy <= 20 -> "Fair"
                    else -> "Poor"
                })
            }
        }
    }
    
    private fun updateGpsStatus(status: String) {
        binding.gpsStatus.text = getString(R.string.gps_status, status)
    }
    
    fun updateHole(hole: Int) {
        currentHole = hole
        updateHoleDisplay()
    }
    
    private fun updateHoleDisplay() {
        binding.holeNumber.text = getString(R.string.hole_label, currentHole)
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
    
    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}