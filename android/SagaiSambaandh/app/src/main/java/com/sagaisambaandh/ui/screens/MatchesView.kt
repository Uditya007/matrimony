package com.sagaisambaandh.ui.screens

import android.widget.Toast
import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.Orientation
import androidx.compose.foundation.gestures.draggable
import androidx.compose.foundation.gestures.rememberDraggableState
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.PaperPlane
import androidx.compose.material.icons.filled.Verified
import androidx.compose.material3.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import org.json.JSONObject
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.sagaisambaandh.data.Profile
import com.sagaisambaandh.data.SagaiSessionManager
import com.sagaisambaandh.ui.components.ProfileCard
import com.sagaisambaandh.ui.theme.*
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlin.math.roundToInt

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MatchesView(
    session: SagaiSessionManager,
    onNavigateToRegister: () -> Unit,
    onProfileDetailSelect: (Profile) -> Unit,
    modifier: Modifier = Modifier
) {
    val profiles = session.profiles.value
    var activeFilterTab by remember { mutableStateOf(0) } // 0 = All, 1 = Compatible Gotras
    val searchGender by session.searchGender
    val searchClan by session.searchClan

    var viewMode by remember { mutableStateOf(0) } // 0 = Swipe Cards, 1 = List Feed
    var showingConnectSuccess by remember { mutableStateOf(false) }
    var successProfileName by remember { mutableStateOf("") }

    val user = session.currentUser.value
    val filteredMatches = remember(profiles, activeFilterTab, user, searchGender, searchClan) {
        val searched = profiles.filter {
            val genderMatch = it.gender == searchGender
            val clanMatch = searchClan == "All Clans" || it.clan.lowercase() == searchClan.lowercase()
            genderMatch && clanMatch
        }

        if (activeFilterTab == 1 && user != null) {
            searched.filter {
                it.gotra.lowercase() != user.gotra.lowercase()
            }
        } else {
            searched
        }
    }

    Box(modifier = modifier.fillMaxSize()) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .background(MaterialTheme.colorScheme.background)
        ) {
            // Top Toolbar
            CenterAlignedTopAppBar(
                title = {
                    Text(
                        text = "Matches",
                        fontFamily = FontFamily.Serif,
                        fontWeight = FontWeight.Bold,
                        fontSize = 20.sp,
                        color = LightGold
                    )
                },
                colors = TopAppBarDefaults.centerAlignedTopAppBarColors(
                    containerColor = DeepMaroon
                )
            )

            // View Mode switcher tabs
            TabRow(
                selectedTabIndex = viewMode,
                containerColor = DeepMaroon,
                contentColor = LightGold,
                divider = {},
                modifier = Modifier.fillMaxWidth()
            ) {
                Tab(selected = viewMode == 0, onClick = { viewMode = 0 }) {
                    Text(
                        text = "Swipe Cards",
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold,
                        color = if (viewMode == 0) LightGold else SandstoneIvory.copy(alpha = 0.6f),
                        modifier = Modifier.padding(vertical = 12.dp)
                    )
                }
                Tab(selected = viewMode == 1, onClick = { viewMode = 1 }) {
                    Text(
                        text = "List Feed",
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold,
                        color = if (viewMode == 1) LightGold else SandstoneIvory.copy(alpha = 0.6f),
                        modifier = Modifier.padding(vertical = 12.dp)
                    )
                }
            }

            // Sub Filter Tabs
            TabRow(
                selectedTabIndex = activeFilterTab,
                containerColor = DeepMaroon,
                contentColor = LightGold,
                divider = {},
                modifier = Modifier.fillMaxWidth()
            ) {
                Tab(
                    selected = activeFilterTab == 0,
                    onClick = { activeFilterTab = 0 }
                ) {
                    Text(
                        text = "All Matches",
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold,
                        color = if (activeFilterTab == 0) LightGold else SandstoneIvory.copy(alpha = 0.6f),
                        modifier = Modifier.padding(vertical = 12.dp)
                    )
                }
                Tab(
                    selected = activeFilterTab == 1,
                    onClick = { activeFilterTab = 1 }
                ) {
                    Text(
                        text = "Gotra Compatible",
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold,
                        color = if (activeFilterTab == 1) LightGold else SandstoneIvory.copy(alpha = 0.6f),
                        modifier = Modifier.padding(vertical = 12.dp)
                    )
                }
            }

            if (viewMode == 0) {
                // Swipe Card Deck Mode
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .weight(1f),
                    contentAlignment = Alignment.Center
                ) {
                    SwipeDeckDeck(
                        profiles = filteredMatches,
                        isLocked = user == null,
                        onUnlock = onNavigateToRegister,
                        onConnect = { profile ->
                            successProfileName = profile.name
                            showingConnectSuccess = true
                            user?.id?.let { senderId ->
                                sendConnectionRequest(senderId, profile.id)
                            }
                        }
                    )
                }
            } else {
                // Scrollable matches list mode
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .verticalScroll(rememberScrollState())
                        .padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    filteredMatches.forEach { match ->
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(16.dp),
                            colors = CardDefaults.cardColors(containerColor = DeepMaroon),
                            elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
                        ) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                ProfileCard(
                                    profile = match,
                                    isLocked = user == null,
                                    onUnlockTap = onNavigateToRegister,
                                    onDetailTap = {
                                        if (user == null) onNavigateToRegister()
                                        else onProfileDetailSelect(match)
                                    }
                                )
                                Spacer(modifier = Modifier.height(12.dp))
                                Button(
                                    onClick = {
                                        if (user == null) {
                                            onNavigateToRegister()
                                        } else {
                                            successProfileName = match.name
                                            showingConnectSuccess = true
                                            user.id?.let { senderId ->
                                                sendConnectionRequest(senderId, match.id)
                                            }
                                        }
                                    },
                                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF4CAF50)),
                                    shape = RoundedCornerShape(22.dp),
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .height(44.dp)
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.CheckCircle,
                                        contentDescription = "Checkmark",
                                        tint = Color.White,
                                        modifier = Modifier.size(18.dp)
                                    )
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text("Connect Now", color = Color.White, fontWeight = FontWeight.Bold)
                                }
                            }
                        }
                    }
                }
            }
        }

        // Connection Notification Alert popup
        if (showingConnectSuccess) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Color.Black.copy(alpha = 0.4f))
                    .clickable { showingConnectSuccess = false },
                contentAlignment = Alignment.Center
            ) {
                Surface(
                    shape = RoundedCornerShape(16.dp),
                    border = borderStroke(2.dp, LightGold),
                    color = DeepMaroon,
                    modifier = Modifier
                        .fillMaxWidth(0.85f)
                        .padding(16.dp)
                ) {
                    Column(
                        modifier = Modifier.padding(24.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.PaperPlane,
                            contentDescription = "Sent",
                            tint = LightGold,
                            modifier = Modifier.size(48.dp)
                        )
                        Text(
                            text = "Connection Sent!",
                            color = LightGold,
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold,
                            fontFamily = FontFamily.Serif
                        )
                        Text(
                            text = "$successProfileName has been notified of your interest. You will be alerted once they accept.",
                            color = SandstoneIvory,
                            fontSize = 13.sp,
                            textAlign = TextAlign.Center,
                            lineHeight = 18.sp
                        )
                    }
                }
            }

            LaunchedEffect(showingConnectSuccess) {
                delay(2500)
                showingConnectSuccess = false
            }
        }
    }
}

@Composable
fun SwipeDeckDeck(
    profiles: List<Profile>,
    isLocked: Boolean,
    onUnlock: () -> Unit,
    onConnect: (Profile) -> Unit
) {
    var currentIndex by remember { mutableStateOf(0) }
    var offsetX by remember { mutableStateOf(0f) }
    val coroutineScope = rememberCoroutineScope()
    
    if (currentIndex < profiles.size) {
        val profile = profiles[currentIndex]
        
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier.padding(20.dp)
        ) {
            // Swipeable Card
            Box(
                modifier = Modifier
                    .size(310.dp, 400.dp)
                    .offset { IntOffset(offsetX.roundToInt(), 0) }
                    .draggable(
                        orientation = Orientation.Horizontal,
                        state = rememberDraggableState { delta ->
                            offsetX += delta
                        },
                        onDragStopped = { velocity ->
                            if (offsetX > 300f) {
                                // Swiped right -> Like
                                onConnect(profile)
                                currentIndex++
                            } else if (offsetX < -300f) {
                                // Swiped left -> Reject
                                currentIndex++
                            }
                            offsetX = 0f
                        }
                    )
                    .background(Color.Black.copy(alpha = 0.2f), shape = RoundedCornerShape(24.dp))
                    .border(1.5.dp, LightGold.copy(alpha = 0.4f), RoundedCornerShape(24.dp))
                    .clip(RoundedCornerShape(24.dp))
            ) {
                if (isLocked) {
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .background(LightGold.copy(alpha = 0.05f))
                            .padding(20.dp),
                        verticalArrangement = Arrangement.Center,
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Icon(
                            imageVector = Icons.Default.Lock,
                            contentDescription = "Locked",
                            tint = LightGold,
                            modifier = Modifier.size(64.dp)
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        Text(
                            text = "Lineage Card Locked",
                            color = LightGold,
                            fontWeight = FontWeight.Bold,
                            fontSize = 18.sp
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = "Complete your registration to unlock member portraits.",
                            color = SandstoneIvory.copy(alpha = 0.7f),
                            fontSize = 12.sp,
                            textAlign = TextAlign.Center
                        )
                    }
                } else {
                    // Profile Monogram representation
                    Column(
                        modifier = Modifier.fillMaxSize(),
                        verticalArrangement = Arrangement.Center,
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Box(
                            contentAlignment = Alignment.Center,
                            modifier = Modifier
                                .size(120.dp)
                                .background(LightGold, shape = CircleShape)
                        ) {
                            Text(
                                text = profile.name.take(1),
                                color = DeepMaroon,
                                fontSize = 48.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }

                // Shadow overlay at bottom
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(160.dp)
                        .align(Alignment.BottomCenter)
                        .background(
                            brush = Brush.verticalGradient(
                                colors = listOf(Color.Transparent, Color.Black.copy(alpha = 0.9f))
                            )
                        )
                )

                // Details Text
                Column(
                    modifier = Modifier
                        .align(Alignment.BottomStart)
                        .padding(20.dp),
                    verticalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            text = "${profile.name}, ${profile.age}",
                            color = Color.White,
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold
                        )
                        if (profile.isVerified) {
                            Spacer(modifier = Modifier.width(4.dp))
                            Icon(
                                imageVector = Icons.Default.Verified,
                                contentDescription = "Verified",
                                tint = Color(0xFF00B0FF),
                                modifier = Modifier.size(16.dp)
                            )
                        }
                    }
                    Text(
                        text = "${profile.clan} Clan • Gotra: ${profile.gotra}",
                        color = LightGold,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = "${profile.height} • ${profile.education}",
                        color = Color.White.copy(alpha = 0.9f),
                        fontSize = 11.sp
                    )
                    Text(
                        text = "Native: ${profile.thikana}",
                        color = LightGold.copy(alpha = 0.8f),
                        fontSize = 11.sp
                    )
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Check / Cross Action Controls
            Row(
                horizontalArrangement = Arrangement.spacedBy(32.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Skip Cross Button
                IconButton(
                    onClick = {
                        coroutineScope.launch {
                            currentIndex++
                        }
                    },
                    modifier = Modifier
                        .size(60.dp)
                        .background(Color.White, shape = CircleShape)
                        .border(1.dp, Color.LightGray, CircleShape)
                ) {
                    Icon(
                        imageVector = Icons.Default.Close,
                        contentDescription = "Skip",
                        tint = Color.Red,
                        modifier = Modifier.size(24.dp)
                    )
                }

                // Connect Tick Button
                IconButton(
                    onClick = {
                        onConnect(profile)
                        coroutineScope.launch {
                            currentIndex++
                        }
                    },
                    modifier = Modifier
                        .size(60.dp)
                        .background(Color.White, shape = CircleShape)
                        .border(1.dp, Color.LightGray, CircleShape)
                ) {
                    Icon(
                        imageVector = Icons.Default.Check,
                        contentDescription = "Like",
                        tint = Color(0xFF4CAF50),
                        modifier = Modifier.size(24.dp)
                    )
                }
            }
        }
    } else {
        // Deck complete state
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center,
            modifier = Modifier.padding(32.dp)
        ) {
            Icon(
                imageVector = Icons.Default.Verified,
                contentDescription = "Done",
                tint = LightGold,
                modifier = Modifier.size(56.dp)
            )
            Spacer(modifier = Modifier.height(12.dp))
            Text(
                text = "Noble Deck Completed!",
                color = LightGold,
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold,
                fontFamily = FontFamily.Serif
            )
            Spacer(modifier = Modifier.height(6.dp))
            Text(
                text = "You have viewed all matching members of your clan.",
                color = SandstoneIvory.copy(alpha = 0.7f),
                fontSize = 12.sp,
                textAlign = TextAlign.Center
            )
            Spacer(modifier = Modifier.height(16.dp))
            Button(
                onClick = { currentIndex = 0 },
                colors = ButtonDefaults.buttonColors(containerColor = LightGold)
            ) {
                Text("Start Over", color = DeepMaroon, fontWeight = FontWeight.Bold)
            }
        }
    }
}

// Border utility wrapper
private fun borderStroke(width: androidx.compose.ui.unit.Dp, color: Color) = androidx.compose.foundation.BorderStroke(width, color)

fun sendConnectionRequest(senderId: String, receiverId: String) {
    CoroutineScope(Dispatchers.IO).launch {
        try {
            val client = OkHttpClient()
            val mediaType = "application/json; charset=utf-8".toMediaType()
            val url = "https://afbrznllcfgfcjuinnlf.supabase.co/rest/v1/connections"
            val apiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmYnJ6bmxsY2ZnZmNqdWlubmxmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxMzY3MDMsImV4cCI6MjA5OTcxMjcwM30.manruSm0oxHES5Scyzs6NRFTpkVynZQKGT9B1ORPne0"
            
            val json = JSONObject().apply {
                put("sender_id", senderId)
                put("receiver_id", receiverId)
                put("status", "pending")
            }
            
            val request = Request.Builder()
                .url(url)
                .addHeader("apikey", apiKey)
                .addHeader("Authorization", "Bearer $apiKey")
                .post(json.toString().toRequestBody(mediaType))
                .build()
            
            client.newCall(request).execute()
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
}
