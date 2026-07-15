package com.sagaisambaandh.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.VerifiedUser
import androidx.compose.material.icons.filled.VolumeUp
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
import com.sagaisambaandh.ui.components.PalaceDivider
import com.sagaisambaandh.ui.components.ProfileCard
import com.sagaisambaandh.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeView(
    session: SagaiSessionManager,
    onNavigateToTab: (Int) -> Unit,
    onNavigateToRegister: () -> Unit,
    onProfileDetailSelect: (Profile) -> Unit,
    modifier: Modifier = Modifier
) {
    var lookingFor by remember { mutableStateOf("Bride") }
    var selectedClan by remember { mutableStateOf("All Clans") }
    var searchExpanded by remember { mutableStateOf(false) }

    val clansOptions = listOf("All Clans", "Rathore", "Sisodia", "Chauhan", "Kachwaha", "Bhati", "Shekhawat")

    val filteredProfiles = session.profiles.value.filter { profile ->
        val matchGender = profile.gender == if (lookingFor == "Bride") "Bride" else "Groom"
        val matchClan = selectedClan == "All Clans" || profile.clan == selectedClan
        matchGender && matchClan
    }

    Column(
        modifier = modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .background(SandstoneIvory.copy(alpha = 0.15f))
    ) {
        // Hero Banner with Palace Skyline
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(
                    Brush.verticalGradient(
                        colors = listOf(JodhpurIndigo, Color(0xFF101830))
                    )
                )
                .padding(bottom = 20.dp),
            contentAlignment = Alignment.BottomCenter
        ) {
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 40.dp, bottom = 48.dp, start = 20.dp, end = 20.dp)
            ) {
                Text(
                    text = "A UNION OF RAJPUT LINEAGE & LEGACY",
                    color = LightGold,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 3.sp
                )
                Spacer(modifier = Modifier.height(12.dp))
                Text(
                    text = "Where Lineage\nMeets Sacred Legacy",
                    color = SandstoneIvory,
                    fontSize = 28.sp,
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.Serif,
                    textAlign = TextAlign.Center,
                    lineHeight = 36.sp
                )
                Spacer(modifier = Modifier.height(12.dp))
                Text(
                    text = "Welcome to the most premium, secure, and dedicated matchmaking portal for the noble Rajput community.",
                    color = SandstoneIvory.copy(alpha = 0.8f),
                    fontSize = 13.sp,
                    textAlign = TextAlign.Center,
                    lineHeight = 18.sp,
                    modifier = Modifier.padding(horizontal = 20.dp)
                )
            }

            PalaceDivider(
                fillColor = SandstoneIvory,
                modifier = Modifier.fillMaxWidth()
            )
        }

        // Search Widget
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp)
                .offset(y = (-30).dp),
            shape = RoundedCornerShape(12.dp),
            colors = CardDefaults.cardColors(containerColor = CardBackground),
            elevation = CardDefaults.cardElevation(defaultElevation = 6.dp)
        ) {
            Column(
                modifier = Modifier.padding(20.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    text = "FIND YOUR NOBLE MATCH",
                    color = RoyalMaroon,
                    fontWeight = FontWeight.Bold,
                    fontSize = 12.sp,
                    letterSpacing = 1.5.sp
                )
                Spacer(modifier = Modifier.height(15.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    // Looking For Picker
                    Column(modifier = Modifier.weight(1f)) {
                        Text(text = "LOOKING FOR", fontSize = 8.sp, color = Color.Gray, fontWeight = FontWeight.Bold)
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier
                                .clickable {
                                    lookingFor = if (lookingFor == "Bride") "Groom" else "Bride"
                                }
                                .padding(vertical = 8.dp)
                        ) {
                            Text(
                                text = if (lookingFor == "Bride") "Bride (Ladi)" else "Groom (Lada)",
                                color = InkBrown,
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Medium
                            )
                        }
                    }

                    Spacer(modifier = Modifier.width(16.dp))

                    // Clan dropdown
                    Column(modifier = Modifier.weight(1f)) {
                        Text(text = "RAJPUT CLAN", fontSize = 8.sp, color = Color.Gray, fontWeight = FontWeight.Bold)
                        Box {
                            Text(
                                text = selectedClan,
                                color = InkBrown,
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Medium,
                                modifier = Modifier
                                    .clickable { searchExpanded = true }
                                    .padding(vertical = 8.dp)
                            )
                            DropdownMenu(
                                expanded = searchExpanded,
                                onDismissRequest = { searchExpanded = false }
                            ) {
                                clansOptions.forEach { clan ->
                                    DropdownMenuItem(
                                        text = { Text(clan) },
                                        onClick = {
                                            selectedClan = clan
                                            searchExpanded = false
                                        }
                                    )
                                }
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(15.dp))

                // Search CTA Button
                Button(
                    onClick = {
                        if (session.currentUser.value == null) {
                            onNavigateToTab(3) // Direct to login tab
                        } else {
                            onNavigateToTab(3) // Already logged in, direct to dashboard grid
                        }
                    },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(8.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = RoyalGold)
                ) {
                    Text(
                        text = if (session.currentUser.value == null) "Log In to Search" else "Search Matches",
                        color = RoyalMaroon,
                        fontWeight = FontWeight.Bold,
                        fontSize = 14.sp
                    )
                }
            }
        }

        // Featured profiles showcase
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 24.dp)
        ) {
            Text(
                text = "Featured Rajput Lineages",
                color = RoyalMaroon,
                fontSize = 20.sp,
                fontWeight = FontWeight.Bold,
                fontFamily = FontFamily.Serif,
                modifier = Modifier.padding(horizontal = 20.dp)
            )
            Text(
                text = "Verified brides and grooms recently active",
                color = Color.Gray,
                fontSize = 12.sp,
                modifier = Modifier.padding(horizontal = 20.dp, vertical = 2.dp)
            )

            Spacer(modifier = Modifier.height(12.dp))

            if (filteredProfiles.isEmpty()) {
                Text(
                    text = "No noble profiles match your search criteria currently.",
                    color = Color.Gray,
                    fontStyle = FontStyle.Italic,
                    fontSize = 13.sp,
                    textAlign = TextAlign.Center,
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 30.dp)
                )
            } else {
                LazyRow(
                    contentPadding = PaddingValues(horizontal = 20.dp),
                    horizontalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    items(filteredProfiles) { profile ->
                        val lockedState = session.currentUser.value == null
                        ProfileCard(
                            profile = profile,
                            isLocked = lockedState,
                            onUnlockTap = onNavigateToRegister,
                            onDetailTap = {
                                if (lockedState) {
                                    onNavigateToRegister()
                                } else {
                                    onProfileDetailSelect(profile)
                                }
                            },
                            modifier = Modifier.width(280.dp)
                        )
                    }
                }
            }
        }

        // Promise Banner
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .background(RoyalGold.copy(alpha = 0.05f))
                .padding(20.dp)
        ) {
            Text(
                text = "The Sagai Sambaandh Promise",
                color = RoyalMaroon,
                fontSize = 20.sp,
                fontWeight = FontWeight.Bold,
                fontFamily = FontFamily.Serif
            )
            Spacer(modifier = Modifier.height(16.dp))
            PromiseRow(icon = Icons.Default.VerifiedUser, title = "100% Rajput Lineage Audit", desc = "No general castes. Every profile undergoes gotra, kul, and thikana validation.")
            Spacer(modifier = Modifier.height(12.dp))
            PromiseRow(icon = Icons.Default.Lock, title = "Locked Photo Privacy", desc = "Your photograph is blurred to guests. Unlocks only to mutual interest.")
            Spacer(modifier = Modifier.height(12.dp))
            PromiseRow(icon = Icons.Default.Info, title = "Direct Family Connection", desc = "Enable direct dialogues between noble families with zero mediator interference.")
        }
    }
}

@Composable
fun PromiseRow(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    title: String,
    desc: String
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.Top
    ) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            tint = RoyalGold,
            modifier = Modifier.size(24.dp)
        )
        Spacer(modifier = Modifier.width(16.dp))
        Column {
            Text(
                text = title,
                color = InkBrown,
                fontWeight = FontWeight.Bold,
                fontSize = 14.sp
            )
            Spacer(modifier = Modifier.height(2.dp))
            Text(
                text = desc,
                color = Color.Gray,
                fontSize = 12.sp,
                lineHeight = 16.sp
            )
        }
    }
}
