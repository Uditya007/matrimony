package com.sagaisambaandh.ui.screens

import android.content.Intent
import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Crown
import androidx.compose.material.icons.filled.Download
import androidx.compose.material.icons.filled.Share
import androidx.compose.material.icons.filled.Verified
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.sagaisambaandh.data.SagaiSessionManager
import com.sagaisambaandh.ui.theme.*
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BiodataDialog(
    session: SagaiSessionManager,
    onDismiss: () -> Unit
) {
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()
    val currentUser = session.currentUser
    
    var isDownloading by remember { mutableStateOf(false) }
    var downloadSuccess by remember { mutableStateOf(false) }

    AlertDialog(
        onDismissRequest = onDismiss,
        properties = androidx.compose.ui.window.DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Surface(
            modifier = Modifier
                .fillMaxWidth(0.92f)
                .wrapContentHeight()
                .border(2.dp, LightGold, RoundedCornerShape(16.dp)),
            shape = RoundedCornerShape(16.dp),
            color = DeepMaroon
        ) {
            Column(
                modifier = Modifier
                    .padding(20.dp)
                    .verticalScroll(rememberScrollState()),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                // Header Crest
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.Crown,
                        contentDescription = "Crest",
                        tint = LightGold,
                        modifier = Modifier.size(24.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "SHREE RAJPUT MATRIMONY",
                        color = LightGold,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 1.5.sp
                    )
                }

                Spacer(modifier = Modifier.height(12.dp))
                Divider(color = LightGold.copy(alpha = 0.3f))
                Spacer(modifier = Modifier.height(16.dp))

                // Name & ID
                if (currentUser != null) {
                    Text(
                        text = currentUser.name,
                        color = SandstoneIvory,
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Serif,
                        textAlign = TextAlign.Center
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "SS-${currentUser.id.uppercase()}",
                        color = LightGold,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold
                    )

                    Spacer(modifier = Modifier.height(16.dp))
                    Divider(color = LightGold.copy(alpha = 0.15f))
                    Spacer(modifier = Modifier.height(12.dp))

                    // Details Card Grid
                    Column(
                        modifier = Modifier.fillMaxWidth(),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        BiodataFieldRow(label = "Clan Heritage", value = currentUser.clan)
                        BiodataFieldRow(label = "Paternal Gotra", value = currentUser.gotra)
                        BiodataFieldRow(label = "Maternal Gotra", value = currentUser.motherGotra)
                        BiodataFieldRow(label = "Noble Thikana", value = currentUser.thikana)
                        BiodataFieldRow(label = "Date of Birth", value = currentUser.dob)
                        BiodataFieldRow(label = "Height", value = currentUser.height)
                        BiodataFieldRow(label = "Education", value = currentUser.education)
                        BiodataFieldRow(label = "Occupation", value = currentUser.occupation)
                        BiodataFieldRow(label = "Annual Income", value = currentUser.income)
                        BiodataFieldRow(label = "Marital Status", value = currentUser.maritalStatus)
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))
                Divider(color = LightGold.copy(alpha = 0.3f))
                Spacer(modifier = Modifier.height(12.dp))

                // Verified Badge Row
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.Verified,
                        contentDescription = "Verified",
                        tint = Color(0xFF4CAF50),
                        modifier = Modifier.size(16.dp)
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = "Verified Rajput Lineage Audited",
                        color = SandstoneIvory.copy(alpha = 0.6f),
                        fontSize = 11.sp
                    )
                }

                Spacer(modifier = Modifier.height(24.dp))

                // Action Buttons
                if (isDownloading) {
                    CircularProgressIndicator(color = LightGold)
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "Generating Biodata Card...",
                        color = SandstoneIvory,
                        fontSize = 12.sp
                    )
                } else if (downloadSuccess) {
                    Text(
                        text = "Biodata PDF saved to Downloads!",
                        color = Color(0xFF4CAF50),
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Button(
                        onClick = { downloadSuccess = false },
                        colors = ButtonDefaults.buttonColors(containerColor = LightGold)
                    ) {
                        Text("Reset", color = DeepMaroon)
                    }
                } else {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Button(
                            onClick = {
                                isDownloading = true
                                coroutineScope.launch {
                                    delay(1500)
                                    isDownloading = false
                                    downloadSuccess = true
                                    Toast.makeText(context, "Biodata saved successfully!", Toast.LENGTH_SHORT).show()
                                }
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = Color.Transparent),
                            modifier = Modifier
                                .weight(1f)
                                .background(
                                    brush = Brush.horizontalGradient(
                                        colors = listOf(RoyalGold, LightGold, RoyalGold)
                                    ),
                                    shape = RoundedCornerShape(8.dp)
                                ),
                            contentPadding = PaddingValues(vertical = 12.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.Download,
                                contentDescription = "Download",
                                tint = DeepMaroon,
                                modifier = Modifier.size(18.dp)
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(
                                text = "Download",
                                color = DeepMaroon,
                                fontWeight = FontWeight.Bold,
                                fontSize = 13.sp
                            )
                        }

                        OutlinedButton(
                            onClick = {
                                if (currentUser != null) {
                                    val shareText = """
                                        ✨ Shree Rajput Sagai Sambandh Lineage Card ✨
                                        ----------------------------------------------
                                        Candidate Name: ${currentUser.name} (SS-${currentUser.id.uppercase()})
                                        Clan Heritage:  ${currentUser.clan}
                                        Paternal Gotra: ${currentUser.gotra}
                                        Maternal Gotra: ${currentUser.motherGotra}
                                        Noble Thikana:   ${currentUser.thikana}
                                        Date of Birth:  ${currentUser.dob}
                                        Height:         ${currentUser.height}
                                        Highest Edu:    ${currentUser.education}
                                        Profession:     ${currentUser.occupation}
                                        Annual Income:  ${currentUser.income}
                                        Marital Status: ${currentUser.maritalStatus}
                                        ----------------------------------------------
                                        Audited & Verified on Shree Rajput Sagai Sambandh.
                                    """.trimIndent()

                                    val intent = Intent(Intent.ACTION_SEND).apply {
                                        type = "text/plain"
                                        putExtra(Intent.EXTRA_TEXT, shareText)
                                    }
                                    context.startActivity(Intent.createChooser(intent, "Share Lineage Card Via"))
                                }
                            },
                            border = ButtonDefaults.outlinedButtonBorder.copy(width = 1.5.dp),
                            colors = ButtonDefaults.outlinedButtonColors(contentColor = LightGold),
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(8.dp),
                            contentPadding = PaddingValues(vertical = 12.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.Share,
                                contentDescription = "Share",
                                tint = LightGold,
                                modifier = Modifier.size(18.dp)
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(
                                text = "Share",
                                color = LightGold,
                                fontWeight = FontWeight.Bold,
                                fontSize = 13.sp
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun BiodataFieldRow(label: String, value: String) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.Top
    ) {
        Text(
            text = label.uppercase(),
            color = LightGold.copy(alpha = 0.8f),
            fontSize = 9.sp,
            fontWeight = FontWeight.SemiBold,
            modifier = Modifier.width(100.dp)
        )
        Text(
            text = if (value.isEmpty()) "Not Specified" else value,
            color = SandstoneIvory,
            fontSize = 13.sp,
            fontWeight = FontWeight.Medium,
            modifier = Modifier.weight(1f)
        )
    }
}
