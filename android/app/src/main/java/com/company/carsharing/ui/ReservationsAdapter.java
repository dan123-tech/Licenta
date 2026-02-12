package com.company.carsharing.ui;

import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.BaseAdapter;
import android.widget.TextView;

import com.company.carsharing.R;
import com.company.carsharing.models.Reservation;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.concurrent.TimeUnit;

public class ReservationsAdapter extends BaseAdapter {
    private final Context context;
    private final List<Reservation> reservations = new ArrayList<>();
    private final OnReservationActionListener listener;

    public interface OnReservationActionListener {
        void onRelease(Reservation r);
        void onCancel(Reservation r);
        void onRequestCodes(Reservation r);
    }

    public ReservationsAdapter(Context context, OnReservationActionListener listener) {
        this.context = context;
        this.listener = listener;
    }

    public void setReservations(List<Reservation> reservations) {
        this.reservations.clear();
        if (reservations != null) this.reservations.addAll(reservations);
        notifyDataSetChanged();
    }

    @Override
    public int getCount() { return reservations.size(); }
    @Override
    public Reservation getItem(int position) { return reservations.get(position); }
    @Override
    public long getItemId(int position) { return position; }

    @Override
    public View getView(int position, View convertView, ViewGroup parent) {
        View row = convertView;
        if (row == null) {
            row = LayoutInflater.from(context).inflate(R.layout.item_reservation, parent, false);
        }
        Reservation r = reservations.get(position);
        String carStr = r.getCar() != null ? r.getCar().getBrand() + " " + (r.getCar().getRegistrationNumber() != null ? r.getCar().getRegistrationNumber() : "") : "Car";
        ((TextView) row.findViewById(R.id.res_title)).setText(carStr + " · " + (r.getStatus() != null ? r.getStatus() : ""));
        String sub = (r.getPurpose() != null && !r.getPurpose().isEmpty() ? r.getPurpose() : "") + (r.getCar() != null ? " · " + r.getCar().getKm() + " km" : "");
        if (r.getStartDate() != null || r.getEndDate() != null) {
            String dates = formatDateRange(r.getStartDate(), r.getEndDate());
            if (!dates.isEmpty()) sub = sub.isEmpty() ? dates : sub + " · " + dates;
        }
        ((TextView) row.findViewById(R.id.res_subtitle)).setText(sub);
        String pickup = r.getPickupCode() != null ? r.getPickupCode() : "—";
        String release = r.getReleaseCode() != null ? r.getReleaseCode() : "—";
        ((TextView) row.findViewById(R.id.res_pickup_code)).setText(pickup);
        ((TextView) row.findViewById(R.id.res_release_code)).setText(release);
        String codeStatus = getCodeTimerStatus(r);
        TextView timerTv = row.findViewById(R.id.res_code_timer);
        timerTv.setText(codeStatus);
        timerTv.setVisibility(codeStatus.isEmpty() ? android.view.View.GONE : android.view.View.VISIBLE);
        boolean active = "ACTIVE".equalsIgnoreCase(r.getStatus());
        boolean missingCodes = active && r.getPickupCode() == null;
        View getCodesBtn = row.findViewById(R.id.res_get_codes);
        getCodesBtn.setVisibility(missingCodes ? View.VISIBLE : View.GONE);
        getCodesBtn.setOnClickListener(v -> listener.onRequestCodes(r));
        View releaseBtn = row.findViewById(R.id.res_release);
        View cancelBtn = row.findViewById(R.id.res_cancel);
        releaseBtn.setVisibility(active ? View.VISIBLE : View.GONE);
        cancelBtn.setVisibility(active ? View.VISIBLE : View.GONE);
        releaseBtn.setOnClickListener(v -> listener.onRelease(r));
        cancelBtn.setOnClickListener(v -> listener.onCancel(r));
        return row;
    }

    private String formatDateRange(String start, String end) {
        if (start == null && end == null) return "";
        try {
            java.text.SimpleDateFormat iso = new java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.US);
            iso.setTimeZone(java.util.TimeZone.getTimeZone("UTC"));
            java.text.SimpleDateFormat out = new java.text.SimpleDateFormat("dd/MM HH:mm", Locale.getDefault());
            StringBuilder sb = new StringBuilder();
            if (start != null && !start.isEmpty()) {
                String s = start.length() >= 19 ? start.substring(0, 19).replace("Z", "") : start.replace("Z", "");
                sb.append(out.format(iso.parse(s)));
            }
            if (end != null && !end.isEmpty()) {
                String e = end.length() >= 19 ? end.substring(0, 19).replace("Z", "") : end.replace("Z", "");
                if (sb.length() > 0) sb.append(" → ");
                sb.append(out.format(iso.parse(e)));
            }
            return sb.toString();
        } catch (Exception e) { return ""; }
    }

    /** 30-min code window: Pending (before valid), Active (valid now), Expired (after 30 min). */
    private String getCodeTimerStatus(Reservation r) {
        String validFrom = r.getCodeValidFrom();
        if (validFrom == null || validFrom.isEmpty()) return "";
        try {
            java.text.SimpleDateFormat iso = new java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US);
            iso.setTimeZone(java.util.TimeZone.getTimeZone("UTC"));
            long fromMs = iso.parse(validFrom).getTime();
            long now = System.currentTimeMillis();
            long windowMs = TimeUnit.MINUTES.toMillis(30);
            if (now < fromMs) return "Code valid in " + ((fromMs - now) / 60000) + " min (30 min from reservation start)";
            if (now < fromMs + windowMs) return "Code valid now, expires in " + ((fromMs + windowMs - now) / 60000) + " min";
            return "Code window expired";
        } catch (Exception e) {
            return "";
        }
    }
}
