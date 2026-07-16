package com.sagaisambaandh.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.material3.Typography
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp

// Sagai Sambaandh Color Palette
val RoyalMaroon = Color(0xFF6B1220)
val DeepMaroon = Color(0xFF4A0D18)
val RoyalGold = Color(0xFFC9A227)
val LightGold = Color(0xFFE8C766)
val SandstoneIvory = Color(0xFFF5EDE0)
val JodhpurIndigo = Color(0xFF1D2B53)
val InkBrown = Color(0xFF2B1810)
val CardBackground = Color(0xFFFCFBF7)

val LightColorScheme = lightColorScheme(
    primary = RoyalMaroon,
    onPrimary = Color.White,
    secondary = RoyalGold,
    onSecondary = RoyalMaroon,
    tertiary = LightGold,
    background = RoyalMaroon,
    onBackground = SandstoneIvory,
    surface = DeepMaroon,
    onSurface = SandstoneIvory,
    surfaceVariant = DeepMaroon,
    onSurfaceVariant = SandstoneIvory
)

// Fallback Typography using system defaults
val Typography = Typography(
    headlineLarge = TextStyle(
        fontFamily = FontFamily.Serif,
        fontWeight = FontWeight.Bold,
        fontSize = 32.sp,
        lineHeight = 40.sp,
        letterSpacing = 0.sp
    ),
    headlineMedium = TextStyle(
        fontFamily = FontFamily.Serif,
        fontWeight = FontWeight.Bold,
        fontSize = 24.sp,
        lineHeight = 32.sp,
        letterSpacing = 0.sp
    ),
    titleLarge = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Bold,
        fontSize = 18.sp,
        lineHeight = 24.sp,
        letterSpacing = 0.5.sp
    ),
    bodyLarge = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Normal,
        fontSize = 16.sp,
        lineHeight = 24.sp,
        letterSpacing = 0.5.sp
    ),
    bodyMedium = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Normal,
        fontSize = 14.sp,
        lineHeight = 20.sp,
        letterSpacing = 0.25.sp
    ),
    labelSmall = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Medium,
        fontSize = 11.sp,
        lineHeight = 16.sp,
        letterSpacing = 0.5.sp
    )
)

@Composable
fun SagaiSambaandhTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    // We strictly use light theme colors to align with the premium palace theme aesthetics
    val colorScheme = LightColorScheme

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}
