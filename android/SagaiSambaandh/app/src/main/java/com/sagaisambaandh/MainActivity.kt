package com.sagaisambaandh

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import com.sagaisambaandh.data.Profile
import com.sagaisambaandh.data.SagaiSessionManager
import com.sagaisambaandh.ui.screens.*
import com.sagaisambaandh.ui.theme.RoyalGold
import com.sagaisambaandh.ui.theme.RoyalMaroon
import com.sagaisambaandh.ui.theme.SagaiSambaandhTheme

class MainActivity : ComponentActivity() {
    private val sessionManager = SagaiSessionManager()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            SagaiSambaandhTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    MainScreen(session = sessionManager)
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainScreen(session: SagaiSessionManager) {
    var selectedTab by remember { mutableStateOf(0) }
    var selectedProfileForDetail by remember { mutableStateOf<Profile?>(null) }
    var showingRegisterInAccountTab by remember { mutableStateOf(false) }

    Scaffold(
        bottomBar = {
            NavigationBar(
                containerColor = DeepMaroon,
                contentColor = RoyalGold
            ) {
                NavigationBarItem(
                    selected = selectedTab == 0,
                    onClick = { selectedTab = 0 },
                    icon = { Icon(Icons.Default.Home, contentDescription = "Home") },
                    label = { Text("Home", fontSize = 11.sp) },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = LightGold,
                        selectedTextColor = LightGold,
                        indicatorColor = RoyalGold.copy(alpha = 0.15f),
                        unselectedIconColor = Color.White.copy(alpha = 0.5f),
                        unselectedTextColor = Color.White.copy(alpha = 0.5f)
                    )
                )

                NavigationBarItem(
                    selected = selectedTab == 1,
                    onClick = { selectedTab = 1 },
                    icon = { Icon(Icons.Default.Shield, contentDescription = "Clans") },
                    label = { Text("Clans", fontSize = 11.sp) },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = LightGold,
                        selectedTextColor = LightGold,
                        indicatorColor = RoyalGold.copy(alpha = 0.15f),
                        unselectedIconColor = Color.White.copy(alpha = 0.5f),
                        unselectedTextColor = Color.White.copy(alpha = 0.5f)
                    )
                )

                NavigationBarItem(
                    selected = selectedTab == 2,
                    onClick = { selectedTab = 2 },
                    icon = { Icon(Icons.Default.Star, contentDescription = "Plans") },
                    label = { Text("Plans", fontSize = 11.sp) },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = LightGold,
                        selectedTextColor = LightGold,
                        indicatorColor = RoyalGold.copy(alpha = 0.15f),
                        unselectedIconColor = Color.White.copy(alpha = 0.5f),
                        unselectedTextColor = Color.White.copy(alpha = 0.5f)
                    )
                )

                NavigationBarItem(
                    selected = selectedTab == 3,
                    onClick = { selectedTab = 3 },
                    icon = { Icon(Icons.Default.Person, contentDescription = "Account") },
                    label = { Text("Account", fontSize = 11.sp) },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = LightGold,
                        selectedTextColor = LightGold,
                        indicatorColor = RoyalGold.copy(alpha = 0.15f),
                        unselectedIconColor = Color.White.copy(alpha = 0.5f),
                        unselectedTextColor = Color.White.copy(alpha = 0.5f)
                    )
                )
            }
        }
    ) { innerPadding ->
        Box(modifier = Modifier.padding(innerPadding)) {
            when (selectedTab) {
                0 -> HomeView(
                    session = session,
                    onNavigateToTab = { selectedTab = it },
                    onNavigateToRegister = {
                        showingRegisterInAccountTab = true
                        selectedTab = 3
                    },
                    onProfileDetailSelect = { selectedProfileForDetail = it }
                )
                1 -> ClansView()
                2 -> PlansView(session = session)
                3 -> {
                    if (session.currentUser.value != null) {
                        DashboardView(
                            session = session,
                            onProfileDetailSelect = { selectedProfileForDetail = it }
                        )
                    } else {
                        if (showingRegisterInAccountTab) {
                            RegisterView(
                                session = session,
                                onNavigateToLogin = { showingRegisterInAccountTab = false }
                            )
                        } else {
                            LoginView(
                                session = session,
                                onNavigateToRegister = { showingRegisterInAccountTab = true }
                            )
                        }
                    }
                }
            }
        }

        // Details bottom sheet
        if (selectedProfileForDetail != null) {
            ModalBottomSheet(
                onDismissRequest = { selectedProfileForDetail = null },
                containerColor = MaterialTheme.colorScheme.background
            ) {
                ProfileDetailView(
                    profile = selectedProfileForDetail!!,
                    session = session,
                    onDismiss = { selectedProfileForDetail = null }
                )
            }
        }
    }
}
