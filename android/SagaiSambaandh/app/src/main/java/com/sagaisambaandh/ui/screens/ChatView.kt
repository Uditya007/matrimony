package com.sagaisambaandh.ui.screens

import android.content.Intent
import android.net.Uri
import androidx.compose.animation.*
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import coil.compose.AsyncImage
import com.sagaisambaandh.data.Profile
import com.sagaisambaandh.data.SagaiSessionManager
import com.sagaisambaandh.data.SupabaseMessage
import com.sagaisambaandh.data.User
import com.sagaisambaandh.ui.components.RoyalBackground
import com.sagaisambaandh.ui.theme.*
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*

@Composable
fun ChatView(
    session: SagaiSessionManager,
    onNavigateToDiscover: () -> Unit = {},
    onNavigateToRegister: () -> Unit = {},
    modifier: Modifier = Modifier
) {
    var searchText by remember { mutableStateOf("") }
    var activeChatProfile by remember { mutableStateOf<Profile?>(null) }

    val currentUser = session.currentUser.value
    val profiles = session.profiles.value
    val connections = session.connectionsList.value

    // Auto poll messages & connections
    LaunchedEffect(currentUser?.id) {
        session.refreshCurrentUserAbout()
        currentUser?.id?.let {
            session.fetchConnectionsAndGenerateNotifications(it)
        }
        while (true) {
            delay(4000)
            session.refreshCurrentUserAbout()
        }
    }

    // Connected profiles (accepted connections)
    val connectedProfiles = remember(profiles, connections, currentUser?.id) {
        val currentUserId = currentUser?.id ?: return@remember emptyList<Profile>()
        val acceptedPartnerIds = connections.filter { it.status == "accepted" }
            .map { if (it.sender_id == currentUserId) it.receiver_id else it.sender_id }
            .toSet()
        profiles.filter { acceptedPartnerIds.contains(it.id) }
    }

    // Conversation profiles filtered by search
    val conversationProfiles = remember(connectedProfiles, searchText) {
        if (searchText.isEmpty()) {
            connectedProfiles
        } else {
            connectedProfiles.filter {
                it.name.contains(searchText, ignoreCase = true) ||
                it.clan.contains(searchText, ignoreCase = true) ||
                it.gotra.contains(searchText, ignoreCase = true)
            }
        }
    }

    RoyalBackground(modifier = modifier) {
        Column(modifier = Modifier.fillMaxSize()) {
            // Top Header Title
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp, vertical = 12.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Messages",
                    color = Color.White,
                    fontSize = 28.sp,
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.Serif
                )
            }

            // Clean Translucent Search Field
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp, vertical = 4.dp)
                    .clip(RoundedCornerShape(14.dp))
                    .background(Color.White.copy(alpha = 0.18f))
                    .border(1.dp, Color.White.copy(alpha = 0.25f), RoundedCornerShape(14.dp))
                    .padding(horizontal = 14.dp, vertical = 12.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    imageVector = Icons.Default.Search,
                    contentDescription = "Search",
                    tint = Color.White.copy(alpha = 0.75f),
                    modifier = Modifier.size(18.dp)
                )
                Spacer(modifier = Modifier.width(10.dp))
                Box(modifier = Modifier.weight(1f)) {
                    if (searchText.isEmpty()) {
                        Text(
                            text = "Search chats by name, gotra...",
                            color = Color.White.copy(alpha = 0.6f),
                            fontSize = 14.sp
                        )
                    }
                    BasicTextField(
                        value = searchText,
                        onValueChange = { searchText = it },
                        textStyle = TextStyle(color = Color.White, fontSize = 14.sp),
                        cursorBrush = SolidColor(LightGold),
                        modifier = Modifier.fillMaxWidth()
                    )
                }
                if (searchText.isNotEmpty()) {
                    Icon(
                        imageVector = Icons.Default.Close,
                        contentDescription = "Clear",
                        tint = Color.White.copy(alpha = 0.75f),
                        modifier = Modifier
                            .size(18.dp)
                            .clickable { searchText = "" }
                    )
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            // Main Content Area
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .verticalScroll(rememberScrollState())
                    .padding(bottom = 24.dp)
            ) {
                // 1. New Matches Horizontal Story Tray
                if (searchText.isEmpty() && connectedProfiles.isNotEmpty()) {
                    Text(
                        text = "New Matches",
                        color = LightGold,
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Serif,
                        modifier = Modifier.padding(horizontal = 20.dp, vertical = 4.dp)
                    )

                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .horizontalScroll(rememberScrollState())
                            .padding(horizontal = 20.dp, vertical = 6.dp),
                        horizontalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        connectedProfiles.forEach { profile ->
                            Column(
                                horizontalAlignment = Alignment.CenterHorizontally,
                                modifier = Modifier.clickable { activeChatProfile = profile }
                            ) {
                                Box(modifier = Modifier.size(62.dp)) {
                                    // Avatar with gradient ring
                                    Box(
                                        contentAlignment = Alignment.Center,
                                        modifier = Modifier
                                            .size(62.dp)
                                            .clip(CircleShape)
                                            .border(
                                                2.2.dp,
                                                Brush.linearGradient(listOf(AppPrimary, StarPurple)),
                                                CircleShape
                                            )
                                    ) {
                                        AvatarImage(profile = profile, size = 54)
                                    }

                                    // Online green indicator dot
                                    Box(
                                        modifier = Modifier
                                            .size(13.dp)
                                            .clip(CircleShape)
                                            .background(SuccessGreen)
                                            .border(2.dp, Color.White, CircleShape)
                                            .align(Alignment.BottomEnd)
                                    )
                                }
                                Spacer(modifier = Modifier.height(6.dp))
                                Text(
                                    text = profile.name.split(" ").firstOrNull() ?: profile.name,
                                    color = Color.White,
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis,
                                    modifier = Modifier.width(64.dp),
                                    textAlign = TextAlign.Center
                                )
                            }
                        }
                    }

                    Divider(
                        color = Color.White.copy(alpha = 0.2f),
                        thickness = 1.dp,
                        modifier = Modifier.padding(horizontal = 20.dp, vertical = 8.dp)
                    )
                }

                // 2. Conversations Section
                Text(
                    text = if (searchText.isEmpty()) "Conversations" else "Results",
                    color = LightGold,
                    fontSize = 15.sp,
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.Serif,
                    modifier = Modifier.padding(horizontal = 20.dp, vertical = 4.dp)
                )

                if (conversationProfiles.isEmpty()) {
                    // Empty Chats State
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp, vertical = 8.dp)
                            .clip(RoundedCornerShape(18.dp))
                            .background(Color.White.copy(alpha = 0.18f))
                            .border(1.dp, Color.White.copy(alpha = 0.25f), RoundedCornerShape(18.dp))
                            .padding(24.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.spacedBy(14.dp)
                        ) {
                            Box(
                                contentAlignment = Alignment.Center,
                                modifier = Modifier
                                    .size(72.dp)
                                    .background(Color.White.copy(alpha = 0.15f), shape = CircleShape)
                            ) {
                                Icon(
                                    imageVector = if (currentUser == null) Icons.Default.Shield else Icons.Default.ChatBubble,
                                    contentDescription = null,
                                    tint = LightGold,
                                    modifier = Modifier.size(32.dp)
                                )
                            }

                            Text(
                                text = if (currentUser == null) "Sign In to Access Real Chats" else "No Active Conversations Yet",
                                color = Color.White,
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Bold,
                                fontFamily = FontFamily.Serif,
                                textAlign = TextAlign.Center
                            )

                            Text(
                                text = if (currentUser == null) "Log in to chat in real-time with verified Rajput brides and grooms across the web and app." else "Express a Rishta in Discover or accept connection requests to start real-time messaging.",
                                color = Color.White.copy(alpha = 0.85f),
                                fontSize = 13.sp,
                                textAlign = TextAlign.Center,
                                modifier = Modifier.padding(horizontal = 20.dp)
                            )

                            Button(
                                onClick = {
                                    if (currentUser == null) onNavigateToRegister()
                                    else onNavigateToDiscover()
                                },
                                colors = ButtonDefaults.buttonColors(containerColor = LightGold),
                                shape = CircleShape
                            ) {
                                Text(
                                    text = if (currentUser == null) "Log In / Register" else "Explore Discover Deck",
                                    color = RoyalMaroon,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 13.5.sp
                                )
                            }
                        }
                    }
                } else {
                    // Conversations List (Translucent Frosted Card Container)
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp, vertical = 6.dp)
                            .clip(RoundedCornerShape(16.dp))
                            .background(Color.White.copy(alpha = 0.18f))
                            .border(1.dp, Color.White.copy(alpha = 0.25f), RoundedCornerShape(16.dp))
                    ) {
                        conversationProfiles.forEachIndexed { index, profile ->
                            ConversationRow(
                                profile = profile,
                                session = session,
                                onClick = { activeChatProfile = profile }
                            )

                            if (index < conversationProfiles.size - 1) {
                                Divider(
                                    color = Color.White.copy(alpha = 0.18f),
                                    thickness = 1.dp,
                                    modifier = Modifier.padding(start = 84.dp, end = 20.dp)
                                )
                            }
                        }
                    }
                }
            }
        }
    }

    // Chat Detail Dialog
    if (activeChatProfile != null) {
        ChatDetailScreen(
            profile = activeChatProfile!!,
            session = session,
            onDismiss = { activeChatProfile = null }
        )
    }
}

@Composable
fun ConversationRow(
    profile: Profile,
    session: SagaiSessionManager,
    onClick: () -> Unit
) {
    val currentUser = session.currentUser.value
    val lastMsg = remember(currentUser?.about, profile.about) {
        if (currentUser != null) {
            session.getLastMessage(currentUser.about, currentUser.id, profile.about, profile.id)
        } else null
    }

    val isUnread = lastMsg != null && lastMsg.senderId != currentUser?.id

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .padding(horizontal = 16.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        // Avatar with online green dot
        Box(modifier = Modifier.size(54.dp)) {
            AvatarImage(profile = profile, size = 54)
            Box(
                modifier = Modifier
                    .size(12.dp)
                    .clip(CircleShape)
                    .background(SuccessGreen)
                    .border(2.dp, Color.White, CircleShape)
                    .align(Alignment.BottomEnd)
            )
        }

        Spacer(modifier = Modifier.width(14.dp))

        // Name, Snippet, Timestamp
        Column(modifier = Modifier.weight(1f)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = profile.name,
                        color = Color.White,
                        fontSize = 15.5.sp,
                        fontWeight = if (isUnread) FontWeight.Bold else FontWeight.SemiBold,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
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

                if (lastMsg != null && lastMsg.time > 0) {
                    val date = Date(lastMsg.time.toLong())
                    val fmt = SimpleDateFormat("h:mm a", Locale.getDefault())
                    Text(
                        text = fmt.format(date),
                        color = if (isUnread) LightGold else Color.White.copy(alpha = 0.75f),
                        fontSize = 11.5.sp,
                        fontWeight = if (isUnread) FontWeight.Bold else FontWeight.Normal
                    )
                }
            }

            Spacer(modifier = Modifier.height(3.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                if (lastMsg != null) {
                    val prefix = if (lastMsg.senderId == currentUser?.id) "You: " else ""
                    Text(
                        text = "$prefix${lastMsg.text}",
                        color = if (isUnread) Color.White else Color.White.copy(alpha = 0.85f),
                        fontSize = 13.5.sp,
                        fontWeight = if (isUnread) FontWeight.SemiBold else FontWeight.Normal,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                        modifier = Modifier.weight(1f)
                    )
                } else {
                    Text(
                        text = "Connected. Tap to message!",
                        color = LightGold,
                        fontSize = 13.sp,
                        fontStyle = androidx.compose.ui.text.font.FontStyle.Italic,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                        modifier = Modifier.weight(1f)
                    )
                }

                if (isUnread) {
                    Spacer(modifier = Modifier.width(6.dp))
                    Box(
                        modifier = Modifier
                            .size(8.dp)
                            .background(LightGold, shape = CircleShape)
                    )
                }
            }
        }
    }
}

@Composable
fun AvatarImage(profile: Profile, size: Int) {
    com.sagaisambaandh.ui.components.AvatarImageView(
        source = profile.img,
        name = profile.name,
        clan = profile.clan,
        contentDescription = profile.name,
        contentScale = ContentScale.Crop,
        fallbackFontSize = (size * 0.38).sp,
        modifier = Modifier
            .size(size.dp)
            .clip(CircleShape)
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ChatDetailScreen(
    profile: Profile,
    session: SagaiSessionManager,
    onDismiss: () -> Unit
) {
    val currentUser = session.currentUser.value
    var messageText by remember { mutableStateOf("") }
    var isSending by remember { mutableStateOf(false) }
    val context = LocalContext.current

    val quickChips = listOf(
        "Khammaghani Sa 🙏",
        "Seeking gotra & lineage compatibility",
        "Our family sends noble regards",
        "Could you please share your ancestral biodata?"
    )

    val listState = rememberLazyListState()
    val coroutineScope = rememberCoroutineScope()

    // Real-time messages list calculation
    val messages = remember(currentUser?.about, profile.about) {
        if (currentUser != null) {
            session.getCombinedConversation(currentUser.about, currentUser.id, profile.about, profile.id)
        } else emptyList()
    }

    LaunchedEffect(messages.size) {
        if (messages.isNotEmpty()) {
            listState.animateScrollToItem(messages.size - 1)
        }
    }

    // Polling for incoming messages
    LaunchedEffect(profile.id) {
        while (true) {
            delay(2500)
            session.refreshCurrentUserAbout()
            session.fetchProfileAbout(profile.id) { updatedAbout ->
                if (updatedAbout != null) {
                    val index = session.profiles.value.indexOfFirst { it.id == profile.id }
                    if (index >= 0) {
                        val currentProfiles = session.profiles.value.toMutableList()
                        currentProfiles[index] = currentProfiles[index].copy(about = updatedAbout)
                    }
                }
            }
        }
    }

    fun handleSendMessage() {
        if (currentUser == null || messageText.trim().isEmpty() || isSending) return
        val textToSend = messageText
        messageText = ""
        isSending = true
        session.sendMessage(currentUser, profile, textToSend) {
            isSending = false
            session.refreshCurrentUserAbout()
        }
    }

    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Surface(
            modifier = Modifier.fillMaxSize(),
            color = Color.White
        ) {
            Column(modifier = Modifier.fillMaxSize()) {
                // Header Bar
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(Color.White)
                        .padding(horizontal = 14.dp, vertical = 10.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    IconButton(onClick = onDismiss) {
                        Icon(
                            imageVector = Icons.Default.ArrowBack,
                            contentDescription = "Back",
                            tint = Color.Black
                        )
                    }

                    AvatarImage(profile = profile, size = 42)

                    Spacer(modifier = Modifier.width(10.dp))

                    Column(modifier = Modifier.weight(1f)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(
                                text = profile.name,
                                color = Color.Black,
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Bold,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
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
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier
                                    .size(6.dp)
                                    .background(SuccessGreen, shape = CircleShape)
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(
                                text = "${profile.clan} Clan • Online",
                                color = Color.Gray,
                                fontSize = 11.5.sp
                            )
                        }
                    }

                    // Direct Phone Call Button if connected/unlocked
                    val canCall = session.areConnected(profile.id) || session.isUnlocked(profile.id)
                    if (canCall) {
                        IconButton(
                            onClick = {
                                val phone = "9829012345"
                                val intent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:$phone"))
                                context.startActivity(intent)
                            }
                        ) {
                            Box(
                                contentAlignment = Alignment.Center,
                                modifier = Modifier
                                    .size(36.dp)
                                    .background(AppPrimary.copy(alpha = 0.1f), shape = CircleShape)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Phone,
                                    contentDescription = "Call",
                                    tint = AppPrimary,
                                    modifier = Modifier.size(18.dp)
                                )
                            }
                        }
                    }
                }

                Divider(color = Color(0xFFEEEEEE), thickness = 1.dp)

                // Trust & Lineage Pill
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 10.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Row(
                        modifier = Modifier
                            .clip(CircleShape)
                            .background(Color(0xFFF7F7F9))
                            .padding(horizontal = 14.dp, vertical = 6.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Default.Shield,
                            contentDescription = "Trust",
                            tint = AppPrimary,
                            modifier = Modifier.size(12.dp)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = "End-to-End Rajput Verified Dialogue • Synced",
                            color = Color.DarkGray,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.SemiBold
                        )
                    }
                }

                // Messages Scroll List
                LazyColumn(
                    state = listState,
                    modifier = Modifier
                        .fillMaxWidth()
                        .weight(1f)
                        .padding(horizontal = 16.dp, vertical = 8.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    if (messages.isEmpty()) {
                        item {
                            Column(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 40.dp),
                                horizontalAlignment = Alignment.CenterHorizontally
                            ) {
                                Text(
                                    text = "No messages yet",
                                    color = Color.Black,
                                    fontSize = 14.sp,
                                    fontWeight = FontWeight.Bold
                                )
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(
                                    text = "Say hello to ${profile.name.split(" ").firstOrNull() ?: profile.name}!",
                                    color = Color.Gray,
                                    fontSize = 12.sp
                                )
                            }
                        }
                    }

                    items(messages) { msg ->
                        val isMe = msg.senderId == currentUser?.id
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = if (isMe) Arrangement.End else Arrangement.Start
                        ) {
                            Column(
                                horizontalAlignment = if (isMe) Alignment.End else Alignment.Start,
                                modifier = Modifier.widthIn(max = 280.dp)
                            ) {
                                Box(
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(18.dp))
                                        .background(
                                            if (isMe) {
                                                Brush.linearGradient(listOf(AppPrimary, AppSecondary))
                                            } else {
                                                Brush.linearGradient(listOf(Color(0xFFF0F1F5), Color(0xFFF0F1F5)))
                                            }
                                        )
                                        .padding(horizontal = 15.dp, vertical = 10.dp)
                                ) {
                                    Text(
                                        text = msg.text,
                                        color = if (isMe) Color.White else Color.Black,
                                        fontSize = 14.5.sp
                                    )
                                }

                                if (msg.time > 0) {
                                    val date = Date(msg.time.toLong())
                                    val fmt = SimpleDateFormat("h:mm a", Locale.getDefault())
                                    Text(
                                        text = fmt.format(date),
                                        color = Color.Gray,
                                        fontSize = 10.sp,
                                        modifier = Modifier.padding(top = 2.dp, start = 4.dp, end = 4.dp)
                                    )
                                }
                            }
                        }
                    }
                }

                // Quick reply chips
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .horizontalScroll(rememberScrollState())
                        .padding(horizontal = 14.dp, vertical = 6.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    quickChips.forEach { chip ->
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(14.dp))
                                .background(Color(0xFFF7F7F9))
                                .border(1.dp, Color(0xFFE5E7EB), RoundedCornerShape(14.dp))
                                .clickable { messageText = chip }
                                .padding(horizontal = 14.dp, vertical = 7.dp)
                        ) {
                            Text(text = chip, color = Color.Black, fontSize = 12.sp)
                        }
                    }
                }

                // Input Bar
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(Color.White)
                        .padding(horizontal = 14.dp, vertical = 10.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .clip(RoundedCornerShape(22.dp))
                            .background(Color(0xFFF4F5F7))
                            .padding(horizontal = 16.dp, vertical = 11.dp)
                    ) {
                        if (messageText.isEmpty()) {
                            Text(
                                text = "Type a message...",
                                color = Color.Gray,
                                fontSize = 14.sp
                            )
                        }
                        BasicTextField(
                            value = messageText,
                            onValueChange = { messageText = it },
                            textStyle = TextStyle(color = Color.Black, fontSize = 14.sp),
                            modifier = Modifier.fillMaxWidth()
                        )
                    }

                    Spacer(modifier = Modifier.width(10.dp))

                    IconButton(
                        onClick = { handleSendMessage() },
                        enabled = messageText.trim().isNotEmpty() && !isSending,
                        modifier = Modifier
                            .size(42.dp)
                            .clip(CircleShape)
                            .background(
                                Brush.linearGradient(listOf(AppPrimary, AppSecondary))
                            )
                    ) {
                        if (isSending) {
                            CircularProgressIndicator(color = Color.White, modifier = Modifier.size(18.dp), strokeWidth = 2.dp)
                        } else {
                            Icon(
                                imageVector = Icons.Default.Send,
                                contentDescription = "Send",
                                tint = Color.White,
                                modifier = Modifier.size(18.dp)
                            )
                        }
                    }
                }
            }
        }
    }
}
