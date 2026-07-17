package com.sagaisambaandh.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Email
import androidx.compose.material.icons.filled.MailOutline
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.sagaisambaandh.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun InboxView(modifier: Modifier = Modifier) {
    var selectedSubTab by remember { mutableStateOf(0) } // 0 = Received, 1 = Accepted, 2 = Sent

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
    ) {
        // Top Toolbar
        CenterAlignedTopAppBar(
            title = {
                Text(
                    text = "Inbox",
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
            Tab(
                selected = selectedSubTab == 0,
                onClick = { selectedSubTab = 0 }
            ) {
                Text(
                    text = "Received",
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold,
                    color = if (selectedSubTab == 0) LightGold else SandstoneIvory.copy(alpha = 0.6f),
                    modifier = Modifier.padding(vertical = 12.dp)
                )
            }
            Tab(
                selected = selectedSubTab == 1,
                onClick = { selectedSubTab = 1 }
            ) {
                Text(
                    text = "Accepted",
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold,
                    color = if (selectedSubTab == 1) LightGold else SandstoneIvory.copy(alpha = 0.6f),
                    modifier = Modifier.padding(vertical = 12.dp)
                )
            }
            Tab(
                selected = selectedSubTab == 2,
                onClick = { selectedSubTab = 2 }
            ) {
                Text(
                    text = "Sent",
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold,
                    color = if (selectedSubTab == 2) LightGold else SandstoneIvory.copy(alpha = 0.6f),
                    modifier = Modifier.padding(vertical = 12.dp)
                )
            }
        }

        Spacer(modifier = Modifier.height(60.dp))

        // Empty State Content
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Box(
                modifier = Modifier
                    .size(100.dp)
                    .background(DeepMaroon, shape = RoundedCornerShape(50.dp)),
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
                text = "No Pending Requests",
                color = LightGold,
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold,
                fontFamily = FontFamily.Serif,
                textAlign = TextAlign.Center
            )

            Spacer(modifier = Modifier.height(10.dp))

            Text(
                text = "Want to increase your chances of finding a Match? Verify your Rajput lineage profile to build family trust.",
                color = SandstoneIvory.copy(alpha = 0.7f),
                fontSize = 13.sp,
                lineHeight = 18.sp,
                textAlign = TextAlign.Center,
                modifier = Modifier.padding(horizontal = 16.dp)
            )

            Spacer(modifier = Modifier.height(30.dp))

            Button(
                onClick = { /* Launch verification flow */ },
                colors = ButtonDefaults.buttonColors(containerColor = RoyalGold),
                shape = RoundedCornerShape(8.dp),
                modifier = Modifier.width(200.dp)
            ) {
                Text(
                    text = "Verify Profile Now",
                    color = RoyalMaroon,
                    fontWeight = FontWeight.Bold,
                    fontSize = 14.sp
                )
            }
        }
    }
}
