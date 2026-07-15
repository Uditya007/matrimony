package com.sagaisambaandh.ui.components

import androidx.compose.foundation.border
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Outline
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import com.sagaisambaandh.ui.theme.RoyalGold
import com.sagaisambaandh.ui.theme.LightGold

class JharokhaShape : Shape {
    override fun createOutline(
        size: Size,
        layoutDirection: LayoutDirection,
        density: Density
    ): Outline {
        val path = Path().apply {
            val w = size.width
            val h = size.height
            
            // Start at bottom-left corner
            moveTo(0f, h)
            
            // Line up left wall
            lineTo(0f, h * 0.38f)
            
            // Left outer scallop
            quadraticTo(w * 0.02f, h * 0.27f, w * 0.15f, h * 0.20f)
            
            // Middle-left scallop
            quadraticTo(w * 0.22f, h * 0.13f, w * 0.35f, h * 0.10f)
            
            // Top pointed arch peak
            quadraticTo(w * 0.43f, h * 0.04f, w * 0.5f, 0f)
            
            // Descending right peak
            quadraticTo(w * 0.57f, h * 0.04f, w * 0.65f, h * 0.10f)
            
            // Middle-right scallop
            quadraticTo(w * 0.78f, h * 0.13f, w * 0.85f, h * 0.20f)
            
            // Right outer scallop
            quadraticTo(w * 0.98f, h * 0.27f, w, h * 0.38f)
            
            // Line down right wall
            lineTo(w, h)
            
            // Close path
            close()
        }
        return Outline.Generic(path)
    }
}

fun Modifier.jharokhaBorder(strokeWidth: Float = 2.5f): Modifier {
    return this.border(
        width = strokeWidth.dp,
        brush = Brush.linearGradient(
            colors = listOf(RoyalGold, LightGold, RoyalGold)
        ),
        shape = JharokhaShape()
    )
}
