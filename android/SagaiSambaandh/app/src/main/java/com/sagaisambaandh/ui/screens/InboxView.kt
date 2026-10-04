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
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.MailOutline
import androidx.compose.material.icons.filled.Message
import androidx.compose.material.icons.filled.Verified
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.sagaisambaandh.data.ConnectionRecord
import com.sagaisambaandh.data.Profile
import com.sagaisambaandh.data.SagaiSessionManager
import com.sagaisambaandh.ui.components.RoyalBackground
import com.sagaisambaandh.ui.theme.*

@Composable
fun InboxView(
    session: SagaiSessionManager,
    modifier: Modifier = Modifier
) {
    var selectedSubTab by remember { mutableStateOf(0) } // 0 = Received, 1 = Accepted, 2 = Sent
    var activeChatProfile by remember { mutableStateOf<Profile?>(null) }

    val user = session.currentUser.value
    val profiles = session.profiles.value
    val connections = session.connectionsList.value

    LaunchedEffect(user?.id) {
        user?.id?.let {
            session.fetchConnectionsAndGenerateNotifications(it)
        }
    }

    val filteredConnections = remember(connections, selectedSubTab, user?.id) {
        val currentUserId = user?.id ?: return@remember emptyList<ConnectionRecord>()
        when (selectedSubTab) {
            0 -> connections.filter { it.receiver_id == currentUserId && it.status == "pending" }
            1 -> connections.filter { it.status == "accepted" }
            2 -> connections.filter { it.sender_id == currentUserId && it.status == "pending" }
            else -> emptyList()
        }
    }

    fun lookupProfile(record: ConnectionRecord): Profile? {
        val currentUserId = user?.id ?: return null
        val targetId = if (record.sender_id == currentUserId) record.receiver_id else record.sender_id
        return profiles.firstOrNull { it.id == targetId }
    }

    fun handleAccept(record: ConnectionRecord) {
        val currentUserId = user?.id ?: return
        val otherUserId = if (record.sender_id == currentUserId) record.receiver_id else record.sender_id
        session.updateConnection(otherUserId, currentUserId, "accepted") {
            session.refreshCurrentUserAbout()
        }
    }

    fun handleDecline(record: ConnectionRecord) {
        val currentUserId = user?.id ?: return
        val otherUserId = if (record.sender_id == currentUserId) record.receiver_id else record.sender_id
        session.updateConnection(otherUserId, currentUserId, "declined") {
            session.refreshCurrentUserAbout()
        }
    }

    RoyalBackground(modifier = modifier) {
        Column(modifier = Modifier.fillMaxSize()) {
            // Top Custom Header
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp, vertical = 14.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Requests",
                    color = Color.White,
                    fontSize = 26.sp,
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.Serif
                )
            }

            // Sub Tabs Selection (Capsule segment bar)
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp, vertical = 6.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                listOf("Received", "Accepted", "Sent").forEachIndexed { index, title ->
                    val isSelected = selectedSubTab == index
                    Box(
                        contentAlignment = Alignment.Center,
                        modifier = Modifier
                            .weight(1f)
                            .clip(CircleShape)
                            .background(if (isSelected) LightGold else Color.White.copy(alpha = 0.18f))
                            .border(
                                1.dp,
                                if (isSelected) Color.Transparent else Color.White.copy(alpha = 0.25f),
                                CircleShape
                            )
                            .clickable { selectedSubTab = index }
                            .padding(vertical = 9.dp)
                    ) {
                        Text(
                            text = title,
                            color = if (isSelected) RoyalMaroon else Color.White,
                            fontSize = 13.sp,
                            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            // Body content
            if (filteredConnections.isEmpty()) {
                // Empty state
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(horizontal = 36.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center
                ) {
                    Box(
                        contentAlignment = Alignment.Center,
                        modifier = Modifier
                            .size(80.dp)
                            .background(Color.White.copy(alpha = 0.15f), shape = CircleShape)
                    ) {
                        Icon(
                            imageVector = Icons.Default.MailOutline,
                            contentDescription = null,
                            tint = LightGold,
                            modifier = Modifier.size(36.dp)
                        )
                    }
                    Spacer(modifier = Modifier.height(16.dp))
                    Text(
                        text = when (selectedSubTab) {
                            0 -> "No Pending Requests"
                            1 -> "No Active Connections"
                            else -> "No Sent Requests"
                        },
                        color = Color.White,
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Serif,
                        textAlign = TextAlign.Center
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "Lineage compatibility checks are run in real-time. Invite other members to connect and establish family trust.",
                        color = Color.White.copy(alpha = 0.85f),
                        fontSize = 13.sp,
                        lineHeight = 18.sp,
                        textAlign = TextAlign.Center
                    )
                }
            } else {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .verticalScroll(rememberScrollState())
                        .padding(horizontal = 20.dp, vertical = 6.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    filteredConnections.forEach { record ->
                        val profile = lookupProfile(record)
                        if (profile != null) {
                            ConnectionCard(
                                record = record,
                                profile = profile,
                                selectedSubTab = selectedSubTab,
                                onAccept = { handleAccept(record) },
                                onDecline = { handleDecline(record) },
                                onChat = { activeChatProfile = profile }
                            )
                        }
                    }
                    Spacer(modifier = Modifier.height(24.dp))
                }
            }
        }
    }

    // Chat detail screen dialog when Chat is clicked
    if (activeChatProfile != null) {
        ChatDetailScreen(
            profile = activeChatProfile!!,
            session = session,
            onDismiss = { activeChatProfile = null }
        )
    }
}

@Composable
fun ConnectionCard(
    record: ConnectionRecord,
    profile: Profile,
    selectedSubTab: Int,
    onAccept: () -> Unit,
    onDecline: () -> Unit,
    onChat: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .background(Color.White.copy(alpha = 0.18f))
            .border(1.dp, Color.White.copy(alpha = 0.25f), RoundedCornerShape(16.dp))
            .padding(14.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        // Avatar
        Box(
            contentAlignment = Alignment.Center,
            modifier = Modifier
                .size(52.dp)
                .clip(CircleShape)
                .background(DeepMaroon)
        ) {
            if (!profile.img.isNullOrEmpty()) {
                val imageUrl = if (profile.img.startsWith("http")) profile.img else "https://shreerajputsagaisambandh.com/images/${profile.img}.png"
                AsyncImage(
                    model = imageUrl,
                    contentDescription = profile.name,
                    contentScale = ContentScale.Crop,
                    modifier = Modifier.fillMaxSize()
                )
            } else {
                Text(
                    text = profile.name.take(1),
                    color = LightGold,
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold
                )
            }
        }

        Spacer(modifier = Modifier.width(14.dp))

        // Profile Info
        Column(modifier = Modifier.weight(1f)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    text = profile.name,
                    color = Color.White,
                    fontSize = 15.sp,
                    fontWeight = FontWeight.Bold
                )
                if (profile.isVerified) {
                    Spacer(modifier = Modifier.width(4.dp))
                    Icon(
                        imageVector = Icons.Default.Verified,
                        contentDescription = "Verified",
                        tint = VerifiedBlue,
                        modifier = Modifier.size(13.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(2.dp))

            Text(
                text = "${profile.clan} Clan • ${profile.gotra} Gotra",
                color = Color.White.copy(alpha = 0.85f),
                fontSize = 12.sp,
                fontWeight = FontWeight.Medium
            )

            Text(
                text = "Native: ${profile.thikana}",
                color = LightGold,
                fontSize = 11.sp
            )
        }

        Spacer(modifier = Modifier.width(10.dp))

        // Action Buttons based on subtab
        when (selectedSubTab) {
            0 -> {
                // Received: Decline & Accept
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    // Decline Button
                    Box(
                        contentAlignment = Alignment.Center,
                        modifier = Modifier
                            .size(36.dp)
                            .clip(CircleShape)
                            .background(Color.White.copy(alpha = 0.18f))
                            .clickable(onClick = onDecline)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Close,
                            contentDescription = "Decline",
                            tint = DislikeRed,
                            modifier = Modifier.size(18.dp)
                        )
                    }

                    // Accept Button
                    Box(
                        contentAlignment = Alignment.Center,
                        modifier = Modifier
                            .size(36.dp)
                            .clip(CircleShape)
                            .background(LightGold)
                            .clickable(onClick = onAccept)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Check,
                            contentDescription = "Accept",
                            tint = RoyalMaroon,
                            modifier = Modifier.size(20.dp)
                        )
                    }
                }
            }
            1 -> {
                // Accepted: Chat Button
                Row(
                    modifier = Modifier
                        .clip(CircleShape)
                        .background(LightGold)
                        .clickable(onClick = onChat)
                        .padding(horizontal = 14.dp, vertical = 7.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = Icons.Default.Message,
                        contentDescription = "Chat",
                        tint = RoyalMaroon,
                        modifier = Modifier.size(13.dp)
                    )
                    Spacer(modifier = Modifier.width(5.dp))
                    Text(
                        text = "Chat",
                        color = RoyalMaroon,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
            else -> {
                // Sent: Pending pill badge
                Box(
                    modifier = Modifier
                        .clip(CircleShape)
                        .background(Color.White.copy(alpha = 0.2f))
                        .padding(horizontal = 10.dp, vertical = 5.dp)
                ) {
                    Text(
                        text = "Pending",
                        color = Color.White,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.SemiBold
                    )
                }
            }
        }
    }
}
