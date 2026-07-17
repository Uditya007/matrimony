package com.sagaisambaandh.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Favorite
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
import com.sagaisambaandh.data.Profile
import com.sagaisambaandh.data.SagaiSessionManager
import com.sagaisambaandh.ui.components.ProfileCard
import com.sagaisambaandh.ui.theme.*

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

    val user = session.currentUser.value
    val filteredMatches = remember(profiles, activeFilterTab, user) {
        if (activeFilterTab == 1 && user != null) {
            // Filter out profiles sharing the user's Gotra
            profiles.filter {
                it.gotra.lowercase() != user.gotra.lowercase()
            }
        } else {
            profiles
        }
    }

    Column(
        modifier = modifier
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

        // Sub Tabs
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

        // Scrollable matches list
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
                        // Profile picture/monogram container card
                        ProfileCard(
                            profile = match,
                            isLocked = user == null,
                            onUnlockTap = onNavigateToRegister,
                            onDetailTap = {
                                if (user != null) {
                                    onProfileDetailSelect(match)
                                } else {
                                    onNavigateToRegister()
                                }
                            },
                            modifier = Modifier.fillMaxWidth()
                        )

                        Spacer(modifier = Modifier.height(12.dp))

                        // Connect button styled like Shaadi Connect Button
                        Button(
                            onClick = {
                                if (user == null) {
                                    onNavigateToRegister()
                                } else {
                                    // Send connection request
                                }
                            },
                            shape = RoundedCornerShape(24.dp),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = Color(0xFF4CAF50), // Green connect button!
                                contentColor = Color.White
                            ),
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(46.dp)
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(
                                    imageVector = Icons.Default.CheckCircle,
                                    contentDescription = null,
                                    modifier = Modifier.size(18.dp)
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(
                                    text = "Connect Now",
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 14.sp
                                )
                            }
                        }
                    }
                }
            }
            Spacer(modifier = Modifier.height(40.dp))
        }
    }
}
