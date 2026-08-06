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
        val cornerRadius = with(density) { 8.dp.toPx() }
        val path = Path().apply {
            addRoundRect(
                androidx.compose.ui.geometry.RoundRect(
                    left = 0f,
                    top = 0f,
                    right = size.width,
                    bottom = size.height,
                    radiusX = cornerRadius,
                    radiusY = cornerRadius
                )
            )
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
