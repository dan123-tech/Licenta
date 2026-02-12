package com.company.carsharing.ui;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ArrayAdapter;
import android.widget.ListView;
import android.widget.Spinner;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AlertDialog;
import androidx.fragment.app.Fragment;

import com.company.carsharing.data.SessionHolder;
import com.company.carsharing.data.repository.AuthRepository;
import com.company.carsharing.databinding.FragmentCarsBinding;
import com.company.carsharing.models.Car;
import com.company.carsharing.network.RetrofitClient;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class CarsFragment extends Fragment implements CarsAdapter.OnCarActionListener {
    private FragmentCarsBinding binding;
    private CarsAdapter carsAdapter;
    private List<Car> cars = new java.util.ArrayList<>();

    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        binding = FragmentCarsBinding.inflate(inflater, container, false);
        if (getActivity() instanceof MainActivity) ((MainActivity) getActivity()).setToolbarTitle("Manage Cars");
        carsAdapter = new CarsAdapter(requireContext(), this);
        binding.carsList.setAdapter(carsAdapter);
        if (SessionHolder.isAdmin()) {
            binding.fabAddCar.setVisibility(View.VISIBLE);
            binding.fabAddCar.setOnClickListener(v -> showAddCarDialog());
        } else {
            binding.fabAddCar.setVisibility(View.GONE);
        }
        loadCars();
        return binding.getRoot();
    }

    private void showAddCarDialog() {
        View dialogView = LayoutInflater.from(requireContext()).inflate(com.company.carsharing.R.layout.dialog_add_car, null);
        com.google.android.material.textfield.TextInputEditText brandEt = dialogView.findViewById(com.company.carsharing.R.id.dialog_brand_et);
        com.google.android.material.textfield.TextInputEditText regEt = dialogView.findViewById(com.company.carsharing.R.id.dialog_reg_et);
        Spinner fuelSpinner = dialogView.findViewById(com.company.carsharing.R.id.dialog_fuel_type);
        com.google.android.material.textfield.TextInputEditText kmEt = dialogView.findViewById(com.company.carsharing.R.id.dialog_km_et);
        com.google.android.material.textfield.TextInputEditText consumptionEt = dialogView.findViewById(com.company.carsharing.R.id.dialog_consumption_et);
        fuelSpinner.setAdapter(new ArrayAdapter<>(requireContext(), android.R.layout.simple_spinner_dropdown_item, new String[]{"Benzine", "Diesel", "Electric", "Hybrid"}));
        TextView errorTv = dialogView.findViewById(com.company.carsharing.R.id.dialog_car_error);
        View cancelBtn = dialogView.findViewById(com.company.carsharing.R.id.dialog_car_cancel);
        View saveBtn = dialogView.findViewById(com.company.carsharing.R.id.dialog_car_save);

        AlertDialog dialog = new AlertDialog.Builder(requireContext())
                .setView(dialogView)
                .setCancelable(true)
                .create();
        cancelBtn.setOnClickListener(v -> dialog.dismiss());
        saveBtn.setOnClickListener(v -> {
            errorTv.setVisibility(View.GONE);
            String brand = brandEt.getText() != null ? brandEt.getText().toString().trim() : "";
            String reg = regEt.getText() != null ? regEt.getText().toString().trim() : "";
            String kmStr = kmEt.getText() != null ? kmEt.getText().toString().trim() : "";
            String consumptionStr = consumptionEt.getText() != null ? consumptionEt.getText().toString().trim() : "";
            if (brand.isEmpty()) { errorTv.setText("Brand is required"); errorTv.setVisibility(View.VISIBLE); return; }
            if (reg.isEmpty()) { errorTv.setText("Registration number is required"); errorTv.setVisibility(View.VISIBLE); return; }
            int km = 0;
            try { if (!kmStr.isEmpty()) km = Integer.parseInt(kmStr); } catch (NumberFormatException e) { km = 0; }
            Double consumption = null;
            if (!consumptionStr.isEmpty()) {
                try { consumption = Double.parseDouble(consumptionStr.replace(",", ".")); } catch (NumberFormatException ignored) { }
            }
            String fuelType = (String) fuelSpinner.getSelectedItem();
            Map<String, Object> body = new HashMap<>();
            body.put("brand", brand);
            body.put("registrationNumber", reg);
            body.put("km", km);
            body.put("status", "AVAILABLE");
            body.put("fuelType", fuelType != null ? fuelType : "Benzine");
            if (consumption != null) body.put("averageConsumptionL100km", consumption);
            RetrofitClient.getApiService(new AuthRepository(requireContext()).getSessionPreferences())
                    .addCar(body).enqueue(new Callback<Car>() {
                @Override
                public void onResponse(Call<Car> call, Response<Car> response) {
                    if (getActivity() == null) return;
                    if (response.isSuccessful()) {
                        dialog.dismiss();
                        loadCars();
                        Toast.makeText(requireContext(), "Car added", Toast.LENGTH_SHORT).show();
                    } else {
                        errorTv.setText(response.code() == 400 ? "Invalid data" : "Failed to add car");
                        errorTv.setVisibility(View.VISIBLE);
                    }
                }
                @Override
                public void onFailure(Call<Car> call, Throwable t) {
                    if (getActivity() != null) {
                        errorTv.setText("Network error");
                        errorTv.setVisibility(View.VISIBLE);
                    }
                }
            });
        });
        dialog.show();
    }

    @Override
    public void onEdit(Car car) {
        View dialogView = LayoutInflater.from(requireContext()).inflate(com.company.carsharing.R.layout.dialog_edit_car, null);
        com.google.android.material.textfield.TextInputEditText kmEt = dialogView.findViewById(com.company.carsharing.R.id.dialog_edit_km_et);
        com.google.android.material.textfield.TextInputEditText consumptionEt = dialogView.findViewById(com.company.carsharing.R.id.dialog_edit_consumption_et);
        Spinner statusSpinner = dialogView.findViewById(com.company.carsharing.R.id.dialog_edit_status);
        TextView errorTv = dialogView.findViewById(com.company.carsharing.R.id.dialog_edit_car_error);
        View cancelBtn = dialogView.findViewById(com.company.carsharing.R.id.dialog_edit_cancel);
        View saveBtn = dialogView.findViewById(com.company.carsharing.R.id.dialog_edit_save);

        kmEt.setText(String.valueOf(car.getKm()));
        if (car.getAverageConsumptionL100km() != null) consumptionEt.setText(String.valueOf(car.getAverageConsumptionL100km()));
        String[] statuses = new String[]{"AVAILABLE", "RESERVED", "IN_MAINTENANCE"};
        statusSpinner.setAdapter(new ArrayAdapter<>(requireContext(), android.R.layout.simple_spinner_dropdown_item, statuses));
        for (int i = 0; i < statuses.length; i++) {
            if (statuses[i].equals(car.getStatus())) { statusSpinner.setSelection(i); break; }
        }

        AlertDialog dialog = new AlertDialog.Builder(requireContext()).setView(dialogView).setCancelable(true).create();
        cancelBtn.setOnClickListener(v -> dialog.dismiss());
        saveBtn.setOnClickListener(v -> {
            errorTv.setVisibility(View.GONE);
            String kmStr = kmEt.getText() != null ? kmEt.getText().toString().trim() : "";
            String consumptionStr = consumptionEt.getText() != null ? consumptionEt.getText().toString().trim() : "";
            int km = car.getKm();
            try { if (!kmStr.isEmpty()) km = Integer.parseInt(kmStr); } catch (NumberFormatException e) { }
            Double consumption = null;
            if (!consumptionStr.isEmpty()) {
                try { consumption = Double.parseDouble(consumptionStr.replace(",", ".")); } catch (NumberFormatException ignored) { }
            }
            String status = (String) statusSpinner.getSelectedItem();
            Map<String, Object> body = new HashMap<>();
            body.put("km", km);
            body.put("status", status);
            if (consumption != null) body.put("averageConsumptionL100km", consumption);
            RetrofitClient.getApiService(new AuthRepository(requireContext()).getSessionPreferences())
                    .updateCar(car.getId(), body).enqueue(new Callback<Car>() {
                @Override
                public void onResponse(Call<Car> call, Response<Car> response) {
                    if (getActivity() == null) return;
                    if (response.isSuccessful()) {
                        dialog.dismiss();
                        loadCars();
                        Toast.makeText(requireContext(), "Car updated", Toast.LENGTH_SHORT).show();
                    } else {
                        errorTv.setText("Failed to update");
                        errorTv.setVisibility(View.VISIBLE);
                    }
                }
                @Override
                public void onFailure(Call<Car> call, Throwable t) {
                    if (getActivity() != null) {
                        errorTv.setText("Network error");
                        errorTv.setVisibility(View.VISIBLE);
                    }
                }
            });
        });
        dialog.show();
    }

    @Override
    public void onDelete(Car car) {
        new AlertDialog.Builder(requireContext())
                .setTitle("Delete car")
                .setMessage("Delete " + car.getBrand() + " " + (car.getRegistrationNumber() != null ? car.getRegistrationNumber() : "") + "?")
                .setPositiveButton("Delete", (d, w) -> {
                    RetrofitClient.getApiService(new AuthRepository(requireContext()).getSessionPreferences())
                            .deleteCar(car.getId()).enqueue(new Callback<Void>() {
                        @Override
                        public void onResponse(Call<Void> call, Response<Void> response) {
                            if (getActivity() != null) {
                                if (response.isSuccessful()) {
                                    loadCars();
                                    Toast.makeText(requireContext(), "Car deleted", Toast.LENGTH_SHORT).show();
                                } else {
                                    Toast.makeText(requireContext(), "Failed to delete", Toast.LENGTH_SHORT).show();
                                }
                            }
                        }
                        @Override
                        public void onFailure(Call<Void> call, Throwable t) {
                            if (getActivity() != null)
                                Toast.makeText(requireContext(), "Network error", Toast.LENGTH_SHORT).show();
                        }
                    });
                })
                .setNegativeButton("Cancel", null)
                .show();
    }

    private void loadCars() {
        RetrofitClient.getApiService(new AuthRepository(requireContext()).getSessionPreferences())
                .getCars(null).enqueue(new Callback<List<Car>>() {
            @Override
            public void onResponse(Call<List<Car>> call, Response<List<Car>> response) {
                if (response.isSuccessful() && response.body() != null) {
                    cars = response.body();
                    carsAdapter.setCars(cars);
                }
            }
            @Override
            public void onFailure(Call<List<Car>> call, Throwable t) { }
        });
    }
}
