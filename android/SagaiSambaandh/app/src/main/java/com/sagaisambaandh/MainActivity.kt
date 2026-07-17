package com.sagaisambaandh

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.sp
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
    var showingRegister by remember { mutableStateOf(false) }

    val currentUser by session.currentUser.collectAsState()

    if (currentUser == null) {
        // App started: require Login or Register onboarding gate
        if (showingRegister) {
            RegisterView(
                session = session,
                onNavigateToLogin = { showingRegister = false }
            )
        } else {
            LoginView(
                session = session,
                onNavigateToRegister = { showingRegister = true }
            )
        }
    } else {
        // Authenticated users get full app navigation with bottom bar
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
                        label = { Text("Home", fontSize = 10.sp) },
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
                        icon = { Icon(Icons.Default.Favorite, contentDescription = "Matches") },
                        label = { Text("Matches", fontSize = 10.sp) },
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
                        icon = { Icon(Icons.Default.Email, contentDescription = "Inbox") },
                        label = { Text("Inbox", fontSize = 10.sp) },
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
                        icon = { Icon(Icons.Default.Chat, contentDescription = "Chat") },
                        label = { Text("Chat", fontSize = 10.sp) },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = LightGold,
                            selectedTextColor = LightGold,
                            indicatorColor = RoyalGold.copy(alpha = 0.15f),
                            unselectedIconColor = Color.White.copy(alpha = 0.5f),
                            unselectedTextColor = Color.White.copy(alpha = 0.5f)
                        )
                    )

                    NavigationBarItem(
                        selected = selectedTab == 4,
                        onClick = { selectedTab = 4 },
                        icon = { Icon(Icons.Default.Star, contentDescription = "Premium") },
                        label = { Text("Premium", fontSize = 10.sp) },
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
                            // Already logged in, no registration navigation needed
                        },
                        onProfileDetailSelect = { selectedProfileForDetail = it }
                    )
                    1 -> MatchesView(
                        session = session,
                        onNavigateToRegister = {},
                        onProfileDetailSelect = { selectedProfileForDetail = it }
                    )
                    2 -> InboxView()
                    3 -> ChatView()
                    4 -> PlansView(session = session)
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
}
