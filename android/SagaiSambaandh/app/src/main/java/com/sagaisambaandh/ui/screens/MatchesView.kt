package com.sagaisambaandh.ui.screens

import androidx.compose.animation.*
import androidx.compose.foundation.*
import androidx.compose.foundation.gestures.Orientation
import androidx.compose.foundation.gestures.draggable
import androidx.compose.foundation.gestures.rememberDraggableState
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.sagaisambaandh.R
import com.sagaisambaandh.data.Profile
import com.sagaisambaandh.data.SagaiSessionManager
import com.sagaisambaandh.ui.components.AvatarImageView
import com.sagaisambaandh.ui.components.RoyalBackground
import com.sagaisambaandh.ui.theme.*
import com.sagaisambaandh.util.AIMatchmaker
import com.sagaisambaandh.util.ScoredProfile
import android.content.Intent
import android.net.Uri
import androidx.compose.ui.platform.LocalContext
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlin.math.roundToInt

@Composable
fun MatchesView(
    session: SagaiSessionManager,
    onNavigateToRegister: () -> Unit,
    onProfileDetailSelect: (Profile) -> Unit,
    onNotificationTap: () -> Unit = {},
    modifier: Modifier = Modifier
) {
    val profiles = session.profiles.value
    var activeFilterTab by remember { mutableStateOf(0) } // 0 = All Matches, 1 = Gotra Compatible
    val searchGender by session.searchGender
    val searchClan by session.searchClan

    var viewMode by remember { mutableStateOf(0) } // 0 = Swipe Deck, 1 = Grid Feed
    var showingConnectSuccess by remember { mutableStateOf(false) }
    var successProfileName by remember { mutableStateOf("") }

    // AI Matchmaker States
    var aiQueryInput by remember { mutableStateOf("") }
    var isAIFilterActive by remember { mutableStateOf(false) }
    var activeAITitle by remember { mutableStateOf("") }
    var showingAIChatDialog by remember { mutableStateOf(false) }

    val user = session.currentUser.value
    val isProfileLocked = user == null

    val allScoredProfiles = remember(profiles, user, isAIFilterActive, activeAITitle, aiQueryInput) {
        val query = if (isAIFilterActive) (if (activeAITitle.isNotEmpty()) activeAITitle else aiQueryInput) else null
        AIMatchmaker.searchDatabase(query, user, profiles)
    }

    val scoredMap = remember(allScoredProfiles) {
        allScoredProfiles.associateBy { it.profile.id }
    }

    fun executeAISearch(query: String, title: String) {
        aiQueryInput = query
        activeAITitle = title
        isAIFilterActive = true
    }

    fun clearAISearch() {
        isAIFilterActive = false
        aiQueryInput = ""
        activeAITitle = ""
    }

    val filteredMatches = remember(profiles, activeFilterTab, user, searchGender, searchClan, isAIFilterActive, allScoredProfiles) {
        if (isAIFilterActive) {
            allScoredProfiles.map { it.profile }
        } else {
            val searched = profiles.filter {
                val genderMatch = it.gender.equals(searchGender, ignoreCase = true)
                val clanMatch = searchClan == "All Clans" || it.clan.equals(searchClan, ignoreCase = true)
                genderMatch && clanMatch
            }

            if (activeFilterTab == 1 && user != null && user.gotra.isNotEmpty()) {
                searched.filter {
                    !it.gotra.equals(user.gotra, ignoreCase = true)
                }
            } else {
                searched
            }
        }
    }

    val allMatchesCount = remember(profiles, searchGender, searchClan) {
        profiles.count {
            val genderMatch = it.gender.equals(searchGender, ignoreCase = true)
            val clanMatch = searchClan == "All Clans" || it.clan.equals(searchClan, ignoreCase = true)
            genderMatch && clanMatch
        }
    }

    val gotraMatchesCount = remember(profiles, searchGender, searchClan, user) {
        val base = profiles.filter {
            val genderMatch = it.gender.equals(searchGender, ignoreCase = true)
            val clanMatch = searchClan == "All Clans" || it.clan.equals(searchClan, ignoreCase = true)
            genderMatch && clanMatch
        }
        if (user != null && user.gotra.isNotEmpty()) {
            base.count { !it.gotra.equals(user.gotra, ignoreCase = true) }
        } else {
            base.size
        }
    }

    val coroutineScope = rememberCoroutineScope()

    fun handleConnectTap(profile: Profile) {
        if (isProfileLocked) {
            onNavigateToRegister()
            return
        }
        val currentUser = user ?: return
        successProfileName = profile.name
        showingConnectSuccess = true
        session.sendConnection(currentUser.id, profile.id) {
            session.refreshCurrentUserAbout()
        }
        session.notifyAdminInterestSent(currentUser, profile)
        coroutineScope.launch {
            delay(2800)
            showingConnectSuccess = false
        }
    }

    RoyalBackground(modifier = modifier) {
        Box(modifier = Modifier.fillMaxSize()) {
            Column(modifier = Modifier.fillMaxSize()) {
                // Top Custom Header (Matches iOS Discover Header)
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 20.dp, vertical = 10.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    // Royal Crown Crest Circle
                    Box(
                        contentAlignment = Alignment.Center,
                        modifier = Modifier
                            .size(40.dp)
                            .background(Color.White.copy(alpha = 0.15f), shape = CircleShape)
                    ) {
                        Icon(
                            imageVector = Icons.Default.WorkspacePremium,
                            contentDescription = "Royal Crest",
                            tint = RoyalGold,
                            modifier = Modifier.size(20.dp)
                        )
                    }

                    // Center Title & Location Pin
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(
                            text = "Discover",
                            color = Color.White,
                            fontSize = 20.sp,
                            fontWeight = FontWeight.Bold,
                            fontFamily = FontFamily.Serif
                        )
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Default.Place,
                                contentDescription = "Location",
                                tint = LightGold,
                                modifier = Modifier.size(12.dp)
                            )
                            Spacer(modifier = Modifier.width(3.dp))
                            Text(
                                text = "Rajasthan • Showing ${searchGender}s",
                                color = Color.White.copy(alpha = 0.85f),
                                fontSize = 12.sp,
                                fontWeight = FontWeight.SemiBold
                            )
                        }
                    }

                    // View Mode Toggle (Deck vs Grid)
                    Box(
                        contentAlignment = Alignment.Center,
                        modifier = Modifier
                            .size(40.dp)
                            .background(Color.White.copy(alpha = 0.18f), shape = CircleShape)
                            .clickable {
                                viewMode = if (viewMode == 0) 1 else 0
                            }
                    ) {
                        Icon(
                            imageVector = if (viewMode == 0) Icons.Default.GridView else Icons.Default.Layers,
                            contentDescription = "Toggle View Mode",
                            tint = Color.White,
                            modifier = Modifier.size(18.dp)
                        )
                    }
                }

                // AI Lineage Matchmaker Header Card
                AIMatchmakerHeaderCard(
                    aiQueryInput = aiQueryInput,
                    onQueryChange = { aiQueryInput = it },
                    onSearch = { q, title -> executeAISearch(q, title) },
                    isFilterActive = isAIFilterActive,
                    activeTitle = activeAITitle,
                    matchCount = filteredMatches.size,
                    onReset = { clearAISearch() },
                    onOpenAIChat = { showingAIChatDialog = true }
                )

                // Filter Capsule Pills Bar
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .horizontalScroll(rememberScrollState())
                        .padding(horizontal = 20.dp, vertical = 4.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    // Quick Gender Switcher Pill
                    Row(
                        modifier = Modifier
                            .clip(CircleShape)
                            .background(Color.White.copy(alpha = 0.18f))
                            .border(1.2.dp, RoyalGold.copy(alpha = 0.6f), CircleShape)
                            .clickable {
                                val next = if (searchGender.equals("Bride", ignoreCase = true)) "Groom" else "Bride"
                                session.setLookingForGender(next)
                            }
                            .padding(horizontal = 14.dp, vertical = 8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = if (searchGender.equals("Bride", ignoreCase = true)) "👰 Brides" else "🤵 Grooms",
                            color = Color.White,
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Icon(
                            imageVector = Icons.Default.Sync,
                            contentDescription = "Switch",
                            tint = Color.White,
                            modifier = Modifier.size(12.dp)
                        )
                    }

                    // All Matches Pill
                    FilterPill(
                        title = "All ${searchGender}s",
                        count = allMatchesCount,
                        isSelected = activeFilterTab == 0,
                        onClick = { activeFilterTab = 0 }
                    )

                    // Gotra Compatible Pill
                    FilterPill(
                        title = "Gotra Compatible",
                        count = gotraMatchesCount,
                        isSelected = activeFilterTab == 1,
                        onClick = { activeFilterTab = 1 }
                    )
                }

                Spacer(modifier = Modifier.height(4.dp))

                if (viewMode == 0) {
                    // 3D Swipe Deck Mode
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .weight(1f),
                        contentAlignment = Alignment.Center
                    ) {
                        SwipeDeckDeck(
                            profiles = filteredMatches,
                            scoredMap = scoredMap,
                            isLocked = isProfileLocked,
                            onUnlock = onNavigateToRegister,
                            onOpenDetail = { onProfileDetailSelect(it) },
                            onConnect = { handleConnectTap(it) }
                        )
                    }
                } else {
                    // Modern 2-Column Grid Feed Mode
                    LazyVerticalGrid(
                        columns = GridCells.Fixed(2),
                        contentPadding = PaddingValues(horizontal = 16.dp, vertical = 12.dp),
                        horizontalArrangement = Arrangement.spacedBy(14.dp),
                        verticalArrangement = Arrangement.spacedBy(14.dp),
                        modifier = Modifier.weight(1f)
                    ) {
                        items(filteredMatches) { profile ->
                            GridCardItem(
                                profile = profile,
                                isLocked = isProfileLocked,
                                scoreInfo = scoredMap[profile.id],
                                onCardClick = {
                                    if (isProfileLocked) onNavigateToRegister()
                                    else onProfileDetailSelect(profile)
                                },
                                onConnectClick = { handleConnectTap(profile) }
                            )
                        }
                    }
                }
            }

            // Connection Sent Toast Popover
            AnimatedVisibility(
                visible = showingConnectSuccess,
                enter = slideInVertically(initialOffsetY = { it }) + fadeIn(),
                exit = slideOutVertically(targetOffsetY = { it }) + fadeOut(),
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .padding(horizontal = 20.dp, vertical = 24.dp)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(20.dp))
                        .background(
                            Brush.horizontalGradient(
                                colors = listOf(Color(0xFF7D1526), Color(0xFF4A0D18))
                            )
                        )
                        .border(
                            1.5.dp,
                            Brush.horizontalGradient(listOf(LightGold, RoyalGold)),
                            RoundedCornerShape(20.dp)
                        )
                        .padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(
                        contentAlignment = Alignment.Center,
                        modifier = Modifier
                            .size(44.dp)
                            .background(RoyalGold.copy(alpha = 0.2f), shape = CircleShape)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Favorite,
                            contentDescription = "Heart",
                            tint = LightGold,
                            modifier = Modifier.size(22.dp)
                        )
                    }

                    Spacer(modifier = Modifier.width(14.dp))

                    Column {
                        Text(
                            text = "Rishta Expressed!",
                            color = LightGold,
                            fontSize = 15.sp,
                            fontWeight = FontWeight.Bold,
                            fontFamily = FontFamily.Serif
                        )
                        Spacer(modifier = Modifier.height(2.dp))
                        Text(
                            text = "Notified $successProfileName of your interest.",
                            color = Color.White.copy(alpha = 0.9f),
                            fontSize = 12.sp
                        )
                    }
                }
            }

            // Kunwar AI Chat Dialog
            if (showingAIChatDialog) {
                KunwarAIChatDialog(
                    session = session,
                    onDismiss = { showingAIChatDialog = false },
                    onApplyQueryToDeck = { query, title ->
                        executeAISearch(query, title)
                    },
                    onOpenProfile = { profile ->
                        onProfileDetailSelect(profile)
                    }
                )
            }
        }
    }
}

@Composable
fun FilterPill(
    title: String,
    count: Int,
    isSelected: Boolean,
    onClick: () -> Unit
) {
    Row(
        modifier = Modifier
            .clip(CircleShape)
            .background(
                if (isSelected) {
                    Brush.horizontalGradient(listOf(AppPrimary, AppSecondary))
                } else {
                    Brush.linearGradient(listOf(Color.White.copy(alpha = 0.18f), Color.White.copy(alpha = 0.18f)))
                }
            )
            .border(
                1.dp,
                if (isSelected) Color.Transparent else Color.White.copy(alpha = 0.25f),
                CircleShape
            )
            .clickable(onClick = onClick)
            .padding(horizontal = 14.dp, vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = title,
            color = Color.White,
            fontSize = 13.sp,
            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium
        )
        Spacer(modifier = Modifier.width(6.dp))
        Box(
            modifier = Modifier
                .background(
                    if (isSelected) Color.White.copy(alpha = 0.25f) else Color.White.copy(alpha = 0.15f),
                    shape = CircleShape
                )
                .padding(horizontal = 6.dp, vertical = 2.dp)
        ) {
            Text(
                text = "$count",
                color = Color.White,
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold
            )
        }
    }
}

@Composable
fun SwipeDeckDeck(
    profiles: List<Profile>,
    scoredMap: Map<String, ScoredProfile> = emptyMap(),
    isLocked: Boolean,
    onUnlock: () -> Unit,
    onOpenDetail: (Profile) -> Unit,
    onConnect: (Profile) -> Unit
) {
    var currentIndex by remember { mutableStateOf(0) }
    var offsetX by remember { mutableStateOf(0f) }
    val coroutineScope = rememberCoroutineScope()

    if (currentIndex < profiles.size) {
        val profile = profiles[currentIndex]

        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 16.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            // Main Candidate Card
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .aspectRatio(0.72f)
                    .offset { IntOffset(offsetX.roundToInt(), 0) }
                    .rotate(offsetX / 40f)
                    .draggable(
                        orientation = Orientation.Horizontal,
                        state = rememberDraggableState { delta ->
                            offsetX += delta
                        },
                        onDragStopped = {
                            if (offsetX > 250) {
                                // Swipe right: Send Rishta
                                onConnect(profile)
                                currentIndex++
                            } else if (offsetX < -250) {
                                // Swipe left: Pass
                                currentIndex++
                            }
                            offsetX = 0f
                        }
                    )
                    .clip(RoundedCornerShape(28.dp))
                    .background(Color.Black.copy(alpha = 0.3f))
                    .border(1.5.dp, LightGold.copy(alpha = 0.35f), RoundedCornerShape(28.dp))
            ) {
                if (isLocked) {
                    // Lineage Portrait Secured Backdrop
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .background(
                                Brush.verticalGradient(
                                    listOf(Color(0xFF2B1810), Color(0xFF1B1B1E))
                                )
                            )
                            .padding(24.dp),
                        verticalArrangement = Arrangement.Center,
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Box(
                            contentAlignment = Alignment.Center,
                            modifier = Modifier
                                .size(80.dp)
                                .background(Color.White.copy(alpha = 0.1f), shape = CircleShape)
                        ) {
                            Icon(
                                imageVector = Icons.Default.Shield,
                                contentDescription = "Locked",
                                tint = RoyalGold,
                                modifier = Modifier.size(40.dp)
                            )
                        }
                        Spacer(modifier = Modifier.height(14.dp))
                        Text(
                            text = "Lineage Portrait Secured",
                            color = Color.White,
                            fontWeight = FontWeight.Bold,
                            fontSize = 20.sp,
                            fontFamily = FontFamily.Serif
                        )
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            text = "Log in or create a profile to view authentic portraits.",
                            color = Color.White.copy(alpha = 0.7f),
                            fontSize = 13.sp,
                            textAlign = TextAlign.Center
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        Button(
                            onClick = onUnlock,
                            colors = ButtonDefaults.buttonColors(containerColor = Color.Transparent),
                            contentPadding = PaddingValues(),
                            shape = CircleShape
                        ) {
                            Box(
                                modifier = Modifier
                                    .background(
                                        Brush.horizontalGradient(listOf(AppPrimary, AppSecondary)),
                                        shape = CircleShape
                                    )
                                    .padding(horizontal = 24.dp, vertical = 10.dp)
                            ) {
                                Text(
                                    text = "Unlock Lineage",
                                    color = Color.White,
                                    fontSize = 14.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }
                    }
                } else {
                    // Candidate Photo View
                    AvatarImageView(
                        source = profile.img,
                        name = profile.name,
                        clan = profile.clan,
                        contentDescription = "Candidate Photo",
                        contentScale = ContentScale.Crop,
                        fallbackFontSize = 80.sp,
                        modifier = Modifier.fillMaxSize()
                    )
                }

                // Multi-stop Deep Gradient Overlay
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(
                            Brush.verticalGradient(
                                colors = listOf(
                                    Color.Transparent,
                                    Color.Transparent,
                                    Color.Black.copy(alpha = 0.6f),
                                    Color.Black.copy(alpha = 0.95f)
                                )
                            )
                        )
                )

                // Top Right AI Compatibility Score Badge
                val match = scoredMap[profile.id]
                if (match != null) {
                    Box(
                        modifier = Modifier
                            .align(Alignment.TopEnd)
                            .padding(16.dp)
                            .clip(CircleShape)
                            .background(Brush.horizontalGradient(listOf(RoyalGold, Color(0xFFB8860B))))
                            .border(1.dp, Color.White.copy(alpha = 0.6f), CircleShape)
                            .padding(horizontal = 10.dp, vertical = 5.dp)
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Default.AutoAwesome,
                                contentDescription = "AI Match",
                                tint = Color.White,
                                modifier = Modifier.size(12.dp)
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(
                                text = "${match.matchScore}% Match",
                                color = Color.White,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }

                // Bottom Candidate Information Card
                Column(
                    modifier = Modifier
                        .align(Alignment.BottomStart)
                        .padding(20.dp),
                    verticalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(
                                text = if (isLocked) "Lineage Member" else "${profile.name}, ${profile.age}",
                                color = Color.White,
                                fontSize = 22.sp,
                                fontWeight = FontWeight.Bold,
                                fontFamily = FontFamily.Serif
                            )
                            if (profile.isVerified) {
                                Spacer(modifier = Modifier.width(6.dp))
                                Icon(
                                    imageVector = Icons.Default.Verified,
                                    contentDescription = "Verified",
                                    tint = VerifiedBlue,
                                    modifier = Modifier.size(18.dp)
                                )
                            }
                        }

                        // Info Up-Arrow Button
                        Box(
                            contentAlignment = Alignment.Center,
                            modifier = Modifier
                                .size(38.dp)
                                .background(Color.White.copy(alpha = 0.22f), shape = CircleShape)
                                .border(1.5.dp, Color.White.copy(alpha = 0.45f), shape = CircleShape)
                                .clickable { onOpenDetail(profile) }
                        ) {
                            Icon(
                                imageVector = Icons.Default.ArrowUpward,
                                contentDescription = "View Details",
                                tint = Color.White,
                                modifier = Modifier.size(18.dp)
                            )
                        }
                    }

                    // AI Match Reason Pill
                    if (match != null && match.reasons.isNotEmpty()) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier
                                .clip(CircleShape)
                                .background(Color.Black.copy(alpha = 0.55f))
                                .border(0.8.dp, RoyalGold.copy(alpha = 0.7f), CircleShape)
                                .padding(horizontal = 10.dp, vertical = 4.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.AutoAwesome,
                                contentDescription = "Reason",
                                tint = RoyalGold,
                                modifier = Modifier.size(10.dp)
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(
                                text = match.reasons.first(),
                                color = LightGold,
                                fontSize = 11.5.sp,
                                fontWeight = FontWeight.SemiBold,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                        }
                    }

                    // Clan & Gotra Pill Tags
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Box(
                            modifier = Modifier
                                .background(Color.White.copy(alpha = 0.16f), shape = CircleShape)
                                .padding(horizontal = 10.dp, vertical = 4.dp)
                        ) {
                            Text(
                                text = "${profile.clan} Clan",
                                color = RoyalGold,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                        Box(
                            modifier = Modifier
                                .background(Color.White.copy(alpha = 0.16f), shape = CircleShape)
                                .padding(horizontal = 10.dp, vertical = 4.dp)
                        ) {
                            Text(
                                text = "${profile.gotra} Gotra",
                                color = Color.White.copy(alpha = 0.9f),
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }

                    // Profession
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Default.Work,
                            contentDescription = "Career",
                            tint = Color.White.copy(alpha = 0.8f),
                            modifier = Modifier.size(12.dp)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = "${profile.occupation} • ${profile.education}",
                            color = Color.White.copy(alpha = 0.92f),
                            fontSize = 13.sp,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                    }

                    // Native Thikana
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Default.Place,
                            contentDescription = "Thikana",
                            tint = AppSecondary,
                            modifier = Modifier.size(12.dp)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = "Thikana: ${profile.thikana}",
                            color = Color.White.copy(alpha = 0.8f),
                            fontSize = 12.sp
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // 3D Neumorphic Floating Action Buttons Row
            Row(
                horizontalArrangement = Arrangement.spacedBy(36.dp),
                verticalAlignment = Alignment.Bottom,
                modifier = Modifier.padding(top = 4.dp)
            ) {
                // PASS Button (Neumorphic)
                NeumorphicActionButton(
                    icon = Icons.Default.Close,
                    iconColor = DislikeRed,
                    label = "PASS",
                    size = 58,
                    onClick = {
                        coroutineScope.launch { currentIndex++ }
                    }
                )

                // Elevated RISHTA Hero Button (Royal Maroon & Gold)
                HeroRishtaButton(
                    onClick = {
                        onConnect(profile)
                        coroutineScope.launch { currentIndex++ }
                    }
                )

                // SHORTLIST Button (Neumorphic)
                NeumorphicActionButton(
                    icon = Icons.Default.Star,
                    iconColor = StarPurple,
                    label = "SHORTLIST",
                    size = 58,
                    onClick = {
                        coroutineScope.launch { currentIndex++ }
                    }
                )
            }
        }
    } else {
        // Deck Completed State
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center,
            modifier = Modifier.padding(32.dp)
        ) {
            Box(
                contentAlignment = Alignment.Center,
                modifier = Modifier
                    .size(80.dp)
                    .background(Color.White.copy(alpha = 0.15f), shape = CircleShape)
                    .border(2.dp, RoyalGold, shape = CircleShape)
            ) {
                Icon(
                    imageVector = Icons.Default.Verified,
                    contentDescription = "Done",
                    tint = LightGold,
                    modifier = Modifier.size(44.dp)
                )
            }
            Spacer(modifier = Modifier.height(16.dp))
            Text(
                text = "Noble Deck Completed!",
                color = LightGold,
                fontSize = 20.sp,
                fontWeight = FontWeight.Bold,
                fontFamily = FontFamily.Serif
            )
            Spacer(modifier = Modifier.height(6.dp))
            Text(
                text = "You have browsed all compatible lineage matches for today. Reset filters to review more Rajput brides and grooms.",
                color = SandstoneIvory.copy(alpha = 0.8f),
                fontSize = 13.sp,
                textAlign = TextAlign.Center
            )
            Spacer(modifier = Modifier.height(20.dp))
            Button(
                onClick = { currentIndex = 0 },
                colors = ButtonDefaults.buttonColors(containerColor = LightGold),
                shape = CircleShape
            ) {
                Text("Revisit Profiles", color = RoyalMaroon, fontWeight = FontWeight.Bold)
            }
        }
    }
}

@Composable
fun NeumorphicActionButton(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    iconColor: Color,
    label: String,
    size: Int,
    onClick: () -> Unit
) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(6.dp)
    ) {
        Box(
            contentAlignment = Alignment.Center,
            modifier = Modifier
                .size(size.dp)
                .clip(CircleShape)
                .background(
                    Brush.linearGradient(
                        listOf(Color.White, Color(0xFFF6F7FB), Color(0xFFE9EBF1))
                    )
                )
                .border(2.dp, Color.White, CircleShape)
                .clickable(onClick = onClick)
        ) {
            Icon(
                imageVector = icon,
                contentDescription = label,
                tint = iconColor,
                modifier = Modifier.size((size * 0.42).dp)
            )
        }

        Text(
            text = label,
            color = Color.White.copy(alpha = 0.85f),
            fontSize = 11.sp,
            fontWeight = FontWeight.Bold,
            letterSpacing = 0.6.sp
        )
    }
}

@Composable
fun HeroRishtaButton(onClick: () -> Unit) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(6.dp)
    ) {
        Box(
            contentAlignment = Alignment.Center,
            modifier = Modifier
                .size(76.dp)
                .clip(CircleShape)
                .background(
                    Brush.linearGradient(
                        listOf(Color(0xFF7D1526), Color(0xFF4A0D18))
                    )
                )
                .border(
                    3.dp,
                    Brush.linearGradient(listOf(LightGold, RoyalGold, LightGold)),
                    CircleShape
                )
                .clickable(onClick = onClick)
        ) {
            Icon(
                imageVector = Icons.Default.Favorite,
                contentDescription = "RISHTA",
                tint = LightGold,
                modifier = Modifier.size(34.dp)
            )
        }

        Text(
            text = "RISHTA",
            color = LightGold,
            fontSize = 12.sp,
            fontWeight = FontWeight.Black,
            letterSpacing = 0.8.sp
        )
    }
}

@Composable
fun GridCardItem(
    profile: Profile,
    isLocked: Boolean,
    scoreInfo: ScoredProfile? = null,
    onCardClick: () -> Unit,
    onConnectClick: () -> Unit
) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(230.dp)
            .clip(RoundedCornerShape(20.dp))
            .background(Color.White.copy(alpha = 0.18f))
            .border(1.dp, Color.White.copy(alpha = 0.25f), RoundedCornerShape(20.dp))
            .clickable(onClick = onCardClick)
    ) {
        if (!isLocked) {
            AvatarImageView(
                source = profile.img,
                name = profile.name,
                clan = profile.clan,
                contentDescription = profile.name,
                contentScale = ContentScale.Crop,
                fallbackFontSize = 38.sp,
                modifier = Modifier.fillMaxSize()
            )
        } else {
            Box(
                contentAlignment = Alignment.Center,
                modifier = Modifier
                    .fillMaxSize()
                    .background(Color.Black.copy(alpha = 0.4f))
            ) {
                Icon(
                    imageVector = Icons.Default.Shield,
                    contentDescription = "Secured",
                    tint = RoyalGold,
                    modifier = Modifier.size(40.dp)
                )
            }
        }

        // Gradient overlay
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    Brush.verticalGradient(
                        colors = listOf(Color.Transparent, Color.Black.copy(alpha = 0.85f))
                    )
                )
        )

        // Top Right AI Match Score Badge
        if (scoreInfo != null) {
            Box(
                modifier = Modifier
                    .align(Alignment.TopEnd)
                    .padding(8.dp)
                    .clip(CircleShape)
                    .background(Brush.horizontalGradient(listOf(RoyalGold, Color(0xFFB8860B))))
                    .padding(horizontal = 7.dp, vertical = 3.dp)
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Default.AutoAwesome,
                        contentDescription = "Match",
                        tint = Color.White,
                        modifier = Modifier.size(9.dp)
                    )
                    Spacer(modifier = Modifier.width(3.dp))
                    Text(
                        text = "${scoreInfo.matchScore}%",
                        color = Color.White,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }

        // Details
        Column(
            modifier = Modifier
                .align(Alignment.BottomStart)
                .padding(12.dp)
        ) {
            Text(
                text = if (isLocked) "Lineage Member" else "${profile.name}, ${profile.age}",
                color = Color.White,
                fontSize = 14.sp,
                fontWeight = FontWeight.Bold,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
            Text(
                text = "${profile.clan} Clan",
                color = LightGold,
                fontSize = 11.sp,
                fontWeight = FontWeight.SemiBold
            )

            if (scoreInfo != null && scoreInfo.reasons.isNotEmpty()) {
                Text(
                    text = scoreInfo.reasons.first(),
                    color = LightGold.copy(alpha = 0.9f),
                    fontSize = 9.5.sp,
                    fontWeight = FontWeight.Medium,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }

            Spacer(modifier = Modifier.height(4.dp))
            // Quick Rishta button
            Button(
                onClick = onConnectClick,
                colors = ButtonDefaults.buttonColors(containerColor = LightGold),
                contentPadding = PaddingValues(horizontal = 10.dp, vertical = 2.dp),
                shape = CircleShape,
                modifier = Modifier.height(26.dp)
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Default.Favorite,
                        contentDescription = null,
                        tint = RoyalMaroon,
                        modifier = Modifier.size(10.dp)
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("Rishta", color = RoyalMaroon, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}

// MARK: - AI Matchmaker Header Card
@Composable
fun AIMatchmakerHeaderCard(
    aiQueryInput: String,
    onQueryChange: (String) -> Unit,
    onSearch: (String, String) -> Unit,
    isFilterActive: Boolean,
    activeTitle: String,
    matchCount: Int,
    onReset: () -> Unit,
    onOpenAIChat: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 20.dp, vertical = 4.dp),
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(containerColor = Color.Transparent),
        border = BorderStroke(
            1.2.dp,
            Brush.linearGradient(listOf(RoyalGold.copy(alpha = 0.7f), LightGold.copy(alpha = 0.3f)))
        )
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(
                    Brush.linearGradient(
                        listOf(Color(0xFF4A0D18).copy(alpha = 0.9f), Color(0xFF2B060E).copy(alpha = 0.95f))
                    )
                )
                .padding(12.dp)
        ) {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                // Title Row
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Default.AutoAwesome,
                            contentDescription = "AI",
                            tint = RoyalGold,
                            modifier = Modifier.size(15.dp)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = "Kunwar AI Matchmaker",
                            color = LightGold,
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Bold,
                            fontFamily = FontFamily.Serif
                        )
                    }

                    Box(
                        modifier = Modifier
                            .clip(CircleShape)
                            .background(LightGold)
                            .clickable(onClick = onOpenAIChat)
                            .padding(horizontal = 10.dp, vertical = 4.dp)
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Default.ChatBubble,
                                contentDescription = "Chat",
                                tint = Color(0xFF4A0D18),
                                modifier = Modifier.size(10.dp)
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(
                                text = "Chat AI",
                                color = Color(0xFF4A0D18),
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }

                // Search Input Row
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .clip(RoundedCornerShape(12.dp))
                            .background(Color.White.copy(alpha = 0.12f))
                            .border(1.dp, RoyalGold.copy(alpha = 0.4f), RoundedCornerShape(12.dp))
                            .padding(horizontal = 10.dp, vertical = 6.dp)
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Default.Search,
                                contentDescription = "Search",
                                tint = RoyalGold.copy(alpha = 0.8f),
                                modifier = Modifier.size(14.dp)
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            BasicTextField(
                                value = aiQueryInput,
                                onValueChange = onQueryChange,
                                singleLine = true,
                                textStyle = androidx.compose.ui.text.TextStyle(
                                    color = Color.White,
                                    fontSize = 12.sp
                                ),
                                modifier = Modifier.weight(1f),
                                decorationBox = { innerTextField ->
                                    if (aiQueryInput.isEmpty()) {
                                        Text(
                                            text = "Ask AI (e.g. Rathore bride 23-27 in Jaipur)...",
                                            color = Color.White.copy(alpha = 0.6f),
                                            fontSize = 12.sp
                                        )
                                    }
                                    innerTextField()
                                }
                            )
                            if (aiQueryInput.isNotEmpty()) {
                                Icon(
                                    imageVector = Icons.Default.Close,
                                    contentDescription = "Clear",
                                    tint = Color.White.copy(alpha = 0.7f),
                                    modifier = Modifier
                                        .size(14.dp)
                                        .clickable { onQueryChange("") }
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.width(8.dp))

                    Box(
                        contentAlignment = Alignment.Center,
                        modifier = Modifier
                            .size(34.dp)
                            .clip(CircleShape)
                            .background(Brush.linearGradient(listOf(AppPrimary, AppSecondary)))
                            .clickable {
                                if (aiQueryInput.isNotBlank()) {
                                    onSearch(aiQueryInput, aiQueryInput)
                                }
                            }
                    ) {
                        Icon(
                            imageVector = Icons.Default.AutoAwesome,
                            contentDescription = "Find",
                            tint = Color.White,
                            modifier = Modifier.size(15.dp)
                        )
                    }
                }

                // Quick Prompt Chips Row
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .horizontalScroll(rememberScrollState()),
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    // "👑 Show My Type of Match" (Prominent Golden Pill)
                    Box(
                        modifier = Modifier
                            .clip(CircleShape)
                            .background(Brush.horizontalGradient(listOf(RoyalGold, Color(0xFFB8860B))))
                            .clickable { onSearch("show my type of match", "My Type of Match") }
                            .padding(horizontal = 11.dp, vertical = 5.dp)
                    ) {
                        Text(
                            text = "👑 Show My Type of Match",
                            color = Color.White,
                            fontSize = 11.5.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }

                    QuickChip(label = "🏰 Rathore 22-26") { onSearch("Rathore clan 22 to 26", "Rathore 22-26") }
                    QuickChip(label = "👨‍⚕️ Doctors & Engg") { onSearch("doctor or engineer", "Doctors & Engineers") }
                    QuickChip(label = "📍 Jaipur / Jodhpur") { onSearch("Jaipur or Jodhpur", "Jaipur / Jodhpur") }
                    QuickChip(label = "🛡️ Gotra Safe") { onSearch("gotra compatible safe", "Gotra Safe") }
                }

                // Active AI Filter Banner
                if (isFilterActive) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(10.dp))
                            .background(RoyalGold.copy(alpha = 0.2f))
                            .border(1.dp, RoyalGold.copy(alpha = 0.7f), RoundedCornerShape(10.dp))
                            .padding(horizontal = 10.dp, vertical = 6.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.weight(1f)
                        ) {
                            Icon(
                                imageVector = Icons.Default.Verified,
                                contentDescription = "Active",
                                tint = RoyalGold,
                                modifier = Modifier.size(14.dp)
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = "AI Match: '$activeTitle' • $matchCount found",
                                color = Color.White,
                                fontSize = 11.5.sp,
                                fontWeight = FontWeight.Bold,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                        }

                        Box(
                            modifier = Modifier
                                .clip(CircleShape)
                                .background(Color.White)
                                .clickable(onClick = onReset)
                                .padding(horizontal = 8.dp, vertical = 3.dp)
                        ) {
                            Text(
                                text = "✕ Reset",
                                color = DislikeRed,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun QuickChip(label: String, onClick: () -> Unit) {
    Box(
        modifier = Modifier
            .clip(CircleShape)
            .background(Color.White.copy(alpha = 0.12f))
            .border(1.dp, Color.White.copy(alpha = 0.25f), CircleShape)
            .clickable(onClick = onClick)
            .padding(horizontal = 10.dp, vertical = 5.dp)
    ) {
        Text(
            text = label,
            color = Color.White.copy(alpha = 0.9f),
            fontSize = 11.sp,
            fontWeight = FontWeight.Medium
        )
    }
}

// MARK: - Kunwar AI Chat Assistant Dialog
data class AndroidKunwarChatMessage(
    val isUser: Boolean,
    val text: String,
    val recommendations: List<ScoredProfile> = emptyList()
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun KunwarAIChatDialog(
    session: SagaiSessionManager,
    onDismiss: () -> Unit,
    onApplyQueryToDeck: (String, String) -> Unit,
    onOpenProfile: (Profile) -> Unit
) {
    val context = LocalContext.current
    var inputMessage by remember { mutableStateOf("") }
    val messages = remember {
        mutableStateListOf(
            AndroidKunwarChatMessage(
                isUser = false,
                text = "Khammaghani! I am Kunwar from Shree Rajput Sagai Sambandh.\n\nI can search our royal database according to your lineage gotra rules and preference criteria. How can I assist your rishta search today?"
            )
        )
    }
    var isAnalyzing by remember { mutableStateOf(false) }
    val coroutineScope = rememberCoroutineScope()

    fun handleSend(queryText: String) {
        val q = queryText.trim()
        if (q.isEmpty()) return
        inputMessage = ""
        messages.add(AndroidKunwarChatMessage(isUser = true, text = q))
        isAnalyzing = true

        coroutineScope.launch {
            delay(600)
            isAnalyzing = false
            val lower = q.lowercase()

            if (lower.contains("gotra") || lower.contains("rule") || lower.contains("sagotra")) {
                messages.add(
                    AndroidKunwarChatMessage(
                        isUser = false,
                        text = "📜 Rajput Gotra Marriage Rules:\n\nIn traditional Rajput alliances, marriage within the same Gotra is strictly forbidden (Sagotra union) to respect genetics and ancestral lineage.\n\nA noble alliance verifies four gotras:\n1. Self Gotra (Father's side)\n2. Mother's Gotra\n3. Dadi's Gotra\n4. Nani's Gotra\n\nOur system automatically checks your gotra against candidates to ensure 100% compliance!"
                    )
                )
            } else if (lower.contains("agent") || lower.contains("call") || lower.contains("whatsapp") || lower.contains("support")) {
                try {
                    val intent = Intent(Intent.ACTION_VIEW, Uri.parse("https://wa.me/919928592159"))
                    context.startActivity(intent)
                } catch (e: Exception) {
                    e.printStackTrace()
                }
                messages.add(
                    AndroidKunwarChatMessage(
                        isUser = false,
                        text = "📞 Connecting you to our Royal Relations Desk on WhatsApp (+91 99285 92159)... Our matchmaking counselor will assist you directly."
                    )
                )
            } else {
                val results = AIMatchmaker.searchDatabase(q, session.currentUser.value, session.profiles.value)
                val topMatches = results.take(4)
                messages.add(
                    AndroidKunwarChatMessage(
                        isUser = false,
                        text = "👑 Khammaghani! I searched the royal database for '$q'. Found ${results.size} compatible profiles matching your gotra and lineage requirements. Here are the top recommendations:",
                        recommendations = topMatches
                    )
                )
            }
        }
    }

    AlertDialog(
        onDismissRequest = onDismiss,
        modifier = Modifier
            .fillMaxWidth()
            .fillMaxHeight(0.85f),
        properties = androidx.compose.ui.window.DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Card(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp),
            shape = RoundedCornerShape(24.dp),
            colors = CardDefaults.cardColors(containerColor = Color(0xFFF9FAFB))
        ) {
            Column(modifier = Modifier.fillMaxSize()) {
                // Header
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(Color.White)
                        .padding(horizontal = 16.dp, vertical = 14.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            contentAlignment = Alignment.Center,
                            modifier = Modifier
                                .size(32.dp)
                                .clip(CircleShape)
                                .background(Color(0xFF4A0D18))
                        ) {
                            Icon(
                                imageVector = Icons.Default.WorkspacePremium,
                                contentDescription = "Crown",
                                tint = RoyalGold,
                                modifier = Modifier.size(16.dp)
                            )
                        }
                        Spacer(modifier = Modifier.width(8.dp))
                        Column {
                            Text(
                                text = "Kunwar AI Matchmaker",
                                color = InkBrown,
                                fontSize = 15.sp,
                                fontWeight = FontWeight.Bold,
                                fontFamily = FontFamily.Serif
                            )
                            Text(
                                text = "Royal Matchmaker Desk • Online",
                                color = Color(0xFF059669),
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Medium
                            )
                        }
                    }

                    Icon(
                        imageVector = Icons.Default.Close,
                        contentDescription = "Close",
                        tint = Color.Gray,
                        modifier = Modifier
                            .size(22.dp)
                            .clickable(onClick = onDismiss)
                    )
                }

                // Chat Messages List
                LazyColumn(
                    modifier = Modifier
                        .weight(1f)
                        .padding(horizontal = 14.dp, vertical = 8.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(messages) { msg ->
                        Column(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalAlignment = if (msg.isUser) Alignment.End else Alignment.Start
                        ) {
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(16.dp))
                                    .background(
                                        if (msg.isUser) Brush.horizontalGradient(listOf(AppPrimary, AppSecondary))
                                        else Brush.linearGradient(listOf(Color.White, Color.White))
                                    )
                                    .border(1.dp, if (msg.isUser) Color.Transparent else Color(0xFFE5E7EB), RoundedCornerShape(16.dp))
                                    .padding(horizontal = 14.dp, vertical = 10.dp)
                            ) {
                                Text(
                                    text = msg.text,
                                    color = if (msg.isUser) Color.White else InkBrown,
                                    fontSize = 13.sp
                                )
                            }

                            // Inline recommendation cards
                            if (msg.recommendations.isNotEmpty()) {
                                Spacer(modifier = Modifier.height(8.dp))
                                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                    msg.recommendations.forEach { item ->
                                        Row(
                                            modifier = Modifier
                                                .fillMaxWidth()
                                                .clip(RoundedCornerShape(14.dp))
                                                .background(Color.White)
                                                .border(1.dp, RoyalGold.copy(alpha = 0.35f), RoundedCornerShape(14.dp))
                                                .clickable {
                                                    onDismiss()
                                                    onOpenProfile(item.profile)
                                                }
                                                .padding(10.dp),
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            AvatarImageView(
                                                source = item.profile.img,
                                                name = item.profile.name,
                                                clan = item.profile.clan,
                                                contentDescription = item.profile.name,
                                                contentScale = ContentScale.Crop,
                                                fallbackFontSize = 18.sp,
                                                modifier = Modifier
                                                    .size(50.dp)
                                                    .clip(CircleShape)
                                                    .border(1.2.dp, RoyalGold, CircleShape)
                                            )
                                            Spacer(modifier = Modifier.width(10.dp))
                                            Column(modifier = Modifier.weight(1f)) {
                                                Row(
                                                    modifier = Modifier.fillMaxWidth(),
                                                    horizontalArrangement = Arrangement.SpaceBetween,
                                                    verticalAlignment = Alignment.CenterVertically
                                                ) {
                                                    Text(
                                                        text = "${item.profile.name}, ${item.profile.age}",
                                                        color = InkBrown,
                                                        fontSize = 14.sp,
                                                        fontWeight = FontWeight.Bold
                                                    )
                                                    Box(
                                                        modifier = Modifier
                                                            .clip(CircleShape)
                                                            .background(RoyalGold)
                                                            .padding(horizontal = 7.dp, vertical = 2.dp)
                                                    ) {
                                                        Text(
                                                            text = "${item.matchScore}%",
                                                            color = Color.White,
                                                            fontSize = 10.sp,
                                                            fontWeight = FontWeight.Bold
                                                        )
                                                    }
                                                }
                                                Text(
                                                    text = "${item.profile.clan} • ${item.profile.gotra}",
                                                    color = Color.Gray,
                                                    fontSize = 11.sp
                                                )
                                                if (item.reasons.isNotEmpty()) {
                                                    Text(
                                                        text = item.reasons.first(),
                                                        color = AppPrimary,
                                                        fontSize = 10.sp,
                                                        fontWeight = FontWeight.SemiBold,
                                                        maxLines = 1,
                                                        overflow = TextOverflow.Ellipsis
                                                    )
                                                }
                                            }
                                        }
                                    }

                                    // Button to apply to discover feed
                                    Button(
                                        onClick = {
                                            onApplyQueryToDeck(msg.text, "AI Recommendations")
                                            onDismiss()
                                        },
                                        colors = ButtonDefaults.buttonColors(containerColor = Color.Transparent),
                                        contentPadding = PaddingValues(),
                                        shape = RoundedCornerShape(20.dp),
                                        modifier = Modifier.fillMaxWidth()
                                    ) {
                                        Box(
                                            contentAlignment = Alignment.Center,
                                            modifier = Modifier
                                                .fillMaxWidth()
                                                .background(
                                                    Brush.horizontalGradient(listOf(RoyalGold, Color(0xFFB8860B))),
                                                    shape = RoundedCornerShape(20.dp)
                                                )
                                                .padding(vertical = 10.dp)
                                        ) {
                                            Text(
                                                text = "Apply Matches to Discover Deck",
                                                color = Color.White,
                                                fontSize = 13.sp,
                                                fontWeight = FontWeight.Bold
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }

                    if (isAnalyzing) {
                        item {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                modifier = Modifier.padding(vertical = 4.dp)
                            ) {
                                CircularProgressIndicator(
                                    color = RoyalGold,
                                    modifier = Modifier.size(16.dp),
                                    strokeWidth = 2.dp
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(
                                    text = "Kunwar AI analyzing lineage & gotra...",
                                    color = RoyalGold,
                                    fontSize = 12.sp
                                )
                            }
                        }
                    }
                }

                // Quick Prompt Chips
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(Color.White)
                        .horizontalScroll(rememberScrollState())
                        .padding(horizontal = 14.dp, vertical = 6.dp),
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    QuickChatButton("👑 Show My Type of Match") { handleSend("show my type of match") }
                    QuickChatButton("🏰 Rathore Brides (23-27)") { handleSend("Rathore clan brides aged 23 to 27") }
                    QuickChatButton("👨‍⚕️ Doctors & Engineers") { handleSend("Doctors and Engineers") }
                    QuickChatButton("📜 Gotra Rules") { handleSend("what are gotra rules") }
                    QuickChatButton("📞 Connect to Agent") { handleSend("talk to human agent") }
                }

                // Message Input Row
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(Color.White)
                        .padding(horizontal = 14.dp, vertical = 8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .clip(RoundedCornerShape(22.dp))
                            .background(Color(0xFFF3F4F6))
                            .padding(horizontal = 14.dp, vertical = 10.dp)
                    ) {
                        BasicTextField(
                            value = inputMessage,
                            onValueChange = { inputMessage = it },
                            singleLine = true,
                            textStyle = androidx.compose.ui.text.TextStyle(
                                color = InkBrown,
                                fontSize = 13.5.sp
                            ),
                            modifier = Modifier.fillMaxWidth(),
                            decorationBox = { innerTextField ->
                                if (inputMessage.isEmpty()) {
                                    Text(
                                        text = "Ask Kunwar AI (e.g. Rathore bride in Jaipur)...",
                                        color = Color.Gray,
                                        fontSize = 13.5.sp
                                    )
                                }
                                innerTextField()
                            }
                        )
                    }

                    Spacer(modifier = Modifier.width(8.dp))

                    Box(
                        contentAlignment = Alignment.Center,
                        modifier = Modifier
                            .size(38.dp)
                            .clip(CircleShape)
                            .background(if (inputMessage.isNotBlank()) AppPrimary else Color(0xFFE5E7EB))
                            .clickable(enabled = inputMessage.isNotBlank()) { handleSend(inputMessage) }
                    ) {
                        Icon(
                            imageVector = Icons.Default.Send,
                            contentDescription = "Send",
                            tint = Color.White,
                            modifier = Modifier.size(18.dp)
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun QuickChatButton(text: String, onClick: () -> Unit) {
    Box(
        modifier = Modifier
            .clip(CircleShape)
            .background(AppPrimary.copy(alpha = 0.08f))
            .border(1.dp, AppPrimary.copy(alpha = 0.2f), CircleShape)
            .clickable(onClick = onClick)
            .padding(horizontal = 11.dp, vertical = 5.dp)
    ) {
        Text(
            text = text,
            color = AppPrimary,
            fontSize = 11.5.sp,
            fontWeight = FontWeight.SemiBold
        )
    }
}

