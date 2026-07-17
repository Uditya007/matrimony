package com.sagaisambaandh.ui.screens

import androidx.compose.animation.core.*
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
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.FontStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.layout.ContentScale
import coil.compose.AsyncImage
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

    var activeHeroSlide by remember { mutableStateOf(0) }
    LaunchedEffect(Unit) {
        while(true) {
            kotlinx.coroutines.delay(4000)
            activeHeroSlide = (activeHeroSlide + 1) % 3
        }
    }

    Column(
        modifier = modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .background(MaterialTheme.colorScheme.background)
    ) {
        // Ticker Marquee Ribbon
        MarqueeTicker()

        // Hero Banner with Palace Skyline & Couples Photos Slideshow Background
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(240.dp),
            contentAlignment = Alignment.BottomCenter
        ) {
            // Couples Slide background image
            AsyncImage(
                model = "https://shreerajputsagaisambandh.com/images/slide${activeHeroSlide + 1}.jpg",
                contentDescription = "Royal Couples Slideshow",
                contentScale = ContentScale.Crop,
                modifier = Modifier.fillMaxSize()
            )

            // Overlaid Dark Red/Maroon Gradient overlay to keep text legible
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(
                        Brush.verticalGradient(
                            colors = listOf(DeepMaroon.copy(alpha = 0.5f), RoyalMaroon.copy(alpha = 0.85f))
                        )
                    )
            )
            // Animated Slide Content
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 30.dp, bottom = 48.dp, start = 20.dp, end = 20.dp)
                    .height(130.dp)
            ) {
                Text(
                    text = "SHREE RAJPUT SAGAI SAMBANDH",
                    color = LightGold,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 3.sp
                )
                Spacer(modifier = Modifier.height(12.dp))
                
                when (activeHeroSlide) {
                    0 -> {
                        Text(
                            text = "Where Lineage\nMeets Sacred Legacy",
                            color = SandstoneIvory,
                            fontSize = 26.sp,
                            fontWeight = FontWeight.Bold,
                            fontFamily = FontFamily.Serif,
                            textAlign = TextAlign.Center,
                            lineHeight = 32.sp
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = "Premium, secure, and dedicated matchmaking portal.",
                            color = SandstoneIvory.copy(alpha = 0.8f),
                            fontSize = 12.sp,
                            textAlign = TextAlign.Center
                        )
                    }
                    1 -> {
                        Text(
                            text = "Gotra-Sensitive\nMatchmaking System",
                            color = SandstoneIvory,
                            fontSize = 26.sp,
                            fontWeight = FontWeight.Bold,
                            fontFamily = FontFamily.Serif,
                            textAlign = TextAlign.Center,
                            lineHeight = 32.sp
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = "Strict checks to prevent overlapping gotra matches.",
                            color = SandstoneIvory.copy(alpha = 0.8f),
                            fontSize = 12.sp,
                            textAlign = TextAlign.Center
                        )
                    }
                    2 -> {
                        Text(
                            text = "Vetted Rajput\nLineage Records",
                            color = SandstoneIvory,
                            fontSize = 26.sp,
                            fontWeight = FontWeight.Bold,
                            fontFamily = FontFamily.Serif,
                            textAlign = TextAlign.Center,
                            lineHeight = 32.sp
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = "Direct family-to-family contact connection lines.",
                            color = SandstoneIvory.copy(alpha = 0.8f),
                            fontSize = 12.sp,
                            textAlign = TextAlign.Center
                        )
                    }
                }
            }

            PalaceDivider(
                fillColor = RoyalMaroon,
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
            colors = CardDefaults.cardColors(containerColor = DeepMaroon),
            elevation = CardDefaults.cardElevation(defaultElevation = 6.dp)
        ) {
            Column(
                modifier = Modifier.padding(20.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    text = "FIND YOUR NOBLE MATCH",
                    color = LightGold,
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
                        Text(text = "LOOKING FOR", fontSize = 8.sp, color = LightGold.copy(alpha = 0.8f), fontWeight = FontWeight.Bold)
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
                                color = SandstoneIvory,
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Medium
                            )
                        }
                    }

                    Spacer(modifier = Modifier.width(16.dp))

                    // Clan dropdown
                    Column(modifier = Modifier.weight(1f)) {
                        Text(text = "RAJPUT CLAN", fontSize = 8.sp, color = LightGold.copy(alpha = 0.8f), fontWeight = FontWeight.Bold)
                        Box {
                            Text(
                                text = selectedClan,
                                color = SandstoneIvory,
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
                            onNavigateToTab(3)
                        } else {
                            onNavigateToTab(3)
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

        // Profile Completion checklist card like Shaadi.com (if logged in)
        if (session.currentUser.value != null) {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp, vertical = 10.dp),
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = DeepMaroon),
                border = CardDefaults.outlinedCardBorder().copy(
                    brush = Brush.linearGradient(listOf(RoyalGold.copy(alpha = 0.2f), RoyalGold.copy(alpha = 0.4f)))
                )
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "Complete your Profile",
                        color = LightGold,
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Serif
                    )
                    Text(
                        text = "Completed profiles get 2x more matches and responses.",
                        color = SandstoneIvory.copy(alpha = 0.7f),
                        fontSize = 12.sp,
                        modifier = Modifier.padding(top = 2.dp, bottom = 12.dp)
                    )
                    
                    ProfileChecklistItem(title = "Verify your Rajput Lineage", checked = true)
                    ProfileChecklistItem(title = "Upload Heritage Photos", checked = false)
                    ProfileChecklistItem(title = "Add Astro & Kundli details", checked = false)
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
                color = LightGold,
                fontSize = 20.sp,
                fontWeight = FontWeight.Bold,
                fontFamily = FontFamily.Serif,
                modifier = Modifier.padding(horizontal = 20.dp)
            )
            Text(
                text = "Verified brides and grooms recently active",
                color = SandstoneIvory.copy(alpha = 0.7f),
                fontSize = 12.sp,
                modifier = Modifier.padding(horizontal = 20.dp, vertical = 2.dp)
            )

            Spacer(modifier = Modifier.height(12.dp))

            if (filteredProfiles.isEmpty()) {
                Text(
                    text = "No noble profiles match your search criteria currently.",
                    color = SandstoneIvory.copy(alpha = 0.5f),
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
                text = "The Shree Rajput Sagai Sambandh Promise",
                color = LightGold,
                fontSize = 18.sp,
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

        // FAQ Section
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp, vertical = 24.dp)
        ) {
            Text(
                text = "Frequently Asked Questions",
                color = LightGold,
                fontSize = 20.sp,
                fontWeight = FontWeight.Bold,
                fontFamily = FontFamily.Serif
            )
            Text(
                text = "Learn more about our lineage checks and Gotra guidelines.",
                color = SandstoneIvory.copy(alpha = 0.7f),
                fontSize = 12.sp,
                modifier = Modifier.padding(top = 2.dp, bottom = 16.dp)
            )

            FaqAccordionItem(
                question = "What is Shree Rajput Sagai Sambandh?",
                answer = "Shree Rajput Sagai Sambandh is an elite matrimonial portal designed exclusively for the Rajput community. We prioritize lineage audits, background verification checks, and Gotra compatibility to match candidates of noble lineage."
            )
            Spacer(modifier = Modifier.height(4.dp))
            FaqAccordionItem(
                question = "How does Gotra-sensitive matchmaking work?",
                answer = "According to traditional Rajput custom, marriages within the same Gotra (Sagotra Union) are strictly prohibited. Our system scans database candidates and checks their paternal and maternal Gotras, rejecting overlapping candidates to guarantee lineage guidelines are maintained."
            )
            Spacer(modifier = Modifier.height(4.dp))
            FaqAccordionItem(
                question = "Is there a free trial option available?",
                answer = "Yes! In celebration of our inaugural launch, we are offering the Starter Plan completely Free for 1 Month. This allows you to list your profile, search the Rajput directory, and explore potential alignments without any upfront fees."
            )
            Spacer(modifier = Modifier.height(4.dp))
            FaqAccordionItem(
                question = "How are profiles screened and verified?",
                answer = "Every profile undergoes manual validation by our dedicated family screening desk. We verify details such as clan heritage, native birthplace, and contacts to maintain a secure and trustworthy database of genuine Rajput matches."
            )
            Spacer(modifier = Modifier.height(4.dp))
            FaqAccordionItem(
                question = "How do I connect to a customer relation agent?",
                answer = "You can contact our WhatsApp Relations Desk directly at +91 9928592159 for custom match selection and background validation support. Khammaghani!"
            )
        }
        Spacer(modifier = Modifier.height(20.dp))
    }
}

@Composable
fun MarqueeTicker() {
    val transition = rememberInfiniteTransition()
    val offsetX by transition.animateFloat(
        initialValue = 1f,
        targetValue = -1f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 15000, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        )
    )
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .background(Brush.linearGradient(colors = listOf(Color(0xFFC9A227), Color(0xFFE8C766), Color(0xFFC9A227))))
            .padding(vertical = 6.dp),
        contentAlignment = Alignment.CenterStart
    ) {
        BoxWithConstraints(modifier = Modifier.fillMaxWidth()) {
            val screenWidthDp = maxWidth
            Text(
                text = "✨ Register your noble profile today and enjoy a Free Trial for a month! ✨   ✨ Register your noble profile today and enjoy a Free Trial for a month! ✨",
                color = RoyalMaroon,
                fontSize = 10.sp,
                fontWeight = FontWeight.Bold,
                maxLines = 1,
                modifier = Modifier.offset(x = screenWidthDp * offsetX)
            )
        }
    }
}

@Composable
fun FaqAccordionItem(question: String, answer: String) {
    var expanded by remember { mutableStateOf(false) }

    Card(
        shape = RoundedCornerShape(8.dp),
        colors = CardDefaults.cardColors(containerColor = DeepMaroon),
        border = CardDefaults.outlinedCardBorder().copy(
            brush = Brush.linearGradient(
                colors = if (expanded) listOf(RoyalGold, LightGold) else listOf(RoyalGold.copy(alpha = 0.2f), RoyalGold.copy(alpha = 0.2f))
            ),
            width = 1.dp
        ),
        modifier = Modifier
            .fillMaxWidth()
            .clickable { expanded = !expanded }
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = question,
                    color = LightGold,
                    fontWeight = FontWeight.Bold,
                    fontSize = 13.sp,
                    fontFamily = FontFamily.Serif,
                    modifier = Modifier.weight(1f)
                )
                Text(
                    text = if (expanded) "−" else "+",
                    color = RoyalGold,
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold
                )
            }
            if (expanded) {
                Spacer(modifier = Modifier.height(10.dp))
                Text(
                    text = answer,
                    color = SandstoneIvory,
                    fontSize = 12.sp,
                    lineHeight = 16.sp
                )
            }
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
                color = SandstoneIvory,
                fontWeight = FontWeight.Bold,
                fontSize = 14.sp
            )
            Spacer(modifier = Modifier.height(2.dp))
            Text(
                text = desc,
                color = SandstoneIvory.copy(alpha = 0.7f),
                fontSize = 12.sp,
                lineHeight = 16.sp
            )
        }
    }
}

@Composable
fun ProfileChecklistItem(title: String, checked: Boolean) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 6.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            imageVector = Icons.Default.CheckCircle,
            contentDescription = null,
            tint = if (checked) Color(0xFF4CAF50) else SandstoneIvory.copy(alpha = 0.3f),
            modifier = Modifier.size(16.dp)
        )
        Spacer(modifier = Modifier.width(10.dp))
        Text(
            text = title,
            color = SandstoneIvory,
            fontSize = 13.sp
        )
    }
}
