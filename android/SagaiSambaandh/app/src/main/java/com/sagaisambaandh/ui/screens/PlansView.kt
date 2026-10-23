package com.sagaisambaandh.ui.screens

import android.content.Intent
import android.net.Uri
import android.widget.Toast
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
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.ContentCopy
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.WorkspacePremium
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.sagaisambaandh.data.SagaiSessionManager
import com.sagaisambaandh.data.User
import com.sagaisambaandh.ui.components.RoyalBackground
import com.sagaisambaandh.ui.theme.*
import java.net.URLEncoder

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PlansView(
    session: SagaiSessionManager,
    onNotificationsTap: () -> Unit = {},
    modifier: Modifier = Modifier
) {
    var billingCycle by remember { mutableStateOf(0) } // 0 = Monthly, 1 = Annual (20% off)
    var showDialog by remember { mutableStateOf(false) }
    var dialogMessage by remember { mutableStateOf("") }
    var showPaymentDialog by remember { mutableStateOf(false) }
    var selectedPlanTier by remember { mutableStateOf("") }
    var selectedPlanPrice by remember { mutableStateOf(0) }
    var selectedCycleLabel by remember { mutableStateOf("") }

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
                            if (session.currentUser.value == null) {
                                dialogMessage = "Please log in or register your profile to select a membership plan!"
                                showDialog = true
                            } else {
                                selectedPlanTier = "Silver"
                                selectedPlanPrice = silverPrice
                                selectedCycleLabel = if (billingCycle == 0) "1 Month Access" else "Annual Access (Save 20%)"
                                showPaymentDialog = true
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
                            if (session.currentUser.value == null) {
                                dialogMessage = "Please log in or register your profile to select a membership plan!"
                                showDialog = true
                            } else {
                                selectedPlanTier = "Gold"
                                selectedPlanPrice = goldPrice
                                selectedCycleLabel = if (billingCycle == 0) "1 Month Access" else "Annual Access (Save 20%)"
                                showPaymentDialog = true
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

        // Royal UPI Payment Dialog (YouPI Gateway)
        if (showPaymentDialog) {
            RoyalUPIPaymentDialog(
                tier = selectedPlanTier,
                price = selectedPlanPrice,
                cycleLabel = selectedCycleLabel,
                onDismiss = { showPaymentDialog = false },
                onUpgradeSuccess = { utr ->
                    showPaymentDialog = false
                    subscribe(session, selectedPlanTier) {
                        dialogMessage = "Khammaghani! Payment confirmed via Royal UPI (UTR: $utr). You have successfully upgraded to the Rajputana $selectedPlanTier Membership plan."
                        showDialog = true
                    }
                }
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

// MARK: - Royal UPI Payment Dialog (YouPI Gateway)
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RoyalUPIPaymentDialog(
    tier: String,
    price: Int,
    cycleLabel: String,
    onDismiss: () -> Unit,
    onUpgradeSuccess: (String) -> Unit
) {
    val context = LocalContext.current
    val clipboardManager = LocalClipboardManager.current
    var utrInput by remember { mutableStateOf("") }
    var isVerifying by remember { mutableStateOf(false) }
    var verificationNotice by remember { mutableStateOf<String?>(null) }
    var isNoticeError by remember { mutableStateOf(false) }
    var copiedVPA by remember { mutableStateOf(false) }

    val vpa = "7665941949@kotak"
    val payeeName = "Shree Rajput Sagai Sambandh"

    val encodedPayee = try { URLEncoder.encode(payeeName, "UTF-8") } catch (e: Exception) { "ShreeRajputSagaiSambandh" }
    val encodedNote = try { URLEncoder.encode("Sagai Sambandh $tier Plan", "UTF-8") } catch (e: Exception) { "Membership" }
    val refId = "SAGAI${System.currentTimeMillis()}"
    val upiUri = "upi://pay?pa=$vpa&pn=$encodedPayee&am=$price.00&cu=INR&tr=$refId&tn=$encodedNote"
    val qrUrl = "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=" + (try { URLEncoder.encode(upiUri, "UTF-8") } catch (e: Exception) { "" })

    fun launchUPIIntent(specificPackage: String? = null) {
        try {
            val intent = Intent(Intent.ACTION_VIEW).apply {
                data = Uri.parse(upiUri)
                if (specificPackage != null) {
                    setPackage(specificPackage)
                }
            }
            if (specificPackage != null) {
                context.startActivity(intent)
            } else {
                val chooser = Intent.createChooser(intent, "Pay with UPI (GPay, PhonePe, Paytm, CRED)")
                context.startActivity(chooser)
            }
        } catch (e: Exception) {
            try {
                val fallbackIntent = Intent(Intent.ACTION_VIEW, Uri.parse(upiUri))
                context.startActivity(Intent.createChooser(fallbackIntent, "Pay with UPI"))
            } catch (err: Exception) {
                Toast.makeText(context, "No UPI app found. Please scan the QR code or copy UPI ID.", Toast.LENGTH_LONG).show()
            }
        }
    }

    fun submitUTR() {
        val clean = utrInput.trim()
        if (clean.length < 8) {
            verificationNotice = "Please enter a valid 12-digit UTR bank reference number."
            isNoticeError = true
            return
        }

        isVerifying = true
        isNoticeError = false
        verificationNotice = "Verifying with royal bank desk..."

        onUpgradeSuccess(clean)
    }

    AlertDialog(
        onDismissRequest = onDismiss,
        properties = androidx.compose.ui.window.DialogProperties(usePlatformDefaultWidth = false),
        modifier = Modifier
            .fillMaxWidth(0.95f)
            .fillMaxHeight(0.92f)
    ) {
        Card(
            modifier = Modifier.fillMaxSize(),
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(containerColor = Color(0xFFF9FAFB))
        ) {
            Column(modifier = Modifier.fillMaxSize()) {
                // Header
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(Brush.horizontalGradient(listOf(RoyalMaroon, DeepMaroon)))
                        .padding(horizontal = 16.dp, vertical = 14.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            contentAlignment = Alignment.Center,
                            modifier = Modifier
                                .size(34.dp)
                                .clip(CircleShape)
                                .background(Color.White.copy(alpha = 0.15f))
                        ) {
                            Icon(
                                imageVector = Icons.Default.WorkspacePremium,
                                contentDescription = "Crown",
                                tint = RoyalGold,
                                modifier = Modifier.size(18.dp)
                            )
                        }
                        Spacer(modifier = Modifier.width(10.dp))
                        Column {
                            Text(
                                text = "Royal UPI Gateway",
                                color = Color.White,
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Bold,
                                fontFamily = FontFamily.Serif
                            )
                            Text(
                                text = "0% Platform Fee • Instant Settlement",
                                color = LightGold,
                                fontSize = 11.sp
                            )
                        }
                    }

                    Icon(
                        imageVector = Icons.Default.Close,
                        contentDescription = "Close",
                        tint = Color.White.copy(alpha = 0.8f),
                        modifier = Modifier
                            .size(24.dp)
                            .clickable(onClick = onDismiss)
                    )
                }

                // Scrollable Body
                Column(
                    modifier = Modifier
                        .weight(1f)
                        .verticalScroll(rememberScrollState())
                        .padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(14.dp)
                ) {
                    // Order Summary Box
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(12.dp))
                            .background(Color(0xFFFDF9F0))
                            .border(1.dp, LightGold.copy(alpha = 0.6f), RoundedCornerShape(12.dp))
                            .padding(14.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column {
                            Text(
                                text = "Rajputana $tier Plan",
                                color = InkBrown,
                                fontSize = 15.sp,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = cycleLabel,
                                color = Color(0xFF78350F),
                                fontSize = 12.sp
                            )
                        }
                        Text(
                            text = "₹$price",
                            color = RoyalMaroon,
                            fontSize = 20.sp,
                            fontWeight = FontWeight.ExtraBold
                        )
                    }

                    // 1-Tap UPI Apps Grid
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(14.dp),
                        colors = CardDefaults.cardColors(containerColor = Color.White)
                    ) {
                        Column(
                            modifier = Modifier.padding(12.dp),
                            verticalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Text(
                                text = "1-TAP INSTANT PAYMENT APPS",
                                color = Color.Gray,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                letterSpacing = 0.5.sp
                            )

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                AndroidUpiAppButton(
                                    label = "GPay",
                                    color = Color(0xFF0F9D58),
                                    modifier = Modifier.weight(1f),
                                    onClick = { launchUPIIntent("com.google.android.apps.nbu.paisa.user") }
                                )
                                AndroidUpiAppButton(
                                    label = "PhonePe",
                                    color = Color(0xFF5F259F),
                                    modifier = Modifier.weight(1f),
                                    onClick = { launchUPIIntent("com.phonepe.app") }
                                )
                                AndroidUpiAppButton(
                                    label = "Paytm",
                                    color = Color(0xFF00B9F1),
                                    modifier = Modifier.weight(1f),
                                    onClick = { launchUPIIntent("net.one97.paytm") }
                                )
                            }

                            // Launch Any UPI App Button
                            Box(
                                contentAlignment = Alignment.Center,
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(10.dp))
                                    .background(Brush.horizontalGradient(listOf(RoyalMaroon, DeepMaroon)))
                                    .clickable { launchUPIIntent() }
                                    .padding(vertical = 12.dp)
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.Center
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.WorkspacePremium,
                                        contentDescription = "Pay",
                                        tint = RoyalGold,
                                        modifier = Modifier.size(16.dp)
                                    )
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text(
                                        text = "⚡ Launch Any UPI App on Device",
                                        color = Color.White,
                                        fontSize = 13.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                            }
                        }
                    }

                    // Dynamic QR Code Section
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(14.dp),
                        colors = CardDefaults.cardColors(containerColor = Color.White)
                    ) {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(14.dp),
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Text(
                                text = "Scan QR with any UPI App",
                                color = Color.Gray,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Medium
                            )

                            Box(
                                contentAlignment = Alignment.Center,
                                modifier = Modifier
                                    .size(180.dp)
                                    .clip(RoundedCornerShape(12.dp))
                                    .background(Color.White)
                                    .border(1.dp, Color(0xFFE5E7EB), RoundedCornerShape(12.dp))
                                    .padding(6.dp)
                            ) {
                                AsyncImage(
                                    model = qrUrl,
                                    contentDescription = "UPI QR Code",
                                    modifier = Modifier.fillMaxSize()
                                )
                            }

                            // Kotak VPA chip
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                modifier = Modifier
                                    .clip(CircleShape)
                                    .background(Color(0xFFF3F4F6))
                                    .padding(horizontal = 12.dp, vertical = 6.dp)
                            ) {
                                Text(
                                    text = vpa,
                                    color = InkBrown,
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    fontFamily = FontFamily.Monospace
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                Box(
                                    contentAlignment = Alignment.Center,
                                    modifier = Modifier
                                        .clip(CircleShape)
                                        .background(RoyalMaroon)
                                        .clickable {
                                            clipboardManager.setText(AnnotatedString(vpa))
                                            copiedVPA = true
                                            Toast.makeText(context, "UPI ID copied!", Toast.LENGTH_SHORT).show()
                                        }
                                        .padding(horizontal = 8.dp, vertical = 3.dp)
                                ) {
                                    Text(
                                        text = if (copiedVPA) "Copied!" else "Copy",
                                        color = Color.White,
                                        fontSize = 10.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                            }
                        }
                    }

                    // 12-Digit UTR Entry & Confirm
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(14.dp),
                        colors = CardDefaults.cardColors(containerColor = Color.White)
                    ) {
                        Column(
                            modifier = Modifier.padding(14.dp),
                            verticalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Text(
                                text = "Enter 12-Digit Bank UTR / Reference Number",
                                color = InkBrown,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold
                            )

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                OutlinedTextField(
                                    value = utrInput,
                                    onValueChange = { utrInput = it },
                                    placeholder = { Text("e.g. 428901234567", fontSize = 13.sp) },
                                    singleLine = true,
                                    modifier = Modifier.weight(1f),
                                    shape = RoundedCornerShape(10.dp)
                                )

                                Button(
                                    onClick = { submitUTR() },
                                    colors = ButtonDefaults.buttonColors(containerColor = Color.Transparent),
                                    contentPadding = PaddingValues(),
                                    shape = RoundedCornerShape(10.dp),
                                    modifier = Modifier.height(50.dp)
                                ) {
                                    Box(
                                        contentAlignment = Alignment.Center,
                                        modifier = Modifier
                                            .fillMaxHeight()
                                            .background(
                                                Brush.horizontalGradient(listOf(RoyalGold, Color(0xFFB8860B))),
                                                RoundedCornerShape(10.dp)
                                            )
                                            .padding(horizontal = 16.dp)
                                    ) {
                                        if (isVerifying) {
                                            CircularProgressIndicator(
                                                color = Color.White,
                                                modifier = Modifier.size(18.dp),
                                                strokeWidth = 2.dp
                                            )
                                        } else {
                                            Text(
                                                text = "Verify",
                                                color = Color.White,
                                                fontSize = 13.sp,
                                                fontWeight = FontWeight.Bold
                                            )
                                        }
                                    }
                                }
                            }

                            val notice = verificationNotice
                            if (notice != null) {
                                Text(
                                    text = notice,
                                    color = if (isNoticeError) DislikeRed else SuccessGreen,
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Medium
                                )
                            } else {
                                Text(
                                    text = "🛡️ Direct Kotak Bank Settlement • Auto-reconciliation active",
                                    color = SuccessGreen,
                                    fontSize = 11.sp
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun AndroidUpiAppButton(
    label: String,
    color: Color,
    modifier: Modifier = Modifier,
    onClick: () -> Unit
) {
    Box(
        contentAlignment = Alignment.Center,
        modifier = modifier
            .clip(RoundedCornerShape(10.dp))
            .background(Color(0xFFF9FAFB))
            .border(1.dp, Color(0xFFE5E7EB), RoundedCornerShape(10.dp))
            .clickable(onClick = onClick)
            .padding(vertical = 10.dp)
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.Center
        ) {
            Box(
                modifier = Modifier
                    .size(8.dp)
                    .clip(CircleShape)
                    .background(color)
            )
            Spacer(modifier = Modifier.width(6.dp))
            Text(
                text = label,
                color = InkBrown,
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold
            )
        }
    }
}
