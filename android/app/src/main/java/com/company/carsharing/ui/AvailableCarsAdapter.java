package com.company.carsharing.ui;

import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.BaseAdapter;
import android.widget.TextView;

import com.company.carsharing.R;
import com.company.carsharing.models.Car;

import java.util.ArrayList;
import java.util.List;

public class AvailableCarsAdapter extends BaseAdapter {
    private final Context context;
    private final List<Car> cars = new ArrayList<>();
    private final OnCarClickListener listener;

    public interface OnCarClickListener {
        void onCarClick(Car car);
    }

    public AvailableCarsAdapter(Context context, OnCarClickListener listener) {
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
        if (convertView == null) {
            convertView = LayoutInflater.from(context).inflate(R.layout.item_card_simple, parent, false);
        }
        Car car = cars.get(position);
        String title = car.getBrand() + (car.getModel() != null && !car.getModel().isEmpty() ? " " + car.getModel() : "");
        String sub = (car.getRegistrationNumber() != null ? car.getRegistrationNumber() : "") + " · " + car.getKm() + " km";
        if (car.getAverageConsumptionL100km() != null) sub += " · " + car.getAverageConsumptionL100km() + " L/100km";
        ((TextView) convertView.findViewById(R.id.item_title)).setText(title);
        ((TextView) convertView.findViewById(R.id.item_subtitle)).setText(sub + " · Tap to reserve");
        convertView.setOnClickListener(v -> listener.onCarClick(car));
        return convertView;
    }
}
