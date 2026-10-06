package com.sagaisambaandh.ui.components

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.util.Base64
import android.util.LruCache
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.size
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.WorkspacePremium
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shadow
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.TextUnit
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.SubcomposeAsyncImage
import coil.compose.SubcomposeAsyncImageContent
import com.sagaisambaandh.ui.theme.AppPrimary
import com.sagaisambaandh.ui.theme.AppSecondary
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

private object AvatarMemoryCache {
    val cache = LruCache<String, Bitmap>(200)
}

fun getClanGradient(clan: String): Brush {
    val c = clan.lowercase().trim()
    return when {
        c.contains("rathore") -> Brush.linearGradient(listOf(Color(0xFFC72C41), Color(0xFFF27121)))
        c.contains("sisodia") -> Brush.linearGradient(listOf(Color(0xFF6B1220), Color(0xFFC9A227)))
        c.contains("chauhan") -> Brush.linearGradient(listOf(Color(0xFF8A2387), Color(0xFFE94057)))
        c.contains("shekhawat") -> Brush.linearGradient(listOf(Color(0xFF10B981), Color(0xFF1D2B53)))
        c.contains("panwar") || c.contains("parmar") -> Brush.linearGradient(listOf(Color(0xFFB8860B), Color(0xFF8B0000)))
        c.contains("tanwar") || c.contains("tomar") -> Brush.linearGradient(listOf(Color(0xFF1E3A8A), Color(0xFF3B82F6)))
        c.contains("solanki") -> Brush.linearGradient(listOf(Color(0xFFE11D48), Color(0xFFF59E0B)))
        c.contains("hada") -> Brush.linearGradient(listOf(Color(0xFF7C3AED), Color(0xFF4F46E5)))
        c.contains("parihar") || c.contains("padihar") -> Brush.linearGradient(listOf(Color(0xFF0D9488), Color(0xFF115E59)))
        else -> Brush.linearGradient(listOf(AppPrimary, AppSecondary))
    }
}

fun extractInitials(name: String, placeholderInitial: String? = null): String {
    if (!placeholderInitial.isNullOrBlank()) {
        return placeholderInitial.trim().take(2).uppercase()
    }
    val parts = name.trim().split(Regex("\\s+")).filter { it.isNotEmpty() }
    return when {
        parts.size >= 2 -> "${parts[0].take(1)}${parts[1].take(1)}".uppercase()
        parts.size == 1 -> parts[0].take(1).uppercase()
        else -> "R"
    }
}

@Composable
fun AvatarMonogramPlaceholder(
    initial: String = "R",
    clan: String = "",
    fontSize: TextUnit = 32.sp,
    isLoading: Boolean = false,
    modifier: Modifier = Modifier
) {
    val gradient = remember(clan) { getClanGradient(clan) }
    Box(
        contentAlignment = Alignment.Center,
        modifier = modifier.background(gradient)
    ) {
        // Subtle Crown Crest Watermark (opacity 0.14)
        Icon(
            imageVector = Icons.Default.WorkspacePremium,
            contentDescription = null,
            tint = Color.White.copy(alpha = 0.14f),
            modifier = Modifier.fillMaxSize(0.6f)
        )

        // Regal Initials with Shadow
        Text(
            text = initial,
            color = Color.White,
            fontSize = fontSize,
            fontWeight = FontWeight.Bold,
            fontFamily = FontFamily.Serif,
            style = TextStyle(
                shadow = Shadow(
                    color = Color.Black.copy(alpha = 0.35f),
                    offset = Offset(0f, 3f),
                    blurRadius = 6f
                )
            )
        )

        if (isLoading) {
            CircularProgressIndicator(
                color = Color.White.copy(alpha = 0.85f),
                strokeWidth = 2.dp,
                modifier = Modifier.size(24.dp)
            )
        }
    }
}

@Composable
fun AvatarImageView(
    source: String?,
    name: String = "",
    clan: String = "",
    contentDescription: String? = null,
    modifier: Modifier = Modifier,
    contentScale: ContentScale = ContentScale.Crop,
    fallbackFontSize: TextUnit = 36.sp,
    placeholderInitial: String? = null
) {
    val trimmed = remember(source) { source?.trim() ?: "" }
    val initials = remember(name, placeholderInitial) { extractInitials(name, placeholderInitial) }

    if (trimmed.isEmpty()) {
        AvatarMonogramPlaceholder(
            initial = initials,
            clan = clan,
            fontSize = fallbackFontSize,
            isLoading = false,
            modifier = modifier
        )
        return
    }

    // Determine if it's base64 encoded data
    val isBase64 = remember(trimmed) {
        trimmed.startsWith("data:image/") ||
        (trimmed.length > 80 && (
            trimmed.startsWith("/9j/") ||
            trimmed.startsWith("iVBORw0K") ||
            trimmed.startsWith("R0lGOD") ||
            trimmed.startsWith("UklGR") ||
            (!trimmed.startsWith("http") && !trimmed.contains("/") && !trimmed.endsWith(".png") && !trimmed.endsWith(".jpg"))
        ))
    }

    if (isBase64) {
        val cacheKey = remember(trimmed) {
            "${trimmed.take(40)}_${trimmed.length}"
        }
        var bitmap by remember(cacheKey) {
            mutableStateOf(AvatarMemoryCache.cache.get(cacheKey))
        }
        var isDecoding by remember(cacheKey) {
            mutableStateOf(bitmap == null)
        }

        LaunchedEffect(cacheKey) {
            if (bitmap == null) {
                withContext(Dispatchers.IO) {
                    try {
                        val raw = if (trimmed.contains(",")) trimmed.substringAfter(",") else trimmed
                        val clean = raw.replace("\n", "").replace("\r", "").replace(" ", "").trim()
                        val bytes = Base64.decode(clean, Base64.DEFAULT)
                        val decoded = BitmapFactory.decodeByteArray(bytes, 0, bytes.size)
                        if (decoded != null) {
                            AvatarMemoryCache.cache.put(cacheKey, decoded)
                            withContext(Dispatchers.Main) {
                                bitmap = decoded
                                isDecoding = false
                            }
                        } else {
                            withContext(Dispatchers.Main) {
                                isDecoding = false
                            }
                        }
                    } catch (e: Exception) {
                        e.printStackTrace()
                        withContext(Dispatchers.Main) {
                            isDecoding = false
                        }
                    }
                }
            }
        }

        val currentBitmap = bitmap
        if (currentBitmap != null) {
            Image(
                bitmap = currentBitmap.asImageBitmap(),
                contentDescription = contentDescription,
                contentScale = contentScale,
                modifier = modifier
            )
        } else {
            AvatarMonogramPlaceholder(
                initial = initials,
                clan = clan,
                fontSize = fallbackFontSize,
                isLoading = isDecoding,
                modifier = modifier
            )
        }
    } else {
        val finalUrl = remember(trimmed) {
            when {
                trimmed.startsWith("https://shreerajputsagaisambandh.com") ->
                    trimmed.replace("https://shreerajputsagaisambandh.com", "https://www.shreerajputsagaisambandh.com")
                trimmed.startsWith("http://shreerajputsagaisambandh.com") ->
                    trimmed.replace("http://shreerajputsagaisambandh.com", "https://www.shreerajputsagaisambandh.com")
                trimmed.startsWith("http://") || trimmed.startsWith("https://") ->
                    trimmed
                else -> {
                    val file = if (trimmed.endsWith(".png") || trimmed.endsWith(".jpg") || trimmed.endsWith(".jpeg")) trimmed else "$trimmed.png"
                    "https://www.shreerajputsagaisambandh.com/images/$file"
                }
            }
        }

        SubcomposeAsyncImage(
            model = finalUrl,
            contentDescription = contentDescription,
            contentScale = contentScale,
            modifier = modifier,
            loading = {
                AvatarMonogramPlaceholder(
                    initial = initials,
                    clan = clan,
                    fontSize = fallbackFontSize,
                    isLoading = true,
                    modifier = Modifier.fillMaxSize()
                )
            },
            error = {
                AvatarMonogramPlaceholder(
                    initial = initials,
                    clan = clan,
                    fontSize = fallbackFontSize,
                    isLoading = false,
                    modifier = Modifier.fillMaxSize()
                )
            },
            success = {
                SubcomposeAsyncImageContent(
                    modifier = Modifier.fillMaxSize(),
                    contentScale = contentScale
                )
            }
        )
    }
}
