package com.sagaisambaandh.ui.screens

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.WorkspacePremium
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.sagaisambaandh.data.SagaiSessionManager
import com.sagaisambaandh.data.User
import com.sagaisambaandh.ui.components.RoyalBackground
import com.sagaisambaandh.ui.theme.*

@Composable
fun PlansView(
    session: SagaiSessionManager,
    onNotificationsTap: () -> Unit = {},
    modifier: Modifier = Modifier
) {
    var billingCycle by remember { mutableStateOf(0) } // 0 = Monthly, 1 = Annual (20% off)
    var showDialog by remember { mutableStateOf(false) }
    var dialogMessage by remember { mutableStateOf("") }

    val starterPrice = if (billingCycle == 0) 4999 else 3999
    val silverPrice = if (billingCycle == 0) 11999 else 9599
    val goldPrice = if (billingCycle == 0) 24999 else 19999

    val notifications = session.notificationsList.value

    RoyalBackground(modifier = modifier) {
        Column(modifier = Modifier.fillMaxSize()) {
            // Top Custom Header Bar (Matches Discover & Messages)
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
                        contentDescription = "Premium Crown",
                        tint = RoyalGold,
                        modifier = Modifier.size(20.dp)
                    )
                }

                Text(
                    text = "Premium",
                    color = Color.White,
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.Serif
                )

                // Notifications Bell
                Box(contentAlignment = Alignment.TopEnd) {
                    Box(
                        contentAlignment = Alignment.Center,
                        modifier = Modifier
                            .size(40.dp)
                            .background(Color.White.copy(alpha = 0.18f), shape = CircleShape)
                            .clickable(onClick = onNotificationsTap)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Notifications,
                            contentDescription = "Notifications",
                            tint = Color.White,
                            modifier = Modifier.size(18.dp)
                        )
                    }

                    if (notifications.isNotEmpty()) {
                        Box(
                            modifier = Modifier
                                .offset(x = (-2).dp, y = 2.dp)
                                .size(9.dp)
                                .background(LightGold, shape = CircleShape)
                        )
                    }
                }
            }

            // Scrollable Content
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .verticalScroll(rememberScrollState())
                    .padding(bottom = 32.dp)
            ) {
                // Header block
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 20.dp, vertical = 12.dp)
                ) {
                    Text(
                        text = "Regal Memberships",
                        color = Color.White,
                        fontSize = 26.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Serif
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        text = "Select a Rajputana subscription tier to unlock premium features and direct family contact lines.",
                        color = Color.White.copy(alpha = 0.85f),
                        fontSize = 13.sp,
                        lineHeight = 18.sp
                    )
                }

                // Custom Royal Billing Cycle Segment Switcher
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 20.dp, vertical = 4.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    // Monthly Switcher Button
                    Box(
                        contentAlignment = Alignment.Center,
                        modifier = Modifier
                            .weight(1f)
                            .clip(CircleShape)
                            .background(if (billingCycle == 0) LightGold else Color.White.copy(alpha = 0.18f))
                            .border(
                                1.dp,
                                if (billingCycle == 0) Color.Transparent else Color.White.copy(alpha = 0.25f),
                                CircleShape
                            )
                            .clickable { billingCycle = 0 }
                            .padding(vertical = 10.dp)
                    ) {
                        Text(
                            text = "Monthly",
                            color = if (billingCycle == 0) RoyalMaroon else Color.White,
                            fontSize = 13.sp,
                            fontWeight = if (billingCycle == 0) FontWeight.Bold else FontWeight.Medium
                        )
                    }

                    // Annual Switcher Button
                    Box(
                        contentAlignment = Alignment.Center,
                        modifier = Modifier
                            .weight(1f)
                            .clip(CircleShape)
                            .background(if (billingCycle == 1) LightGold else Color.White.copy(alpha = 0.18f))
                            .border(
                                1.dp,
                                if (billingCycle == 1) Color.Transparent else Color.White.copy(alpha = 0.25f),
                                CircleShape
                            )
                            .clickable { billingCycle = 1 }
                            .padding(vertical = 10.dp)
                    ) {
                        Text(
                            text = "Annual (Save 20%)",
                            color = if (billingCycle == 1) RoyalMaroon else Color.White,
                            fontSize = 13.sp,
                            fontWeight = if (billingCycle == 1) FontWeight.Bold else FontWeight.Medium
                        )
                    }
                }

                Spacer(modifier = Modifier.height(18.dp))

                // Plans List
                Column(
                    modifier = Modifier.padding(horizontal = 20.dp),
                    verticalArrangement = Arrangement.spacedBy(24.dp)
                ) {
                    // Plan 1: Starter
                    PlanCard(
                        title = "Starter",
                        price = starterPrice,
                        cycle = if (billingCycle == 0) "month" else "month (billed annually)",
                        features = listOf(
                            "View complete Rajput profiles",
                            "Send 10 express interests / month",
                            "Astrology & Kundli matches overview"
                        ),
                        buttonText = "Select Starter",
                        isFeatured = false,
                        onSelect = {
                            subscribe(session, "Starter") { msg ->
                                dialogMessage = msg
                                showDialog = true
                            }
                        }
                    )

                    // Plan 2: Rajputana Silver (Featured)
                    PlanCard(
                        title = "Rajputana Silver",
                        price = silverPrice,
                        cycle = if (billingCycle == 0) "month" else "month (billed annually)",
                        features = listOf(
                            "Unlock 15 contact phone numbers",
                            "Astrology compatibility matching reports",
                            "Express interests: Unlimited",
                            "Highlight profile in search lists"
                        ),
                        buttonText = "Choose Silver",
                        isFeatured = true,
                        onSelect = {
                            subscribe(session, "Silver") { msg ->
                                dialogMessage = msg
                                showDialog = true
                            }
                        }
                    )

                    // Plan 3: Rajputana Gold (Elite)
                    PlanCard(
                        title = "Rajputana Gold",
                        price = goldPrice,
                        cycle = if (billingCycle == 0) "month" else "month (billed annually)",
                        features = listOf(
                            "Direct WhatsApp access to family cards",
                            "Dedicated Rajput matchmaking manager",
                            "Gotra & Kul verification reviews",
                            "Top placement in featured sections"
                        ),
                        buttonText = "Go Gold Elite",
                        isFeatured = false,
                        onSelect = {
                            subscribe(session, "Gold") { msg ->
                                dialogMessage = msg
                                showDialog = true
                            }
                        }
                    )
                }
            }
        }

        // Royal Dialog Alert
        if (showDialog) {
            AlertDialog(
                onDismissRequest = { showDialog = false },
                title = {
                    Text(
                        text = "Shree Rajput Sagai Sambandh",
                        color = RoyalMaroon,
                        fontFamily = FontFamily.Serif,
                        fontWeight = FontWeight.Bold,
                        fontSize = 18.sp
                    )
                },
                text = {
                    Text(
                        text = dialogMessage,
                        color = Color(0xFF2C2C2C),
                        fontSize = 14.sp
                    )
                },
                confirmButton = {
                    TextButton(onClick = { showDialog = false }) {
                        Text(
                            text = "Khammaghani",
                            color = RoyalMaroon,
                            fontWeight = FontWeight.Bold,
                            fontSize = 15.sp
                        )
                    }
                },
                containerColor = Color.White,
                shape = RoundedCornerShape(16.dp)
            )
        }
    }
}

private fun subscribe(
    session: SagaiSessionManager,
    tier: String,
    onResult: (String) -> Unit
) {
    val user = session.currentUser.value
    if (user == null) {
        onResult("Please log in or register your profile to select a membership plan!")
        return
    }

    session.upgradeTier(tier)
    val updatedUser = user.copy(tier = tier)
    session.updateProfile(updatedUser) {
        // Updated in live Supabase database
    }
    onResult("Congratulations! You have successfully upgraded to the Rajputana $tier Membership plan.")
}

@Composable
fun PlanCard(
    title: String,
    price: Int,
    cycle: String,
    features: List<String>,
    buttonText: String,
    isFeatured: Boolean,
    onSelect: () -> Unit
) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .background(
                if (isFeatured) RoyalMaroon.copy(alpha = 0.85f)
                else Color.White.copy(alpha = 0.18f)
            )
            .border(
                2.dp,
                if (isFeatured) {
                    Brush.linearGradient(listOf(RoyalGold, LightGold, RoyalGold))
                } else {
                    Brush.linearGradient(listOf(Color.White.copy(alpha = 0.35f), Color.White.copy(alpha = 0.15f)))
                },
                RoundedCornerShape(16.dp)
            )
            .padding(24.dp)
    ) {
        Column(
            modifier = Modifier.fillMaxWidth(),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Most Popular Badge
            if (isFeatured) {
                Box(
                    modifier = Modifier
                        .offset(y = (-14).dp)
                        .clip(RoundedCornerShape(10.dp))
                        .background(
                            Brush.horizontalGradient(listOf(RoyalGold, LightGold))
                        )
                        .padding(horizontal = 12.dp, vertical = 4.dp)
                ) {
                    Text(
                        text = "MOST POPULAR",
                        color = RoyalMaroon,
                        fontWeight = FontWeight.Bold,
                        fontSize = 9.sp,
                        letterSpacing = 0.6.sp
                    )
                }
            }

            // Title
            Text(
                text = title,
                color = if (isFeatured) Color.White else LightGold,
                fontSize = 22.sp,
                fontWeight = FontWeight.Bold,
                fontFamily = FontFamily.Serif,
                textAlign = TextAlign.Center
            )

            // Price & Cycle
            Row(
                verticalAlignment = Alignment.Bottom,
                horizontalArrangement = Arrangement.Center
            ) {
                Text(
                    text = "₹$price",
                    color = if (isFeatured) LightGold else Color.White,
                    fontSize = 32.sp,
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.Serif
                )
                Text(
                    text = "/$cycle",
                    color = Color.White.copy(alpha = 0.8f),
                    fontSize = 11.sp,
                    modifier = Modifier.padding(bottom = 6.dp, start = 3.dp)
                )
            }

            Divider(
                color = if (isFeatured) RoyalGold.copy(alpha = 0.5f) else Color.White.copy(alpha = 0.25f),
                thickness = 1.dp
            )

            // Features List
            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                features.forEach { feature ->
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.Top
                    ) {
                        Icon(
                            imageVector = Icons.Default.CheckCircle,
                            contentDescription = null,
                            tint = LightGold,
                            modifier = Modifier
                                .size(16.dp)
                                .padding(top = 1.dp)
                        )
                        Spacer(modifier = Modifier.width(10.dp))
                        Text(
                            text = feature,
                            color = Color.White,
                            fontSize = 13.sp,
                            lineHeight = 18.sp
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(4.dp))

            // Action Button
            Box(
                contentAlignment = Alignment.Center,
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(8.dp))
                    .background(
                        if (isFeatured) {
                            Brush.horizontalGradient(listOf(LightGold, RoyalGold))
                        } else {
                            Brush.horizontalGradient(listOf(Color.White, Color(0xFFF5EFE6)))
                        }
                    )
                    .clickable(onClick = onSelect)
                    .padding(vertical = 12.dp)
            ) {
                Text(
                    text = buttonText,
                    color = RoyalMaroon,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold
                )
            }
        }
    }
}
