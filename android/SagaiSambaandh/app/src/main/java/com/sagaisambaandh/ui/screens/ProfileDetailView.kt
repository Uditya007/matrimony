package com.sagaisambaandh.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Email
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Phone
import androidx.compose.material.icons.filled.Verified
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.sagaisambaandh.data.Profile
import com.sagaisambaandh.data.SagaiSessionManager
import com.sagaisambaandh.ui.components.JharokhaBorder
import com.sagaisambaandh.ui.components.JharokhaShape
import com.sagaisambaandh.ui.components.jharokhaBorder
import com.sagaisambaandh.ui.theme.*
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

@Composable
fun ProfileDetailView(
    profile: Profile,
    session: SagaiSessionManager,
    onDismiss: () -> Unit,
    modifier: Modifier = Modifier
) {
    val coroutineScope = rememberCoroutineScope()
    var isUnlockedState by remember { mutableStateOf(session.isUnlocked(profile.id)) }
    var showingUnlockProgress by remember { mutableStateOf(false) }

    val hasDirectAccess = session.currentUser.value?.let { user ->
        user.tier == "Gold" || user.tier == "Silver"
    } ?: false

    val clanGradient = when (profile.clan.lowercase()) {
        "rathore" -> Brush.linearGradient(listOf(Color(0xFFFF9933), Color(0xFFFF5500)))
        "sisodia" -> Brush.linearGradient(listOf(Color(0xFF990011), Color(0xFF5D000A)))
        "chauhan" -> Brush.linearGradient(listOf(RoyalGold, Color(0xFF8A6D0F)))
        "kachwaha" -> Brush.linearGradient(listOf(JodhpurIndigo, Color(0xFF0F1A36)))
        "bhati" -> Brush.linearGradient(listOf(LightGold, RoyalGold))
        else -> Brush.linearGradient(listOf(Color(0xFF124E3F), Color(0xFF0A3329)))
    }

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(SandstoneIvory)
    ) {
        // Top bar details
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .background(CardBackground)
                .padding(horizontal = 16.dp, vertical = 12.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            TextButton(onClick = onDismiss) {
                Text(text = "Close", color = Color.Gray, fontWeight = FontWeight.Bold)
            }
            Text(
                text = "Lineage Details",
                color = RoyalMaroon,
                fontSize = 16.sp,
                fontWeight = FontWeight.Bold,
                fontFamily = FontFamily.Serif
            )
            // Spacer
            Box(modifier = Modifier.size(48.dp))
        }

        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(20.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Profile photo frame Jharokha
            Box(
                contentAlignment = Alignment.Center,
                modifier = Modifier
                    .width(180.dp)
                    .height(220.dp)
                    .clip(JharokhaShape())
                    .jharokhaBorder(3f)
                    .background(clanGradient)
            ) {
                Text(
                    text = profile.name.split(" ").map { it.firstOrNull() ?: "" }.joinToString(""),
                    color = SandstoneIvory,
                    fontSize = 36.sp,
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.Serif
                )
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Name
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    text = profile.name,
                    color = RoyalMaroon,
                    fontSize = 24.sp,
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.Serif
                )
                if (profile.isVerified) {
                    Spacer(modifier = Modifier.width(6.dp))
                    Icon(
                        imageVector = Icons.Default.Verified,
                        contentDescription = null,
                        tint = RoyalGold,
                        modifier = Modifier.size(20.dp)
                    )
                }
            }
            Text(
                text = "${profile.age} yrs • ${profile.height} • ${profile.location}",
                color = Color.Gray,
                fontSize = 13.sp,
                modifier = Modifier.padding(top = 4.dp)
            )

            Spacer(modifier = Modifier.height(20.dp))

            // Heritage gotra detail card
            Card(
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = CardBackground),
                border = CardDefaults.outlinedCardBorder().copy(
                    brush = Brush.linearGradient(listOf(RoyalGold.copy(alpha = 0.2f), RoyalGold.copy(alpha = 0.2f)))
                ),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(20.dp)) {
                    Text(
                        text = "HERITAGE & LINEAGE",
                        fontSize = 10.sp,
                        color = Color.Gray,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 1.5.sp
                    )
                    Spacer(modifier = Modifier.height(12.dp))

                    Row(modifier = Modifier.fillMaxWidth()) {
                        LineageItem(label = "Rajput Clan", value = profile.clan, modifier = Modifier.weight(1f))
                        LineageItem(label = "Gotra", value = profile.gotra, modifier = Modifier.weight(1f))
                    }
                    Spacer(modifier = Modifier.height(12.dp))
                    Row(modifier = Modifier.fillMaxWidth()) {
                        LineageItem(label = "Kul / Vansha", value = profile.kul, modifier = Modifier.weight(1f))
                        LineageItem(label = "Thikana (Estate)", value = profile.thikana, modifier = Modifier.weight(1f))
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Profession card
            Card(
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = CardBackground),
                border = CardDefaults.outlinedCardBorder().copy(
                    brush = Brush.linearGradient(listOf(RoyalGold.copy(alpha = 0.2f), RoyalGold.copy(alpha = 0.2f)))
                ),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(20.dp)) {
                    Text(
                        text = "PROFESSION & EDUCATION",
                        fontSize = 10.sp,
                        color = Color.Gray,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 1.5.sp
                    )
                    Spacer(modifier = Modifier.height(12.dp))

                    InfoText(label = "Occupation", value = profile.occupation)
                    Spacer(modifier = Modifier.height(10.dp))
                    InfoText(label = "Education", value = profile.education)
                    Spacer(modifier = Modifier.height(10.dp))
                    InfoText(label = "Income Tier", value = profile.income)
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Contact unlock box
            Card(
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = CardBackground),
                border = CardDefaults.outlinedCardBorder().copy(
                    brush = Brush.linearGradient(listOf(RoyalGold.copy(alpha = 0.2f), RoyalGold.copy(alpha = 0.2f)))
                ),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(20.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Default.Phone,
                            contentDescription = null,
                            tint = RoyalGold,
                            modifier = Modifier.size(24.dp)
                        )
                        Spacer(modifier = Modifier.width(12.dp))
                        Text(
                            text = "Direct Contact Details",
                            color = RoyalMaroon,
                            fontWeight = FontWeight.Bold,
                            fontSize = 13.sp
                        )
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    if (isUnlockedState) {
                        Column(
                            verticalArrangement = Arrangement.spacedBy(8.dp),
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(Color.Green.copy(alpha = 0.05f), shape = RoundedCornerShape(8.dp))
                                .border(1.dp, Color.Green.copy(alpha = 0.15f), RoundedCornerShape(8.dp))
                                .padding(12.dp)
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(imageVector = Icons.Default.Phone, contentDescription = null, tint = RoyalMaroon, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(text = "+91 91168 54321", color = InkBrown, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                            }
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(imageVector = Icons.Default.Email, contentDescription = null, tint = RoyalMaroon, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(
                                    text = "${profile.name.lowercase().replace(" ", ".")}@sagaisambaandh-member.com",
                                    color = InkBrown,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 13.sp
                                )
                            }
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(imageVector = Icons.Default.LocationOn, contentDescription = null, tint = RoyalMaroon, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(text = profile.location, color = InkBrown, fontSize = 13.sp)
                            }
                        }
                    } else {
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(RoyalGold.copy(alpha = 0.04f), shape = RoundedCornerShape(8.dp))
                                .padding(12.dp)
                        ) {
                            Text(
                                text = "Lineage contact details are secured. Upgrade to direct communication.",
                                color = Color.Gray,
                                fontSize = 12.sp,
                                modifier = Modifier.padding(bottom = 10.dp)
                            )

                            if (showingUnlockProgress) {
                                CircularProgressIndicator(color = RoyalMaroon, modifier = Modifier.size(24.dp))
                            } else {
                                Button(
                                    onClick = {
                                        if (hasDirectAccess) {
                                            showingUnlockProgress = true
                                            coroutineScope.launch {
                                                delay(1200)
                                                showingUnlockProgress = false
                                                isUnlockedState = true
                                                session.unlockProfile(profile.id)
                                            }
                                        } else {
                                            onDismiss()
                                        }
                                    },
                                    shape = RoundedCornerShape(8.dp),
                                    colors = ButtonDefaults.buttonColors(
                                        containerColor = if (hasDirectAccess) LightGold else RoyalMaroon,
                                        contentColor = if (hasDirectAccess) RoyalMaroon else Color.White
                                    )
                                ) {
                                    Text(
                                        text = if (hasDirectAccess) "Unlock Profile Card" else "Upgrade to Unlock Contact",
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 12.sp
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
fun LineageItem(
    label: String,
    value: String,
    modifier: Modifier = Modifier
) {
    Column(modifier = modifier) {
        Text(text = label.uppercase(), fontSize = 8.sp, color = Color.Gray, fontWeight = FontWeight.Bold)
        Text(
            text = value,
            color = InkBrown,
            fontSize = 14.sp,
            fontWeight = FontWeight.SemiBold
        )
    }
}

@Composable
fun InfoText(
    label: String,
    value: String
) {
    Column {
        Text(text = label, fontSize = 11.sp, color = Color.Gray, fontWeight = FontWeight.Bold)
        Text(
            text = value,
            color = InkBrown,
            fontSize = 13.sp,
            modifier = Modifier.padding(top = 2.dp)
        )
    }
}
