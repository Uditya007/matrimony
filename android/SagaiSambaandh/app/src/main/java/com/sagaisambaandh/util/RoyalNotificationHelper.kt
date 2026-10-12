package com.sagaisambaandh.util

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import com.sagaisambaandh.MainActivity
import com.sagaisambaandh.R

object RoyalNotificationHelper {
    const val CHANNEL_ID = "royal_rajput_notifications"
    const val CHANNEL_NAME = "Royal Matches & Messages"
    const val CHANNEL_DESC = "Notifications for match requests, chat messages, and royal announcements"

    fun createNotificationChannel(context: Context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val importance = NotificationManager.IMPORTANCE_HIGH
            val channel = NotificationChannel(CHANNEL_ID, CHANNEL_NAME, importance).apply {
                description = CHANNEL_DESC
                enableVibration(true)
                enableLights(true)
            }
            val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager
            notificationManager?.createNotificationChannel(channel)
        }
    }

    fun hasNotificationPermission(context: Context): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            ContextCompat.checkSelfPermission(
                context,
                Manifest.permission.POST_NOTIFICATIONS
            ) == PackageManager.PERMISSION_GRANTED
        } else {
            true
        }
    }

    fun postNotification(
        context: Context,
        notificationId: Int,
        title: String,
        body: String,
        extraType: String = "",
        extraId: String = ""
    ) {
        if (!hasNotificationPermission(context)) return

        createNotificationChannel(context)

        val intent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtra("notif_type", extraType)
            putExtra("notif_id", extraId)
        }

        val pendingIntent = PendingIntent.getActivity(
            context,
            notificationId,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val builder = NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(NotificationCompat.BigTextStyle().bigText(body))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)
            .setDefaults(NotificationCompat.DEFAULT_ALL)

        try {
            NotificationManagerCompat.from(context).notify(notificationId, builder.build())
        } catch (e: SecurityException) {
            e.printStackTrace()
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    fun notifyConnectionRequest(context: Context, senderName: String, senderId: String) {
        val notifId = (senderId.hashCode() and 0x7FFFFFFF) % 100000 + 1000
        postNotification(
            context = context,
            notificationId = notifId,
            title = "💍 Royal Match Request",
            body = "$senderName sent you a royal connection request. Tap to view and accept.",
            extraType = "request",
            extraId = senderId
        )
    }

    fun notifyConnectionAccepted(context: Context, partnerName: String, partnerId: String) {
        val notifId = (partnerId.hashCode() and 0x7FFFFFFF) % 100000 + 2000
        postNotification(
            context = context,
            notificationId = notifId,
            title = "💖 Connection Accepted!",
            body = "$partnerName accepted your connection! You can now chat and view contact details.",
            extraType = "accepted",
            extraId = partnerId
        )
    }

    fun notifyNewMessage(context: Context, senderName: String, senderId: String, messageText: String) {
        val notifId = (senderId.hashCode() and 0x7FFFFFFF) % 100000 + 3000
        postNotification(
            context = context,
            notificationId = notifId,
            title = "💬 $senderName",
            body = messageText,
            extraType = "message",
            extraId = senderId
        )
    }

    fun notifyMarketingBroadcast(context: Context, title: String, body: String, broadcastId: String) {
        val notifId = (broadcastId.hashCode() and 0x7FFFFFFF) % 100000 + 4000
        postNotification(
            context = context,
            notificationId = notifId,
            title = if (title.isNotBlank()) title else "👑 Royal Announcement",
            body = body,
            extraType = "broadcast",
            extraId = broadcastId
        )
    }
}
