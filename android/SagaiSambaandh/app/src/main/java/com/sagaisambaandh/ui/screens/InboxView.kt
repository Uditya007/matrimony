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
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.MailOutline
import androidx.compose.material.icons.filled.Message
import androidx.compose.material.icons.filled.Send
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.sagaisambaandh.data.Profile
import com.sagaisambaandh.data.SagaiSessionManager
import com.sagaisambaandh.ui.theme.*
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONArray
import org.json.JSONObject

data class ConnectionRecord(
    val sender_id: String,
    val receiver_id: String,
    val status: String
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun InboxView(
    session: SagaiSessionManager,
    modifier: Modifier = Modifier
) {
    var selectedSubTab by remember { mutableStateOf(0) } // 0 = Received, 1 = Accepted, 2 = Sent
    var connections by remember { mutableStateOf<List<ConnectionRecord>>(emptyList()) }
    var isLoading by remember { mutableStateOf(false) }
    var activeChatProfile by remember { mutableStateOf<Profile?>(null) }
    
    val user = session.currentUser.value
    val profiles = session.profiles.value

    fun loadConnections() {
        if (user == null) return
        isLoading = true
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val client = OkHttpClient()
                val url = "https://afbrznllcfgfcjuinnlf.supabase.co"
                val apiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmYnJ6bmxsY2ZnZmNqdWlubmxmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxMzY3MDMsImV4cCI6MjA5OTcxMjcwM30.manruSm0oxHES5Scyzs6NRFTpkVynZQKGT9B1ORPne0"
                
                val request = Request.Builder()
                    .url("$url/rest/v1/connections?or=(sender_id.eq.${user.id},receiver_id.eq.${user.id})")
                    .addHeader("apikey", apiKey)
                    .addHeader("Authorization", "Bearer $apiKey")
                    .build()
                
                val response = client.newCall(request).execute()
                val body = response.body?.string() ?: ""
                if (response.isSuccessful && body.isNotEmpty()) {
                    val arr = JSONArray(body)
                    val list = mutableListOf<ConnectionRecord>()
                    for (i in 0 until arr.length()) {
                        val obj = arr.getJSONObject(i)
                        list.add(
                            ConnectionRecord(
                                sender_id = obj.getString("sender_id"),
                                receiver_id = obj.getString("receiver_id"),
                                status = obj.getString("status")
                            )
                        )
                    }
                    CoroutineScope(Dispatchers.Main).launch {
                        connections = list
                        isLoading = false
                    }
                } else {
                    CoroutineScope(Dispatchers.Main).launch { isLoading = false }
                }
            } catch (e: Exception) {
                e.printStackTrace()
                CoroutineScope(Dispatchers.Main).launch { isLoading = false }
            }
        }
    }

    LaunchedEffect(user) {
        loadConnections()
    }

    val filtered = remember(connections, selectedSubTab, user) {
        if (user == null) return@remember emptyList<ConnectionRecord>()
        when (selectedSubTab) {
            0 -> connections.filter { it.receiver_id == user.id && it.status == "pending" }
            1 -> connections.filter { it.status == "accepted" }
            2 -> connections.filter { it.sender_id == user.id && it.status == "pending" }
            else -> emptyList()
        }
    }

    fun handleAccept(record: ConnectionRecord) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val client = OkHttpClient()
                val apiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmYnJ6bmxsY2ZnZmNqdWlubmxmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxMzY3MDMsImV4cCI6MjA5OTcxMjcwM30.manruSm0oxHES5Scyzs6NRFTpkVynZQKGT9B1ORPne0"
                
                // Get connection row ID
                val getRequest = Request.Builder()
                    .url("https://afbrznllcfgfcjuinnlf.supabase.co/rest/v1/connections?sender_id=eq.${record.sender_id}&receiver_id=eq.${record.receiver_id}")
                    .addHeader("apikey", apiKey)
                    .build()
                
                val getResponse = client.newCall(getRequest).execute()
                val getBody = getResponse.body?.string() ?: ""
                val rows = JSONArray(getBody)
                if (rows.length() > 0) {
                    val cid = rows.getJSONObject(0).getString("id")
                    
                    // Update connection row status to accepted
                    val mediaType = "application/json; charset=utf-8".toMediaType()
                    val updateJson = JSONObject().apply { put("status", "accepted") }
                    val updateRequest = Request.Builder()
                        .url("https://afbrznllcfgfcjuinnlf.supabase.co/rest/v1/connections?id=eq.$cid")
                        .addHeader("apikey", apiKey)
                        .addHeader("Authorization", "Bearer $apiKey")
                        .patch(updateJson.toString().toRequestBody(mediaType))
                        .build()
                    
                    client.newCall(updateRequest).execute()
                    CoroutineScope(Dispatchers.Main).launch { loadConnections() }
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    fun handleDecline(record: ConnectionRecord) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val client = OkHttpClient()
                val apiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmYnJ6bmxsY2ZnZmNqdWlubmxmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxMzY3MDMsImV4cCI6MjA5OTcxMjcwM30.manruSm0oxHES5Scyzs6NRFTpkVynZQKGT9B1ORPne0"
                
                val getRequest = Request.Builder()
                    .url("https://afbrznllcfgfcjuinnlf.supabase.co/rest/v1/connections?sender_id=eq.${record.sender_id}&receiver_id=eq.${record.receiver_id}")
                    .addHeader("apikey", apiKey)
                    .build()
                
                val getResponse = client.newCall(getRequest).execute()
                val getBody = getResponse.body?.string() ?: ""
                val rows = JSONArray(getBody)
                if (rows.length() > 0) {
                    val cid = rows.getJSONObject(0).getString("id")
                    
                    val mediaType = "application/json; charset=utf-8".toMediaType()
                    val updateJson = JSONObject().apply { put("status", "rejected") }
                    val updateRequest = Request.Builder()
                        .url("https://afbrznllcfgfcjuinnlf.supabase.co/rest/v1/connections?id=eq.$cid")
                        .addHeader("apikey", apiKey)
                        .addHeader("Authorization", "Bearer $apiKey")
                        .patch(updateJson.toString().toRequestBody(mediaType))
                        .build()
                    
                    client.newCall(updateRequest).execute()
                    CoroutineScope(Dispatchers.Main).launch { loadConnections() }
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    if (activeChatProfile != null) {
        ChatDetailModal(
            profile = activeChatProfile!!,
            onBack = { activeChatProfile = null }
        )
    } else {
        Column(
            modifier = modifier
                .fillMaxSize()
                .background(MaterialTheme.colorScheme.background)
        ) {
            CenterAlignedTopAppBar(
                title = {
                    Text(
                        text = "Inbox & Connections",
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
                selectedTabIndex = selectedSubTab,
                containerColor = DeepMaroon,
                contentColor = LightGold,
                divider = {},
                modifier = Modifier.fillMaxWidth()
            ) {
                Tab(selected = selectedSubTab == 0, onClick = { selectedSubTab = 0 }) {
                    Text(
                        text = "Received",
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold,
                        color = if (selectedSubTab == 0) LightGold else SandstoneIvory.copy(alpha = 0.6f),
                        modifier = Modifier.padding(vertical = 12.dp)
                    )
                }
                Tab(selected = selectedSubTab == 1, onClick = { selectedSubTab = 1 }) {
                    Text(
                        text = "Accepted",
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold,
                        color = if (selectedSubTab == 1) LightGold else SandstoneIvory.copy(alpha = 0.6f),
                        modifier = Modifier.padding(vertical = 12.dp)
                    )
                }
                Tab(selected = selectedSubTab == 2, onClick = { selectedSubTab = 2 }) {
                    Text(
                        text = "Sent",
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold,
                        color = if (selectedSubTab == 2) LightGold else SandstoneIvory.copy(alpha = 0.6f),
                        modifier = Modifier.padding(vertical = 12.dp)
                    )
                }
            }

            if (isLoading) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = RoyalGold)
                }
            } else if (filtered.isEmpty()) {
                // Empty state
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .weight(1f)
                        .padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center
                ) {
                    Box(
                        modifier = Modifier
                            .size(100.dp)
                            .background(DeepMaroon, shape = CircleShape),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.MailOutline,
                            contentDescription = null,
                            tint = LightGold,
                            modifier = Modifier.size(48.dp)
                        )
                    }
                    Spacer(modifier = Modifier.height(24.dp))
                    Text(
                        text = if (selectedSubTab == 0) "No Pending Requests" else (if (selectedSubTab == 1) "No Active Connections" else "No Sent Requests"),
                        color = LightGold,
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Serif,
                        textAlign = TextAlign.Center
                    )
                    Spacer(modifier = Modifier.height(10.dp))
                    Text(
                        text = "Lineage compatibility checks are run in real-time. Invite other members to connect and establish family trust.",
                        color = SandstoneIvory.copy(alpha = 0.7f),
                        fontSize = 13.sp,
                        lineHeight = 18.sp,
                        textAlign = TextAlign.Center,
                        modifier = Modifier.padding(horizontal = 16.dp)
                    )
                }
            } else {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .verticalScroll(rememberScrollState())
                        .padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    filtered.forEach { record ->
                        val targetId = if (record.sender_id == user?.id) record.receiver_id else record.sender_id
                        val matchProfile = profiles.firstOrNull { it.id == targetId }
                        if (matchProfile != null) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .background(DeepMaroon, shape = RoundedCornerShape(12.dp))
                                    .border(1.dp, RoyalGold.copy(alpha = 0.25f), RoundedCornerShape(12.dp))
                                    .padding(12.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Box(
                                    contentAlignment = Alignment.Center,
                                    modifier = Modifier
                                        .size(54.dp)
                                        .background(RoyalGold, shape = CircleShape)
                                ) {
                                    Text(
                                        text = matchProfile.name.take(1),
                                        color = DeepMaroon,
                                        fontSize = 20.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                                Spacer(modifier = Modifier.width(16.dp))
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        text = matchProfile.name,
                                        color = LightGold,
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 16.sp
                                    )
                                    Text(
                                        text = "${matchProfile.clan} Clan • ${matchProfile.gotra} Gotra",
                                        color = SandstoneIvory,
                                        fontSize = 12.sp
                                    )
                                    Text(
                                        text = "Native: ${matchProfile.thikana}",
                                        color = SandstoneIvory.copy(alpha = 0.6f),
                                        fontSize = 11.sp
                                    )
                                }
                                if (selectedSubTab == 0) {
                                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                        Icon(
                                            imageVector = Icons.Default.Close,
                                            contentDescription = "Decline",
                                            tint = Color.Red,
                                            modifier = Modifier
                                                .size(28.dp)
                                                .clickable { handleDecline(record) }
                                        )
                                        Icon(
                                            imageVector = Icons.Default.CheckCircle,
                                            contentDescription = "Accept",
                                            tint = Color.Green,
                                            modifier = Modifier
                                                .size(28.dp)
                                                .clickable { handleAccept(record) }
                                        )
                                    }
                                } else if (selectedSubTab == 1) {
                                    Button(
                                        onClick = { activeChatProfile = matchProfile },
                                        colors = ButtonDefaults.buttonColors(containerColor = RoyalGold),
                                        shape = RoundedCornerShape(12.dp),
                                        contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)
                                    ) {
                                        Icon(
                                            imageVector = Icons.Default.Message,
                                            contentDescription = "Chat",
                                            tint = DeepMaroon,
                                            modifier = Modifier.size(14.dp)
                                        )
                                        Spacer(modifier = Modifier.width(4.dp))
                                        Text("Chat", color = DeepMaroon, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                    }
                                } else {
                                    Text(
                                        text = "Pending",
                                        color = RoyalGold,
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Bold,
                                        modifier = Modifier
                                            .background(RoyalGold.copy(alpha = 0.12f), RoundedCornerShape(8.dp))
                                            .padding(horizontal = 8.dp, vertical = 4.dp)
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
fun ChatDetailModal(
    profile: Profile,
    onBack: () -> Unit
) {
    var messageText by remember { mutableStateOf("") }
    val messages = remember { mutableStateListOf<String>() }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(DeepMaroon)
    ) {
        // Chat Header
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .background(DeepMaroon)
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = Icons.Default.ArrowBack,
                contentDescription = "Back",
                tint = LightGold,
                modifier = Modifier
                    .size(24.dp)
                    .clickable { onBack() }
            )
            Spacer(modifier = Modifier.width(16.dp))
            Box(
                contentAlignment = Alignment.Center,
                modifier = Modifier
                    .size(36.dp)
                    .background(RoyalGold, shape = CircleShape)
            ) {
                Text(
                    text = profile.name.take(1),
                    color = DeepMaroon,
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold
                )
            }
            Spacer(modifier = Modifier.width(12.dp))
            Column {
                Text(
                    text = profile.name,
                    color = LightGold,
                    fontWeight = FontWeight.Bold,
                    fontSize = 16.sp
                )
                Text(
                    text = "Online",
                    color = Color.Green,
                    fontSize = 10.sp
                )
            }
        }

        // Message Feed area
        Column(
            modifier = Modifier
                .weight(1f)
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(RoyalGold.copy(alpha = 0.08f), RoundedCornerShape(10.dp))
                    .padding(12.dp)
            ) {
                Text(
                    text = "Lineage check verified! You are now connected with ${profile.name}. Say hello!",
                    color = RoyalGold,
                    fontSize = 12.sp,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.fillMaxWidth()
                )
            }

            messages.forEach { msg ->
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.End
                ) {
                    Box(
                        modifier = Modifier
                            .background(RoyalGold, RoundedCornerShape(16.dp))
                            .padding(horizontal = 16.dp, vertical = 8.dp)
                    ) {
                        Text(
                            text = msg,
                            color = DeepMaroon,
                            fontSize = 14.sp
                        )
                    }
                }
            }
        }

        // Input Row
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .background(DeepMaroon)
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            OutlinedTextField(
                value = messageText,
                onValueChange = { messageText = it },
                placeholder = { Text("Write noble message...", color = Color.Gray) },
                colors = OutlinedTextFieldDefaults.colors(
                    focusedTextColor = Color.Black,
                    unfocusedTextColor = Color.Black,
                    focusedContainerColor = CardBackground,
                    unfocusedContainerColor = CardBackground
                ),
                shape = RoundedCornerShape(20.dp),
                modifier = Modifier.weight(1f)
            )
            Spacer(modifier = Modifier.width(12.dp))
            IconButton(
                onClick = {
                    if (messageText.trim().isNotEmpty()) {
                        messages.add(messageText)
                        messageText = ""
                    }
                }
            ) {
                Icon(
                    imageVector = Icons.Default.Send,
                    contentDescription = "Send",
                    tint = RoyalGold,
                    modifier = Modifier.size(24.dp)
                )
            }
        }
    }
}
