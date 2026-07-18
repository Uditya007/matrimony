package com.sagaisambaandh.ui.screens

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.sagaisambaandh.R
import com.sagaisambaandh.ui.theme.*
import kotlinx.coroutines.delay

@Composable
fun SplashView(onTimeout: () -> Unit) {
    var startAnimation by remember { mutableStateOf(false) }
    
    val scale by animateFloatAsState(
        targetValue = if (startAnimation) 1f else 0.85f,
        animationSpec = tween(durationMillis = 1000),
        label = "scale"
    )
    
    val opacity by animateFloatAsState(
        targetValue = if (startAnimation) 1f else 0f,
        animationSpec = tween(durationMillis = 1000),
        label = "opacity"
    )

    LaunchedEffect(Unit) {
        startAnimation = true
        delay(2500)
        onTimeout()
    }

    Box(
        contentAlignment = Alignment.Center,
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    colors = listOf(DeepMaroon, RoyalMaroon)
                )
            )
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center,
            modifier = Modifier
                .fillMaxWidth()
                .alpha(opacity)
                .scale(scale)
        ) {
            // Centered Medallion Logo with Gold Rings
            Box(
                contentAlignment = Alignment.Center,
                modifier = Modifier.size(220.dp)
            ) {
                // Outer gold ring 2
                Box(
                    modifier = Modifier
                        .size(210.dp)
                        .border(1.dp, RoyalGold.copy(alpha = 0.4f), shape = CircleShape)
                )
                
                // Outer gold ring 1
                Box(
                    modifier = Modifier
                        .size(200.dp)
                        .border(
                            width = 3.dp,
                            brush = Brush.linearGradient(
                                colors = listOf(RoyalGold, LightGold, RoyalGold)
                            ),
                            shape = CircleShape
                        )
                )

                // Logo Image
                Image(
                    painter = painterResource(id = R.drawable.logo),
                    contentDescription = "Sagai Sambaandh Logo",
                    contentScale = ContentScale.Crop,
                    modifier = Modifier
                        .size(180.dp)
                        .clip(CircleShape)
                        .background(Color.White, shape = CircleShape)
                        .border(1.dp, RoyalGold.copy(alpha = 0.2f), shape = CircleShape)
                )
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Titles
            Text(
                text = "SHREE RAJPUT",
                color = LightGold,
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                letterSpacing = 4.sp
            )
            
            Spacer(modifier = Modifier.height(8.dp))
            
            Text(
                text = "Sagai Sambaandh",
                color = SandstoneIvory,
                fontSize = 30.sp,
                fontWeight = FontWeight.Bold,
                fontFamily = FontFamily.Serif,
                textAlign = TextAlign.Center
            )
            
            Spacer(modifier = Modifier.height(8.dp))
            
            Text(
                text = "Rajasthan's Royal Matrimony",
                color = SandstoneIvory.copy(alpha = 0.8f),
                fontSize = 13.sp,
                fontStyle = FontStyle.Italic,
                textAlign = TextAlign.Center
            )
        }
    }
}
