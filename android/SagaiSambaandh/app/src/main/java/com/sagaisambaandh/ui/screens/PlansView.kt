package com.sagaisambaandh.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.sagaisambaandh.data.SagaiSessionManager
import com.sagaisambaandh.data.User
import com.sagaisambaandh.ui.theme.*

@Composable
fun PlansView(
    session: SagaiSessionManager,
    modifier: Modifier = Modifier
) {
    var billingCycle by remember { mutableStateOf(0) } // 0 = Monthly, 1 = Annual (20% off)
    var showDialog by remember { mutableStateOf(false) }
    var dialogMessage by remember { mutableStateOf("") }

    val starterPrice = if (billingCycle == 0) 0 else 3999
    val silverPrice = if (billingCycle == 0) 11999 else 9599
    val goldPrice = if (billingCycle == 0) 24999 else 19999

    Column(
        modifier = modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .background(MaterialTheme.colorScheme.background)
            .padding(16.dp)
    ) {
        // Header
        Text(
            text = "Regal Memberships",
            color = LightGold,
            fontSize = 24.sp,
            fontWeight = FontWeight.Bold,
            fontFamily = FontFamily.Serif
        )
        Text(
            text = "Select a Rajputana subscription tier to unlock premium features and direct family contact lines.",
            color = SandstoneIvory.copy(alpha = 0.7f),
            fontSize = 13.sp,
            modifier = Modifier.padding(top = 4.dp, bottom = 16.dp)
        )

        // Billing controller switcher
        TabRow(
            selectedTabIndex = billingCycle,
            containerColor = Color.Transparent,
            contentColor = LightGold,
            divider = {},
            indicator = {},
            modifier = Modifier
                .fillMaxWidth()
                .background(RoyalGold.copy(alpha = 0.1f), shape = RoundedCornerShape(10.dp))
                .padding(4.dp)
        ) {
            Tab(
                selected = billingCycle == 0,
                onClick = { billingCycle = 0 },
                modifier = Modifier
                    .background(
                        if (billingCycle == 0) DeepMaroon else Color.Transparent,
                        shape = RoundedCornerShape(8.dp)
                    )
                    .height(36.dp)
            ) {
                Text(
                    text = "Monthly",
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold,
                    color = if (billingCycle == 0) LightGold else SandstoneIvory.copy(alpha = 0.6f)
                )
            }

            Tab(
                selected = billingCycle == 1,
                onClick = { billingCycle = 1 },
                modifier = Modifier
                    .background(
                        if (billingCycle == 1) DeepMaroon else Color.Transparent,
                        shape = RoundedCornerShape(8.dp)
                    )
                    .height(36.dp)
            ) {
                Text(
                    text = "Annual (Save 20%)",
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold,
                    color = if (billingCycle == 1) LightGold else SandstoneIvory.copy(alpha = 0.6f)
                )
            }
        }

        Spacer(modifier = Modifier.height(20.dp))

        // Plans grid
        Column(verticalArrangement = Arrangement.spacedBy(20.dp)) {
            // Plan 1: Starter
            PlanCard(
                title = "Starter",
                price = starterPrice,
                cycle = if (billingCycle == 0) "1 month trial" else "month (billed annually)",
                features = listOf(
                    "View complete Rajput profiles",
                    "Send 10 express interests / month",
                    "Astrology & Kundli matches overview"
                ),
                buttonText = "Select Starter",
                isFeatured = false,
                onSelect = {
                    performSubscribe(session, "Starter") { msg ->
                        dialogMessage = msg
                        showDialog = true
                    }
                }
            )

            // Plan 2: Silver (Featured)
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
                    performSubscribe(session, "Silver") { msg ->
                        dialogMessage = msg
                        showDialog = true
                    }
                }
            )

            // Plan 3: Gold
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
                    performSubscribe(session, "Gold") { msg ->
                        dialogMessage = msg
                        showDialog = true
                    }
                }
            )
        }
        Spacer(modifier = Modifier.height(30.dp))

        // Dialog alert
        if (showDialog) {
            AlertDialog(
                onDismissRequest = { showDialog = false },
                title = { Text(text = "Shree Rajput Sagai Sambandh", fontFamily = FontFamily.Serif, fontWeight = FontWeight.Bold) },
                text = { Text(text = dialogMessage) },
                confirmButton = {
                    TextButton(onClick = { showDialog = false }) {
                        Text(text = "Khammaghani", color = RoyalMaroon, fontWeight = FontWeight.Bold)
                    }
                },
                containerColor = CardBackground
            )
        }
    }
}

private fun performSubscribe(
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
    val cardBg = if (isFeatured) RoyalMaroon else DeepMaroon
    val textMain = if (isFeatured) Color.White else SandstoneIvory
    val textMutedColor = if (isFeatured) Color.White.copy(alpha = 0.8f) else SandstoneIvory.copy(alpha = 0.7f)

    Card(
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = cardBg),
        border = CardDefaults.outlinedCardBorder().copy(
            brush = Brush.linearGradient(
                colors = if (isFeatured) listOf(RoyalGold, LightGold) else listOf(RoyalGold.copy(alpha = 0.2f), RoyalGold.copy(alpha = 0.4f))
            ),
            width = if (isFeatured) 2.dp else 1.dp
        ),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(24.dp)) {
            // Header text
            Box(modifier = Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
                if (isFeatured) {
                    Text(
                        text = "MOST POPULAR",
                        color = RoyalMaroon,
                        fontWeight = FontWeight.Bold,
                        fontSize = 9.sp,
                        modifier = Modifier
                            .background(LightGold, shape = RoundedCornerShape(8.dp))
                            .padding(horizontal = 8.dp, vertical = 3.dp)
                            .offset(y = (-10).dp)
                    )
                }
            }

            Text(
                text = title,
                color = textMain,
                fontSize = 22.sp,
                fontWeight = FontWeight.Bold,
                fontFamily = FontFamily.Serif,
                textAlign = TextAlign.Center,
                modifier = Modifier.fillMaxWidth()
            )

            Spacer(modifier = Modifier.height(8.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.Center,
                verticalAlignment = Alignment.Bottom
            ) {
                Text(
                    text = if (price == 0) "Free" else "₹$price",
                    color = if (isFeatured) LightGold else LightGold,
                    fontSize = 32.sp,
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.Serif
                )
                Text(
                    text = "/$cycle",
                    color = textMutedColor,
                    fontSize = 11.sp,
                    modifier = Modifier.padding(bottom = 6.dp, start = 2.dp)
                )
            }

            Spacer(modifier = Modifier.height(15.dp))
            Divider(color = if (isFeatured) Color.White.copy(alpha = 0.2f) else RoyalGold.copy(alpha = 0.2f))
            Spacer(modifier = Modifier.height(15.dp))

            // Features list
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                features.forEach { feature ->
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.Top
                    ) {
                        Icon(
                            imageVector = Icons.Default.CheckCircle,
                            contentDescription = null,
                            tint = if (isFeatured) LightGold else RoyalGold,
                            modifier = Modifier.size(16.dp)
                        )
                        Spacer(modifier = Modifier.width(10.dp))
                        Text(
                            text = feature,
                            color = textMain,
                            fontSize = 13.sp,
                            lineHeight = 18.sp
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(20.dp))

            // Action button
            Button(
                onClick = onSelect,
                shape = RoundedCornerShape(8.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = if (isFeatured) LightGold else RoyalGold,
                    contentColor = RoyalMaroon
                ),
                modifier = Modifier.fillMaxWidth()
            ) {
                Text(
                    text = buttonText,
                    fontWeight = FontWeight.Bold,
                    fontSize = 14.sp
                )
            }
        }
    }
}
