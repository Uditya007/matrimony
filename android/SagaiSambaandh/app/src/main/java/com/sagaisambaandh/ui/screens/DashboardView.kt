package com.sagaisambaandh.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ExitToApp
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.sagaisambaandh.data.Profile
import com.sagaisambaandh.data.SagaiSessionManager
import com.sagaisambaandh.ui.components.ProfileCard
import com.sagaisambaandh.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DashboardView(
    session: SagaiSessionManager,
    onProfileDetailSelect: (Profile) -> Unit,
    modifier: Modifier = Modifier
) {
    var selectedClanFilter by remember { mutableStateOf("All") }
    var showLogoutDialog by remember { mutableStateOf(false) }

    val clanFilters = listOf("All", "Rathore", "Sisodia", "Chauhan", "Kachwaha", "Bhati", "Shekhawat")

    val user = session.currentUser.value
    val oppositeGender = if (user?.gender == "Groom") "Bride" else "Groom"

    val feedProfiles = session.profiles.value.filter { profile ->
        val matchGender = profile.gender == oppositeGender
        val matchClan = selectedClanFilter == "All" || profile.clan == selectedClanFilter
        matchGender && matchClan
    }

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(SandstoneIvory.copy(alpha = 0.15f))
    ) {
        // Welcome Header Banner
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .background(
                    Brush.verticalGradient(
                        colors = listOf(RoyalMaroon, DeepMaroon)
                    )
                )
                .padding(20.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "Khammaghani,",
                        color = SandstoneIvory.copy(alpha = 0.7f),
                        fontSize = 14.sp,
                        fontFamily = FontFamily.Serif
                    )
                    Text(
                        text = user?.name?.split(" ")?.firstOrNull() ?: "Kunwar",
                        color = SandstoneIvory,
                        fontSize = 24.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Serif
                    )
                }

                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Text(
                        text = "${user?.tier ?: "Starter"} Plan",
                        color = RoyalMaroon,
                        fontWeight = FontWeight.Bold,
                        fontSize = 8.sp,
                        modifier = Modifier
                            .background(LightGold, shape = RoundedCornerShape(10.dp))
                            .padding(horizontal = 8.dp, vertical = 3.dp)
                    )

                    IconButton(
                        onClick = { showLogoutDialog = true },
                        modifier = Modifier
                            .size(36.dp)
                            .background(Color.Red.copy(alpha = 0.2f), shape = CircleShape)
                    ) {
                        Icon(
                            imageVector = Icons.Default.ExitToApp,
                            contentDescription = "Log Out",
                            tint = Color.White,
                            modifier = Modifier.size(20.dp)
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(10.dp))
            Text(
                text = "Noble Rajput lineage dashboard matches suited for your gotra compatibility.",
                color = SandstoneIvory.copy(alpha = 0.8f),
                fontSize = 12.sp,
                lineHeight = 16.sp
            )
        }

        // Filters list
        LazyRow(
            contentPadding = PaddingValues(horizontal = 20.dp, vertical = 12.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            modifier = Modifier.background(CardBackground)
        ) {
            items(clanFilters) { filter ->
                val isSelected = selectedClanFilter == filter
                Box(
                    contentAlignment = Alignment.Center,
                    modifier = Modifier
                        .clickable { selectedClanFilter = filter }
                        .background(
                            if (isSelected) RoyalMaroon else RoyalGold.copy(alpha = 0.12f),
                            shape = RoundedCornerShape(16.dp)
                        )
                        .border(
                            1.dp,
                            RoyalGold.copy(alpha = 0.4f),
                            shape = RoundedCornerShape(16.dp)
                        )
                        .padding(horizontal = 14.dp, vertical = 8.dp)
                ) {
                    Text(
                        text = filter,
                        color = if (isSelected) Color.White else RoyalMaroon,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }

        // Matches list
        if (feedProfiles.isEmpty()) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(20.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center
            ) {
                Text(
                    text = "No matches match this clan filter currently.",
                    color = Color.Gray,
                    textAlign = TextAlign.Center,
                    fontStyle = androidx.compose.ui.text.font.FontStyle.Italic,
                    fontSize = 14.sp
                )
            }
        } else {
            LazyColumn(
                contentPadding = PaddingValues(horizontal = 20.dp, vertical = 10.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
                modifier = Modifier.fillMaxSize()
            ) {
                items(feedProfiles) { profile ->
                    ProfileCard(
                        profile = profile,
                        isLocked = false, // Feed matches are unlocked for logged-in users
                        onUnlockTap = {},
                        onDetailTap = {
                            onProfileDetailSelect(profile)
                        }
                    )
                }
            }
        }

        // Logout alert
        if (showLogoutDialog) {
            AlertDialog(
                onDismissRequest = { showLogoutDialog = false },
                title = { Text(text = "Log Out", fontFamily = FontFamily.Serif, fontWeight = FontWeight.Bold) },
                text = { Text(text = "Are you sure you want to exit your sanctuary account?") },
                confirmButton = {
                    TextButton(
                        onClick = {
                            showLogoutDialog = false
                            session.logout()
                        }
                    ) {
                        Text(text = "Log Out", color = Color.Red, fontWeight = FontWeight.Bold)
                    }
                },
                dismissButton = {
                    TextButton(onClick = { showLogoutDialog = false }) {
                        Text(text = "Cancel", color = Color.Gray)
                    }
                },
                containerColor = CardBackground
            )
        }
    }
}
