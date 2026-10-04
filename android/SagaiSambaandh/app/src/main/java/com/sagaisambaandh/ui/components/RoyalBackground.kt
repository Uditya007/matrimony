package com.sagaisambaandh.ui.components

import android.graphics.BitmapFactory
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.ImageShader
import androidx.compose.ui.graphics.Paint
import androidx.compose.ui.graphics.TileMode
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.graphics.drawscope.drawIntoCanvas
import androidx.compose.ui.platform.LocalContext
import com.sagaisambaandh.R

@Composable
fun RoyalBackground(
    modifier: Modifier = Modifier,
    opacity: Float = 0.85f,
    content: @Composable () -> Unit = {}
) {
    val context = LocalContext.current
    val bitmap = remember {
        try {
            BitmapFactory.decodeResource(context.resources, R.drawable.royal_wallpaper)
        } catch (e: Exception) {
            null
        }
    }

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(Color(0xFF6B1220)) // Base royal maroon tone
    ) {
        if (bitmap != null) {
            Canvas(modifier = Modifier.fillMaxSize()) {
                val imageBitmap = bitmap.asImageBitmap()
                val shader = ImageShader(
                    image = imageBitmap,
                    tileModeX = TileMode.Repeated,
                    tileModeY = TileMode.Repeated
                )
                val paint = Paint().apply {
                    this.shader = shader
                    this.alpha = opacity
                }
                drawIntoCanvas { canvas ->
                    canvas.drawRect(
                        left = 0f,
                        top = 0f,
                        right = size.width,
                        bottom = size.height,
                        paint = paint
                    )
                }
            }
        }
        
        // Deep maroon overlay matching linear-gradient(rgba(74, 13, 24, 0.45)...)
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Color(0xFF4A0D18).copy(alpha = 0.45f))
        )
        
        content()
    }
}
