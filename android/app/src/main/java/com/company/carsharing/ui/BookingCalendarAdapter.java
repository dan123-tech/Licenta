package com.company.carsharing.ui;

import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.BaseAdapter;
import android.widget.TextView;

import com.company.carsharing.R;
import com.company.carsharing.models.Reservation;
import com.company.carsharing.models.User;
import com.company.carsharing.util.I18n;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/**
 * Read-only list of reservations for the booking / fleet calendar screens.
 */
public class BookingCalendarAdapter extends BaseAdapter {

    private final Context context;
    private final List<Reservation> items = new ArrayList<>();
    private boolean showBooker;

    public BookingCalendarAdapter(Context context) {
        this.context = context;
    }

    public void setShowBooker(boolean showBooker) {
        this.showBooker = showBooker;
    }

    public void setItems(List<Reservation> list) {
        items.clear();
        if (list != null) items.addAll(list);
        notifyDataSetChanged();
    }

    @Override
    public int getCount() {
        return items.size();
    }

    @Override
    public Reservation getItem(int position) {
        return items.get(position);
    }

    @Override
    public long getItemId(int position) {
        return position;
    }

    @Override
    public View getView(int position, View convertView, ViewGroup parent) {
        View row = convertView;
        if (row == null) {
            row = LayoutInflater.from(context).inflate(R.layout.item_booking_calendar_row, parent, false);
        }
        Reservation r = items.get(position);

        String carTitle = context.getString(R.string.history_fallback_car);
        if (r.getCar() != null) {
            String b = r.getCar().getBrand() != null ? r.getCar().getBrand() : "";
            String reg = r.getCar().getRegistrationNumber() != null ? r.getCar().getRegistrationNumber() : "";
            carTitle = (b + " " + reg).trim();
            if (carTitle.isEmpty()) carTitle = context.getString(R.string.history_fallback_car);
        }

        TextView title = row.findViewById(R.id.cal_row_title);
        title.setText(carTitle);

        TextView userTv = row.findViewById(R.id.cal_row_user);
        if (showBooker && r.getUser() != null) {
            User u = r.getUser();
            String un = u.getName() != null && !u.getName().isEmpty() ? u.getName() : "";
            String em = u.getEmail() != null ? u.getEmail() : "";
            String line = un.isEmpty() ? em : (em.isEmpty() || un.equalsIgnoreCase(em) ? un : un + " · " + em);
            userTv.setText(line);
            userTv.setVisibility(View.VISIBLE);
        } else {
            userTv.setVisibility(View.GONE);
        }

        TextView timeTv = row.findViewById(R.id.cal_row_time);
        timeTv.setText(formatDateRange(r.getStartDate(), r.getEndDate()));

        TextView st = row.findViewById(R.id.cal_row_status);
        st.setText(I18n.reservationStatus(context, r.getStatus()));

        TextView purposeTv = row.findViewById(R.id.cal_row_purpose);
        if (r.getPurpose() != null && !r.getPurpose().trim().isEmpty()) {
            purposeTv.setText(r.getPurpose().trim());
            purposeTv.setVisibility(View.VISIBLE);
        } else {
            purposeTv.setVisibility(View.GONE);
        }

        return row;
    }

    private String formatDateRange(String start, String end) {
        if (start == null && end == null) return "";
        try {
            java.text.SimpleDateFormat iso = new java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.US);
            iso.setTimeZone(java.util.TimeZone.getTimeZone("UTC"));
            java.text.SimpleDateFormat out = new java.text.SimpleDateFormat("dd/MM/yyyy HH:mm", Locale.getDefault());
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
        } catch (Exception e) {
            return "";
        }
    }
}
