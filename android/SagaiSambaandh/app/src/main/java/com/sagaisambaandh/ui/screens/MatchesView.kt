package com.sagaisambaandh.ui.screens

import androidx.compose.animation.*
import androidx.compose.foundation.*
import androidx.compose.foundation.gestures.Orientation
import androidx.compose.foundation.gestures.draggable
import androidx.compose.foundation.gestures.rememberDraggableState
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
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
import com.sagaisambaandh.ui.components.RoyalBackground
import com.sagaisambaandh.ui.theme.*
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

    val user = session.currentUser.value
    val isProfileLocked = user == null

    val filteredMatches = remember(profiles, activeFilterTab, user, searchGender, searchClan) {
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

                // Filter Capsule Pills Bar
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .horizontalScroll(rememberScrollState())
                        .padding(horizontal = 20.dp, vertical = 6.dp),
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
                    if (!profile.img.isNullOrEmpty()) {
                        val imageUrl = if (profile.img.startsWith("http")) {
                            profile.img
                        } else {
                            "https://shreerajputsagaisambandh.com/images/${profile.img}.png"
                        }
                        AsyncImage(
                            model = imageUrl,
                            contentDescription = "Candidate Photo",
                            contentScale = ContentScale.Crop,
                            modifier = Modifier.fillMaxSize()
                        )
                    } else {
                        Box(
                            contentAlignment = Alignment.Center,
                            modifier = Modifier
                                .fillMaxSize()
                                .background(DeepMaroon)
                        ) {
                            Text(
                                text = profile.name.take(1),
                                color = LightGold,
                                fontSize = 72.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
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
        if (!isLocked && !profile.img.isNullOrEmpty()) {
            val imageUrl = if (profile.img.startsWith("http")) profile.img else "https://shreerajputsagaisambandh.com/images/${profile.img}.png"
            AsyncImage(
                model = imageUrl,
                contentDescription = profile.name,
                contentScale = ContentScale.Crop,
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
