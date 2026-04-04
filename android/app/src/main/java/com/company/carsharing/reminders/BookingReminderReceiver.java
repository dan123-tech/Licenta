package com.company.carsharing.reminders;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

import androidx.core.app.NotificationCompat;

import com.company.carsharing.R;
import com.company.carsharing.ui.MainActivity;

/**
 * Shows a local notification when a scheduled booking start/end alarm fires.
 */
public class BookingReminderReceiver extends BroadcastReceiver {

    public static final String EXTRA_TITLE = "title";
    public static final String EXTRA_BODY = "body";
    public static final String EXTRA_NOTIFICATION_ID = "notification_id";
    public static final String CHANNEL_ID = "booking_reminders";

    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null) return;
        String title = intent.getStringExtra(EXTRA_TITLE);
        String body = intent.getStringExtra(EXTRA_BODY);
        int nid = intent.getIntExtra(EXTRA_NOTIFICATION_ID, (int) (System.currentTimeMillis() % Integer.MAX_VALUE));

        NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null) return;

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel ch = new NotificationChannel(
                    CHANNEL_ID,
                    context.getString(R.string.booking_reminders_channel_name),
                    NotificationManager.IMPORTANCE_DEFAULT
            );
            ch.setDescription(context.getString(R.string.booking_reminders_channel_desc));
            nm.createNotificationChannel(ch);
        }

        Intent open = new Intent(context, MainActivity.class);
        open.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent pi = PendingIntent.getActivity(
                context,
                nid,
                open,
                PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0)
        );

        String safeBody = body != null ? body : "";
        NotificationCompat.Builder b = new NotificationCompat.Builder(context, CHANNEL_ID)
                .setSmallIcon(R.drawable.ic_launcher)
                .setContentTitle(title != null ? title : context.getString(R.string.app_name))
                .setContentText(safeBody)
                .setPriority(NotificationCompat.PRIORITY_DEFAULT)
                .setAutoCancel(true)
                .setContentIntent(pi);

        if (safeBody.length() > 72) {
            b.setStyle(new NotificationCompat.BigTextStyle().bigText(safeBody));
        }

        nm.notify(nid, b.build());
    }
}
