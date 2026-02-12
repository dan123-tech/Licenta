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

public class HistoryAdapter extends BaseAdapter {
    private final Context context;
    private final List<Reservation> list = new ArrayList<>();

    public HistoryAdapter(Context context) {
        this.context = context;
    }

    public void setReservations(List<Reservation> reservations) {
        list.clear();
        if (reservations != null) list.addAll(reservations);
        notifyDataSetChanged();
    }

    @Override
    public int getCount() { return list.size(); }
    @Override
    public Reservation getItem(int position) { return list.get(position); }
    @Override
    public long getItemId(int position) { return position; }

    @Override
    public View getView(int position, View convertView, ViewGroup parent) {
        if (convertView == null) {
            convertView = LayoutInflater.from(context).inflate(R.layout.item_history, parent, false);
        }
        Reservation r = list.get(position);
        String car = r.getCar() != null ? r.getCar().getBrand() + " " + (r.getCar().getRegistrationNumber() != null ? r.getCar().getRegistrationNumber() : "") : "Car";
        ((TextView) convertView.findViewById(R.id.history_car)).setText(car);
        String statusKm = (r.getStatus() != null ? r.getStatus() : "") + (r.getReleasedKmUsed() != null ? " · " + r.getReleasedKmUsed() + " km" : "");
        ((TextView) convertView.findViewById(R.id.history_status_km)).setText(statusKm);
        String dates = (r.getStartDate() != null ? r.getStartDate() : "") + (r.getEndDate() != null ? " → " + r.getEndDate() : "");
        ((TextView) convertView.findViewById(R.id.history_dates)).setText(dates);
        return convertView;
    }
}
