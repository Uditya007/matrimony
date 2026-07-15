package com.sagaisambaandh.ui.components

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.unit.dp

@Composable
fun PalaceDivider(
    fillColor: Color,
    modifier: Modifier = Modifier
) {
    Canvas(
        modifier = modifier
            .fillMaxWidth()
            .height(50.dp)
    ) {
        val w = size.width
        val h = size.height

        val path = Path().apply {
            moveTo(0f, h)
            lineTo(0f, h * 0.65f)
            
            lineTo(w * 0.08f, h * 0.65f)
            lineTo(w * 0.08f, h * 0.45f)
            lineTo(w * 0.11f, h * 0.45f)
            
            // Left small dome
            quadraticTo(w * 0.13f, h * 0.32f, w * 0.15f, h * 0.45f)
            lineTo(w * 0.18f, h * 0.45f)
            lineTo(w * 0.18f, h * 0.65f)
            
            // Mid wall
            lineTo(w * 0.32f, h * 0.65f)
            lineTo(w * 0.32f, h * 0.38f)
            lineTo(w * 0.36f, h * 0.38f)
            
            // Middle chhatri dome
            quadraticTo(w * 0.39f, h * 0.22f, w * 0.42f, h * 0.38f)
            lineTo(w * 0.46f, h * 0.38f)
            lineTo(w * 0.46f, h * 0.60f)
            
            // Main high tower
            lineTo(w * 0.58f, h * 0.60f)
            lineTo(w * 0.58f, h * 0.25f)
            lineTo(w * 0.62f, h * 0.25f)
            
            // Main dome peak
            quadraticTo(w * 0.66f, h * 0.05f, w * 0.70f, h * 0.25f)
            lineTo(w * 0.74f, h * 0.25f)
            lineTo(w * 0.74f, h * 0.62f)
            
            // Right low wall
            lineTo(w * 0.84f, h * 0.62f)
            lineTo(w * 0.84f, h * 0.48f)
            lineTo(w * 0.88f, h * 0.48f)
            
            // Right small dome
            quadraticTo(w * 0.90f, h * 0.36f, w * 0.92f, h * 0.48f)
            lineTo(w * 0.95f, h * 0.48f)
            lineTo(w * 0.95f, h * 0.65f)
            
            lineTo(w, h * 0.65f)
            lineTo(w, h)
            close()
        }
        drawPath(path, color = fillColor)
    }
}
