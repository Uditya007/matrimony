package com.sagaisambaandh

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.ContextCompat
import com.sagaisambaandh.data.Profile
import com.sagaisambaandh.data.SagaiSessionManager
import com.sagaisambaandh.ui.screens.*
import com.sagaisambaandh.ui.theme.*
import com.sagaisambaandh.util.RoyalNotificationHelper

class MainActivity : ComponentActivity() {
    private lateinit var sessionManager: SagaiSessionManager

    private val notificationPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { isGranted: Boolean ->
        // Permission result handled
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Initialize notification channel for heads-up alerts
        RoyalNotificationHelper.createNotificationChannel(applicationContext)

        // Request POST_NOTIFICATIONS permission on Android 13+ (API 33+)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(
                    this,
                    Manifest.permission.POST_NOTIFICATIONS
                ) != PackageManager.PERMISSION_GRANTED
            ) {
                notificationPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
            }
        }

        sessionManager = SagaiSessionManager(applicationContext)
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
    var isSplashActive by remember { mutableStateOf(true) }
    var showBiodataSheet by remember { mutableStateOf(false) }
    var showNotificationsSheet by remember { mutableStateOf(false) }

    val currentUser by session.currentUser
    
    val isOnboardingRequired = currentUser?.let {
        session.isNewlyRegistered.value && (it.gotra.isEmpty() || it.motherGotra.isEmpty() || it.thikana.isEmpty() || it.phone.isEmpty())
    } ?: false

    if (isSplashActive) {
        SplashView(onTimeout = { isSplashActive = false })
    } else if (currentUser == null) {
        // App started: lock behind Login / Register onboarding gate
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
    } else if (isOnboardingRequired) {
        OnboardingView(session = session)
    } else {
        Scaffold(
            bottomBar = {
                NavigationBar(
                    containerColor = Color.White,
                    contentColor = AppPrimary,
                    tonalElevation = 8.dp,
                    modifier = Modifier.border(0.5.dp, Color(0xFFE5E7EB))
                ) {
                    // Tab 0: Discover (1st tab)
                    NavigationBarItem(
                        selected = selectedTab == 0,
                        onClick = { selectedTab = 0 },
                        icon = { Icon(Icons.Default.Layers, contentDescription = "Discover") },
                        label = { Text("Discover", fontSize = 11.sp, fontWeight = if (selectedTab == 0) FontWeight.Bold else FontWeight.Medium) },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = AppPrimary,
                            selectedTextColor = AppPrimary,
                            indicatorColor = AppPrimary.copy(alpha = 0.12f),
                            unselectedIconColor = Color(0xFF9CA3AF),
                            unselectedTextColor = Color(0xFF9CA3AF)
                        )
                    )

                    // Tab 1: Messages (2nd tab)
                    NavigationBarItem(
                        selected = selectedTab == 1,
                        onClick = { selectedTab = 1 },
                        icon = { Icon(Icons.Default.ChatBubble, contentDescription = "Messages") },
                        label = { Text("Messages", fontSize = 11.sp, fontWeight = if (selectedTab == 1) FontWeight.Bold else FontWeight.Medium) },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = AppPrimary,
                            selectedTextColor = AppPrimary,
                            indicatorColor = AppPrimary.copy(alpha = 0.12f),
                            unselectedIconColor = Color(0xFF9CA3AF),
                            unselectedTextColor = Color(0xFF9CA3AF)
                        )
                    )

                    // Tab 2: Premium (3rd tab / center)
                    NavigationBarItem(
                        selected = selectedTab == 2,
                        onClick = { selectedTab = 2 },
                        icon = { Icon(Icons.Default.WorkspacePremium, contentDescription = "Premium") },
                        label = { Text("Premium", fontSize = 11.sp, fontWeight = if (selectedTab == 2) FontWeight.Bold else FontWeight.Medium) },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = AppPrimary,
                            selectedTextColor = AppPrimary,
                            indicatorColor = AppPrimary.copy(alpha = 0.12f),
                            unselectedIconColor = Color(0xFF9CA3AF),
                            unselectedTextColor = Color(0xFF9CA3AF)
                        )
                    )

                    // Tab 3: Requests (4th tab)
                    NavigationBarItem(
                        selected = selectedTab == 3,
                        onClick = { selectedTab = 3 },
                        icon = { Icon(Icons.Default.Mail, contentDescription = "Requests") },
                        label = { Text("Requests", fontSize = 11.sp, fontWeight = if (selectedTab == 3) FontWeight.Bold else FontWeight.Medium) },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = AppPrimary,
                            selectedTextColor = AppPrimary,
                            indicatorColor = AppPrimary.copy(alpha = 0.12f),
                            unselectedIconColor = Color(0xFF9CA3AF),
                            unselectedTextColor = Color(0xFF9CA3AF)
                        )
                    )

                    // Tab 4: Profile (5th / last tab)
                    NavigationBarItem(
                        selected = selectedTab == 4,
                        onClick = { selectedTab = 4 },
                        icon = { Icon(Icons.Default.AccountCircle, contentDescription = "Profile") },
                        label = { Text("Profile", fontSize = 11.sp, fontWeight = if (selectedTab == 4) FontWeight.Bold else FontWeight.Medium) },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = AppPrimary,
                            selectedTextColor = AppPrimary,
                            indicatorColor = AppPrimary.copy(alpha = 0.12f),
                            unselectedIconColor = Color(0xFF9CA3AF),
                            unselectedTextColor = Color(0xFF9CA3AF)
                        )
                    )
                }
            }
        ) { innerPadding ->
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(innerPadding)
            ) {
                when (selectedTab) {
                    0 -> MatchesView(
                        session = session,
                        onNavigateToRegister = { showingRegister = true },
                        onProfileDetailSelect = { selectedProfileForDetail = it },
                        onNotificationTap = { showNotificationsSheet = true }
                    )
                    1 -> ChatView(
                        session = session,
                        onNavigateToDiscover = { selectedTab = 0 },
                        onNavigateToRegister = { showingRegister = true }
                    )
                    2 -> PlansView(
                        session = session,
                        onNotificationsTap = { showNotificationsSheet = true }
                    )
                    3 -> InboxView(session = session)
                    4 -> MyProfileView(
                        session = session,
                        onNavigateToPremium = { selectedTab = 2 },
                        onViewBiodata = { showBiodataSheet = true }
                    )
                }
            }

            // Profile detail modal bottom sheet
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

            // Rajput Matrimonial Biodata Dialog
            if (showBiodataSheet) {
                BiodataDialog(
                    session = session,
                    onDismiss = { showBiodataSheet = false }
                )
            }

            // Royal Notifications Dialog
            if (showNotificationsSheet) {
                NotificationsDialog(
                    session = session,
                    onDismiss = { showNotificationsSheet = false }
                )
            }
        }
    }
}

@Composable
fun NotificationsDialog(
    session: SagaiSessionManager,
    onDismiss: () -> Unit
) {
    val notifs by session.notificationsList
    
    androidx.compose.ui.window.Dialog(onDismissRequest = onDismiss) {
        Surface(
            shape = RoundedCornerShape(24.dp),
            color = DeepMaroon,
            border = androidx.compose.foundation.BorderStroke(1.dp, RoyalGold.copy(alpha = 0.4f)),
            modifier = Modifier
                .fillMaxWidth()
                .fillMaxHeight(0.7f)
                .padding(16.dp)
        ) {
            Column(modifier = Modifier.padding(20.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Royal Notifications",
                        color = LightGold,
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Serif
                    )
                    IconButton(onClick = onDismiss) {
                        Icon(
                            imageVector = Icons.Default.Close,
                            contentDescription = "Close",
                            tint = LightGold
                        )
                    }
                }
                
                Spacer(modifier = Modifier.height(16.dp))
                
                if (notifs.isEmpty()) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .weight(1f),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.NotificationsOff,
                                contentDescription = "None",
                                tint = RoyalGold.copy(alpha = 0.5f),
                                modifier = Modifier.size(48.dp)
                            )
                            Text(
                                text = "No notifications yet",
                                color = LightGold,
                                fontWeight = FontWeight.Bold,
                                fontSize = 16.sp
                            )
                            Text(
                                text = "Updates about match interests and connection responses will appear here.",
                                color = SandstoneIvory.copy(alpha = 0.7f),
                                fontSize = 12.sp,
                                textAlign = TextAlign.Center,
                                modifier = Modifier.padding(horizontal = 16.dp)
                            )
                        }
                    }
                } else {
                    androidx.compose.foundation.lazy.LazyColumn(
                        modifier = Modifier
                            .fillMaxWidth()
                            .weight(1f),
                        verticalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        items(notifs.size) { index ->
                            val notification = notifs[index]
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .background(CardBackground.copy(alpha = 0.2f), RoundedCornerShape(12.dp))
                                    .border(1.dp, RoyalGold.copy(alpha = 0.2f), RoundedCornerShape(12.dp))
                                    .padding(12.dp),
                                verticalAlignment = Alignment.Top
                            ) {
                                Box(
                                    contentAlignment = Alignment.Center,
                                    modifier = Modifier
                                        .size(36.dp)
                                        .background(RoyalGold.copy(alpha = 0.15f), shape = CircleShape)
                                ) {
                                    MeaningfulIcon(RoyalGold)
                                }
                                Spacer(modifier = Modifier.width(12.dp))
                                Column {
                                    Text(
                                        text = notification.message,
                                        color = SandstoneIvory,
                                        fontSize = 13.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Text(
                                        text = notification.timestamp,
                                        color = SandstoneIvory.copy(alpha = 0.5f),
                                        fontSize = 10.sp
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun MeaningfulIcon(tint: Color) {
    Icon(
        imageVector = Icons.Default.Notifications,
        contentDescription = "Bell",
        tint = tint,
        modifier = Modifier.size(18.dp)
    )
}
