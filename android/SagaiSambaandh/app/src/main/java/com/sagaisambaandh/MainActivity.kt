package com.sagaisambaandh

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.sagaisambaandh.data.Profile
import com.sagaisambaandh.data.SagaiSessionManager
import com.sagaisambaandh.ui.screens.*
import com.sagaisambaandh.ui.theme.*
import androidx.compose.runtime.getValue
import androidx.compose.runtime.setValue
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {
    private lateinit var sessionManager: SagaiSessionManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
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

    val currentUser by session.currentUser
    
    val isOnboardingRequired = currentUser?.let {
        it.gotra.isEmpty() || it.motherGotra.isEmpty() || it.thikana.isEmpty() || it.phone.isEmpty()
    } ?: false

    if (isSplashActive) {
        SplashView(onTimeout = { isSplashActive = false })
    } else if (currentUser == null) {
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
    } else if (isOnboardingRequired) {
        OnboardingView(session = session)
    } else {
        val drawerState = rememberDrawerState(initialValue = DrawerValue.Closed)
        val scope = rememberCoroutineScope()
        var showMyProfileSheet by remember { mutableStateOf(false) }
        var showBiodataSheet by remember { mutableStateOf(false) }

        ModalNavigationDrawer(
            drawerState = drawerState,
            drawerContent = {
                ModalDrawerSheet(
                    drawerContainerColor = DeepMaroon,
                    drawerContentColor = SandstoneIvory,
                    modifier = Modifier.width(300.dp)
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxHeight()
                            .background(DeepMaroon)
                            .verticalScroll(rememberScrollState())
                            .padding(20.dp)
                    ) {
                        // User Profile Header Block
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable {
                                    showMyProfileSheet = true
                                    scope.launch { drawerState.close() }
                                }
                                .padding(vertical = 16.dp)
                        ) {
                            Box(modifier = Modifier.size(64.dp)) {
                                Box(
                                    contentAlignment = Alignment.Center,
                                    modifier = Modifier
                                        .size(60.dp)
                                        .background(Color.White.copy(alpha = 0.15f), shape = CircleShape)
                                        .border(1.dp, LightGold.copy(alpha = 0.5f), shape = CircleShape)
                                ) {
                                    val resId = getAvatarResId(currentUser?.profilePic)
                                    if (resId != null) {
                                        Image(
                                            painter = painterResource(id = resId),
                                            contentDescription = "Avatar",
                                            contentScale = ContentScale.Crop,
                                            modifier = Modifier
                                                .size(60.dp)
                                                .clip(CircleShape)
                                        )
                                    } else {
                                        Icon(
                                            imageVector = Icons.Default.Person,
                                            contentDescription = "Avatar",
                                            tint = LightGold,
                                            modifier = Modifier.size(36.dp)
                                        )
                                    }
                                }
                                Box(
                                    contentAlignment = Alignment.Center,
                                    modifier = Modifier
                                        .size(20.dp)
                                        .background(Color(0xFF00B0FF), shape = CircleShape)
                                        .align(Alignment.BottomEnd)
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.Add,
                                        contentDescription = "Add Photo",
                                        tint = Color.White,
                                        modifier = Modifier.size(12.dp)
                                    )
                                }
                            }
                            
                            Spacer(modifier = Modifier.width(16.dp))
                            
                            Column {
                                Text(
                                    text = currentUser?.name ?: "Noble Member",
                                    color = SandstoneIvory,
                                    fontSize = 16.sp,
                                    fontWeight = FontWeight.Bold,
                                    fontFamily = FontFamily.Serif
                                )
                                Spacer(modifier = Modifier.height(2.dp))
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Text(
                                        text = "SS-${(currentUser?.id ?: "927817").uppercase()}",
                                        color = LightGold,
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.Medium
                                    )
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Icon(
                                        imageVector = Icons.Default.ContentCopy,
                                        contentDescription = "Copy ID",
                                        tint = LightGold.copy(alpha = 0.7f),
                                        modifier = Modifier.size(12.dp)
                                    )
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(10.dp))
                        Divider(color = LightGold.copy(alpha = 0.15f), thickness = 1.dp)
                        Spacer(modifier = Modifier.height(16.dp))

                        // Items
                        DrawerMenuItem(
                            icon = Icons.Default.Warning,
                            title = "Complete Verification",
                            tint = Color(0xFFFF5252),
                            hasWarningBadge = true,
                            onClick = {
                                scope.launch { drawerState.close() }
                                showMyProfileSheet = true
                            }
                        )
                        DrawerMenuItem(
                            icon = Icons.Default.Edit,
                            title = "View and Edit your Profile",
                            onClick = {
                                scope.launch { drawerState.close() }
                                showMyProfileSheet = true
                            }
                        )
                        DrawerMenuItem(
                            icon = Icons.Default.Download,
                            title = "Download and Share Profile",
                            onClick = {
                                scope.launch { drawerState.close() }
                                showBiodataSheet = true
                            }
                        )
                        DrawerMenuItem(
                            icon = Icons.Default.Star,
                            title = "Upgrade to Premium",
                            iconColor = LightGold,
                            onClick = {
                                scope.launch { drawerState.close() }
                                selectedTab = 4
                            }
                        )
                        DrawerMenuItem(
                            icon = Icons.Default.CardMembership,
                            title = "VIPSHAADI",
                            onClick = {
                                scope.launch { drawerState.close() }
                                selectedTab = 4
                            }
                        )

                        Spacer(modifier = Modifier.height(16.dp))
                        Text(
                            text = "DISCOVER YOUR MATCHES",
                            color = SandstoneIvory.copy(alpha = 0.5f),
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            letterSpacing = 1.sp,
                            modifier = Modifier.padding(vertical = 8.dp, horizontal = 4.dp)
                        )

                        DrawerMenuItem(
                            icon = Icons.Default.Favorite,
                            title = "Matches",
                            onClick = {
                                scope.launch { drawerState.close() }
                                selectedTab = 1
                            }
                        )
                        DrawerMenuItem(
                            icon = Icons.Default.Email,
                            title = "Inbox",
                            onClick = {
                                scope.launch { drawerState.close() }
                                selectedTab = 2
                            }
                        )
                        DrawerMenuItem(
                            icon = Icons.Default.Chat,
                            title = "Chat",
                            onClick = {
                                scope.launch { drawerState.close() }
                                selectedTab = 3
                            }
                        )

                        Spacer(modifier = Modifier.height(16.dp))
                        Text(
                            text = "OPTIONS & SETTINGS",
                            color = SandstoneIvory.copy(alpha = 0.5f),
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            letterSpacing = 1.sp,
                            modifier = Modifier.padding(vertical = 8.dp, horizontal = 4.dp)
                        )

                        DrawerMenuItem(
                            icon = Icons.Default.Settings,
                            title = "Partner Preferences",
                            onClick = { scope.launch { drawerState.close() } }
                        )
                        DrawerMenuItem(
                            icon = Icons.Default.FilterList,
                            title = "Contact Filters",
                            onClick = { scope.launch { drawerState.close() } }
                        )
                        DrawerMenuItem(
                            icon = Icons.Default.Logout,
                            title = "Log Out",
                            iconColor = Color(0xFFFF5252),
                            onClick = {
                                scope.launch { drawerState.close() }
                                session.logout()
                            }
                        )
                    }
                }
            }
        ) {
            Scaffold(
                topBar = {
                    CenterAlignedTopAppBar(
                        title = {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.Center
                            ) {
                                Image(
                                    painter = painterResource(id = R.drawable.logo),
                                    contentDescription = "Sagai Sambandh Logo",
                                    modifier = Modifier
                                        .size(32.dp)
                                        .clip(CircleShape)
                                        .background(Color.White, shape = CircleShape)
                                        .border(0.5.dp, RoyalGold, shape = CircleShape)
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(
                                    text = "Sagai Sambandh",
                                    fontFamily = FontFamily.Serif,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 18.sp,
                                    color = LightGold
                                )
                            }
                        },
                        navigationIcon = {
                            IconButton(onClick = {
                                scope.launch { drawerState.open() }
                            }) {
                                Icon(
                                    imageVector = Icons.Default.Menu,
                                    contentDescription = "Menu",
                                    tint = LightGold
                                )
                            }
                        },
                        actions = {
                            IconButton(onClick = { showMyProfileSheet = true }) {
                                Icon(
                                    imageVector = Icons.Default.AccountCircle,
                                    contentDescription = "My Profile",
                                    tint = LightGold
                                )
                            }
                        },
                        colors = TopAppBarDefaults.centerAlignedTopAppBarColors(
                            containerColor = DeepMaroon
                        )
                    )
                },
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
                            onNavigateToRegister = {},
                            onProfileDetailSelect = { selectedProfileForDetail = it }
                        )
                        1 -> MatchesView(
                            session = session,
                            onNavigateToRegister = {},
                            onProfileDetailSelect = { selectedProfileForDetail = it }
                        )
                        2 -> InboxView(session = session)
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

                // My Profile full card editor sheet
                if (showMyProfileSheet) {
                    ModalBottomSheet(
                        onDismissRequest = { showMyProfileSheet = false },
                        containerColor = DeepMaroon
                    ) {
                        MyProfileView(
                            session = session,
                            onDismiss = { showMyProfileSheet = false }
                        )
                    }
                }

                // Rajput Matrimonial Biodata sheet
                if (showBiodataSheet) {
                    com.sagaisambaandh.ui.screens.BiodataDialog(
                        session = session,
                        onDismiss = { showBiodataSheet = false }
                    )
                }
            }
        }
    }
}

@Composable
fun DrawerMenuItem(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    title: String,
    iconColor: Color = LightGold,
    tint: Color = SandstoneIvory,
    hasWarningBadge: Boolean = false,
    onClick: () -> Unit
) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .padding(vertical = 12.dp, horizontal = 4.dp)
    ) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            tint = iconColor,
            modifier = Modifier.size(20.dp)
        )
        Spacer(modifier = Modifier.width(16.dp))
        Text(
            text = title,
            color = tint,
            fontSize = 14.sp,
            fontWeight = FontWeight.Medium,
            modifier = Modifier.weight(1f)
        )
        if (hasWarningBadge) {
            Icon(
                imageVector = Icons.Default.Warning,
                contentDescription = "Alert",
                tint = Color(0xFFFF5252),
                modifier = Modifier.size(16.dp)
            )
        } else {
            Icon(
                imageVector = Icons.Default.ChevronRight,
                contentDescription = null,
                tint = SandstoneIvory.copy(alpha = 0.3f),
                modifier = Modifier.size(16.dp)
            )
        }
    }
}

fun getAvatarResId(name: String?): Int? {
    return null
}
