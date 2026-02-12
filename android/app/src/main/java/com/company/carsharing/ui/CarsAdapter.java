package com.company.carsharing.ui;

import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.BaseAdapter;
import android.widget.TextView;

import androidx.core.content.ContextCompat;

import com.company.carsharing.R;
import com.company.carsharing.models.Car;

import java.util.ArrayList;
import java.util.List;

public class CarsAdapter extends BaseAdapter {
    private final Context context;
    private final List<Car> cars = new ArrayList<>();
    private final OnCarActionListener listener;

    public interface OnCarActionListener {
        void onEdit(Car car);
        void onDelete(Car car);
    }

    public CarsAdapter(Context context, OnCarActionListener listener) {
        this.context = context;
        this.listener = listener;
    }

    public void setCars(List<Car> cars) {
        this.cars.clear();
        if (cars != null) this.cars.addAll(cars);
        notifyDataSetChanged();
    }

    @Override
    public int getCount() { return cars.size(); }
    @Override
    public Car getItem(int position) { return cars.get(position); }
    @Override
    public long getItemId(int position) { return position; }

    @Override
    public View getView(int position, View convertView, ViewGroup parent) {
        View row = convertView;
        if (row == null) {
            row = LayoutInflater.from(context).inflate(R.layout.item_car, parent, false);
        }
        Car car = cars.get(position);
        TextView title = row.findViewById(R.id.car_title);
        TextView status = row.findViewById(R.id.car_status);
        TextView subtitle = row.findViewById(R.id.car_subtitle);
        title.setText(car.getBrand() + (car.getModel() != null && !car.getModel().isEmpty() ? " " + car.getModel() : ""));
        String statusStr = car.getStatus() != null ? car.getStatus() : "";
        status.setText(statusStr);
        int statusColor = ContextCompat.getColor(context, com.company.carsharing.R.color.on_surface_variant);
        if ("AVAILABLE".equalsIgnoreCase(statusStr)) statusColor = ContextCompat.getColor(context, com.company.carsharing.R.color.status_available);
        else if ("RESERVED".equalsIgnoreCase(statusStr)) statusColor = ContextCompat.getColor(context, com.company.carsharing.R.color.status_reserved);
        else if ("MAINTENANCE".equalsIgnoreCase(statusStr)) statusColor = ContextCompat.getColor(context, com.company.carsharing.R.color.status_maintenance);
        status.setBackgroundColor(statusColor);
        status.setTextColor(android.graphics.Color.WHITE);
        String sub = (car.getRegistrationNumber() != null ? car.getRegistrationNumber() : "") + " · " + car.getKm() + " km";
        if (car.getAverageConsumptionL100km() != null) sub += " · " + car.getAverageConsumptionL100km() + " L/100km";
        subtitle.setText(sub);
        row.findViewById(R.id.car_edit).setOnClickListener(v -> listener.onEdit(car));
        row.findViewById(R.id.car_delete).setOnClickListener(v -> listener.onDelete(car));
        return row;
    }
}
