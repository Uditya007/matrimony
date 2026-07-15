package com.sagaisambaandh.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Security
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.sagaisambaandh.data.Clan
import com.sagaisambaandh.data.MockData
import com.sagaisambaandh.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ClansView(
    modifier: Modifier = Modifier
) {
    var selectedClan by remember { mutableStateOf<Clan?>(null) }
    val sheetState = rememberModalBottomSheetState()
    var isSheetOpen by remember { mutableStateOf(false) }

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(SandstoneIvory.copy(alpha = 0.15f))
            .padding(16.dp)
    ) {
        // Header info
        Text(
            text = "Rajput Lineage Directory",
            color = RoyalMaroon,
            fontSize = 24.sp,
            fontWeight = FontWeight.Bold,
            fontFamily = FontFamily.Serif
        )
        Text(
            text = "Explore the historic clans, gotras, and dynasties of Rajasthan's royalty.",
            color = Color.Gray,
            fontSize = 13.sp,
            modifier = Modifier.padding(top = 4.dp, bottom = 16.dp)
        )

        // Lazy grid
        LazyVerticalGrid(
            columns = GridCells.Adaptive(150.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
            modifier = Modifier.weight(1f)
        ) {
            items(MockData.clans) { clan ->
                ClanCard(clan = clan) {
                    selectedClan = clan
                    isSheetOpen = true
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Heritage explanation banner
        Card(
            shape = RoundedCornerShape(12.dp),
            colors = CardDefaults.cardColors(containerColor = RoyalGold.copy(alpha = 0.05f)),
            modifier = Modifier.fillMaxWidth()
        ) {
            Row(
                modifier = Modifier.padding(16.dp),
                verticalAlignment = Alignment.Top
            ) {
                Icon(
                    imageVector = Icons.Default.Info,
                    contentDescription = null,
                    tint = RoyalGold,
                    modifier = Modifier.size(20.dp)
                )
                Spacer(modifier = Modifier.width(12.dp))
                Column {
                    Text(
                        text = "About Rajput Clans",
                        color = RoyalMaroon,
                        fontWeight = FontWeight.Bold,
                        fontSize = 12.sp
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "The Rajput community is historically divided into three major lineages (Vanshas): Suryavanshi, Chandravanshi, and Agnivanshi. Each clan holds native Thikanas which shape compatibility standards.",
                        color = Color.Gray,
                        fontSize = 11.sp,
                        lineHeight = 15.sp
                    )
                }
            }
        }

        // Detail sheet overlay
        if (isSheetOpen && selectedClan != null) {
            ModalBottomSheet(
                sheetState = sheetState,
                onDismissRequest = { isSheetOpen = false },
                containerColor = SandstoneIvory
            ) {
                ClanDetailContent(clan = selectedClan!!)
            }
        }
    }
}

@Composable
fun ClanCard(
    clan: Clan,
    onTap: () -> Unit
) {
    Card(
        shape = RoundedCornerShape(10.dp),
        colors = CardDefaults.cardColors(containerColor = CardBackground),
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onTap),
        border = CardDefaults.outlinedCardBorder().copy(
            brush = Brush.linearGradient(listOf(RoyalGold.copy(alpha = 0.1f), RoyalGold.copy(alpha = 0.3f)))
        )
    ) {
        Column(modifier = Modifier.fillMaxWidth()) {
            // Top card header banner
            Box(
                contentAlignment = Alignment.Center,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(90.dp)
                    .background(
                        Brush.linearGradient(
                            colors = listOf(RoyalMaroon, InkBrown)
                        )
                    )
            ) {
                Text(
                    text = clan.name.take(1),
                    color = SandstoneIvory.copy(alpha = 0.2f),
                    fontSize = 48.sp,
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.Serif
                )
            }

            // Text summary
            Column(modifier = Modifier.padding(10.dp)) {
                Text(
                    text = clan.name,
                    color = RoyalMaroon,
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.Serif
                )
                Text(
                    text = clan.dynasty,
                    color = RoyalGold,
                    fontWeight = FontWeight.Bold,
                    fontSize = 8.sp
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = clan.origin,
                    color = Color.Gray,
                    fontSize = 10.sp,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }
        }
    }
}

@Composable
fun ClanDetailContent(clan: Clan) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(24.dp)
    ) {
        Text(
            text = clan.name,
            color = RoyalMaroon,
            fontSize = 28.sp,
            fontWeight = FontWeight.Bold,
            fontFamily = FontFamily.Serif
        )
        Row(
            modifier = Modifier.padding(top = 4.dp, bottom = 16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = clan.dynasty,
                color = RoyalGold,
                fontWeight = FontWeight.Bold,
                fontSize = 11.sp
            )
            Spacer(modifier = Modifier.width(8.dp))
            Text(text = "•", color = Color.Gray)
            Spacer(modifier = Modifier.width(8.dp))
            Text(
                text = clan.origin,
                color = Color.Gray,
                fontSize = 13.sp
            )
        }

        Divider(color = RoyalGold.copy(alpha = 0.3f))
        Spacer(modifier = Modifier.height(16.dp))

        Text(
            text = "CLAN HISTORICAL PROFILE",
            fontSize = 11.sp,
            color = Color.Gray,
            fontWeight = FontWeight.Bold,
            letterSpacing = 1.5.sp
        )
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = clan.history,
            color = InkBrown,
            fontSize = 14.sp,
            lineHeight = 20.sp
        )

        Spacer(modifier = Modifier.height(24.dp))

        // Security seal tag
        Row(
            modifier = Modifier
                .background(RoyalGold.copy(alpha = 0.06f), shape = RoundedCornerShape(8.dp))
                .border(1.dp, RoyalGold.copy(alpha = 0.2f), RoundedCornerShape(8.dp))
                .padding(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = Icons.Default.Security,
                contentDescription = null,
                tint = RoyalGold,
                modifier = Modifier.size(36.dp)
            )
            Spacer(modifier = Modifier.width(12.dp))
            Column {
                Text(
                    text = "Lineage verified matches inside this clan",
                    color = InkBrown,
                    fontWeight = FontWeight.Bold,
                    fontSize = 11.sp
                )
                Text(
                    text = "All registered brides and grooms under this lineage have undergone verification seals.",
                    color = Color.Gray,
                    fontSize = 10.sp,
                    lineHeight = 14.sp
                )
            }
        }
    }
}
