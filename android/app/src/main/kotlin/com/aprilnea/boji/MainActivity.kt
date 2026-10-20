package com.aprilnea.boji

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import com.aprilnea.boji.ui.BojiApp
import com.aprilnea.boji.ui.theme.BojiTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        // Android 15+ enforces edge-to-edge for apps that target API 35 or higher.
        enableEdgeToEdge()
        super.onCreate(savedInstanceState)
        setContent {
            BojiTheme {
                BojiApp()
            }
        }
    }
}
