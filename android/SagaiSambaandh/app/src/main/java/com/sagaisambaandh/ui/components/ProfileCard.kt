package com.sagaisambaandh.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Verified
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.sagaisambaandh.data.Profile
import com.sagaisambaandh.ui.theme.*

@Composable
fun ProfileCard(
    profile: Profile,
    isLocked: Boolean,
    onUnlockTap: () -> Unit,
    onDetailTap: () -> Unit,
    modifier: Modifier = Modifier
) {
    val formattedName = if (isLocked) {
        val title = if (profile.gender == "Groom") "Kunwar" else "Bannisa"
        val firstInitial = profile.name.firstOrNull() ?: 'S'
        val clanInitial = profile.clan.firstOrNull() ?: 'R'
        "$title $firstInitial. $clanInitial."
    } else {
        profile.name
    }

    val clanGradient = when (profile.clan.lowercase()) {
        "rathore" -> Brush.linearGradient(listOf(Color(0xFFFF9933), Color(0xFFFF5500)))
        "sisodia" -> Brush.linearGradient(listOf(Color(0xFF990011), Color(0xFF5D000A)))
        "chauhan" -> Brush.linearGradient(listOf(RoyalGold, Color(0xFF8A6D0F)))
        "kachwaha" -> Brush.linearGradient(listOf(JodhpurIndigo, Color(0xFF0F1A36)))
        "bhati" -> Brush.linearGradient(listOf(LightGold, RoyalGold))
        else -> Brush.linearGradient(listOf(Color(0xFF124E3F), Color(0xFF0A3329)))
    }

    Card(
        modifier = modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = CardBackground),
        border = CardDefaults.outlinedCardBorder().copy(
            brush = Brush.linearGradient(listOf(RoyalGold.copy(alpha = 0.2f), RoyalGold.copy(alpha = 0.4f)))
        )
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            // Image / Frame container
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(240.dp)
                    .clip(JharokhaShape())
                    .jharokhaBorder(2.5f)
                    .background(clanGradient),
                contentAlignment = Alignment.Center
            ) {
                if (isLocked) {
                    // Blur/locked state overlay
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center,
                        modifier = Modifier
                            .fillMaxSize()
                            .background(Color.Black.copy(alpha = 0.3f))
                            .padding(16.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Lock,
                            contentDescription = "Locked",
                            tint = Color.White,
                            modifier = Modifier.size(36.dp)
                        )
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            text = "PHOTO LOCKED",
                            color = Color.White,
                            fontWeight = FontWeight.Bold,
                            fontSize = 11.sp,
                            letterSpacing = 2.sp
                        )
                        Spacer(modifier = Modifier.height(10.dp))
                        Button(
                            onClick = onUnlockTap,
                            colors = ButtonDefaults.buttonColors(containerColor = LightGold),
                            contentPadding = PaddingValues(horizontal = 14.dp, vertical = 6.dp),
                            modifier = Modifier.height(32.dp)
                        ) {
                            Text(
                                text = "Connect to Unlock",
                                color = RoyalMaroon,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                } else {
                    // Unlocked State Monogram Initial Avatar
                    Box(
                        contentAlignment = Alignment.Center,
                        modifier = Modifier.fillMaxSize()
                    ) {
                        Text(
                            text = profile.name.split(" ").map { it.firstOrNull() ?: "" }.joinToString(""),
                            color = SandstoneIvory,
                            fontSize = 44.sp,
                            fontWeight = FontWeight.Bold,
                            fontFamily = FontFamily.Serif
                        )
                    }

                    // Red Wax seal verification badge
                    if (profile.isVerified) {
                        Box(
                            modifier = Modifier
                                .fillMaxSize()
                                .padding(12.dp),
                            contentAlignment = Alignment.TopEnd
                        ) {
                            WaxSealBadge()
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Details metadata section
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = formattedName,
                    color = RoyalMaroon,
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.Serif,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                    modifier = Modifier.weight(1f)
                )
                Text(
                    text = "${profile.age} yrs",
                    color = InkBrown,
                    fontWeight = FontWeight.Bold,
                    fontSize = 14.sp
                )
            }

            Spacer(modifier = Modifier.height(6.dp))

            Row(verticalAlignment = Alignment.CenterVertically) {
                // Clan Badge Label
                Box(
                    modifier = Modifier
                        .background(RoyalGold.copy(alpha = 0.15f), shape = RoundedCornerShape(6.dp))
                        .padding(horizontal = 8.dp, vertical = 3.dp)
                ) {
                    Text(
                        text = profile.clan,
                        color = RoyalMaroon,
                        fontWeight = FontWeight.Bold,
                        fontSize = 9.sp
                    )
                }
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = profile.thikana,
                    color = Color.Gray,
                    fontSize = 12.sp,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }

            Spacer(modifier = Modifier.height(10.dp))
            Divider(color = RoyalGold.copy(alpha = 0.2f), thickness = 1.dp)
            Spacer(modifier = Modifier.height(10.dp))

            // Bottom parameters
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(text = "GOTRA", fontSize = 8.sp, color = Color.Gray, fontWeight = FontWeight.Bold)
                    Text(
                        text = if (isLocked) "Locked" else profile.gotra,
                        color = InkBrown,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.SemiBold
                    )
                }

                Column {
                    Text(text = "THIKANA", fontSize = 8.sp, color = Color.Gray, fontWeight = FontWeight.Bold)
                    Text(
                        text = profile.thikana.split(" ").firstOrNull() ?: profile.thikana,
                        color = InkBrown,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.SemiBold
                    )
                }

                IconButton(
                    onClick = onDetailTap,
                    modifier = Modifier.size(24.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.ChevronRight,
                        contentDescription = "Details",
                        tint = RoyalGold
                    )
                }
            }
        }
    }
}

@Composable
fun WaxSealBadge() {
    Box(
        contentAlignment = Alignment.Center,
        modifier = Modifier
            .size(32.dp)
            .background(RoyalMaroon, shape = CircleShape)
            .border(1.dp, LightGold.copy(alpha = 0.5f), CircleShape)
    ) {
        Icon(
            imageVector = Icons.Default.Verified,
            contentDescription = "Verified Lineage",
            tint = LightGold,
            modifier = Modifier.size(16.dp)
        )
    }
}
