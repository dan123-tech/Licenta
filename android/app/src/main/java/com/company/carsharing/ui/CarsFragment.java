package com.company.carsharing.ui;

import android.os.Bundle;
import android.text.Editable;
import android.text.TextWatcher;
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

import com.company.carsharing.R;
import com.company.carsharing.data.SessionHolder;
import com.company.carsharing.data.repository.AuthRepository;
import com.company.carsharing.databinding.FragmentCarsBinding;
import com.company.carsharing.models.Car;
import com.company.carsharing.network.RetrofitClient;

import java.util.HashMap;
import java.util.List;
import java.util.Locale;
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
        if (getActivity() instanceof MainActivity) ((MainActivity) getActivity()).setToolbarTitle(getString(R.string.nav_cars));
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
        String[] fuelApi = getResources().getStringArray(R.array.fuel_type_api);
        String[] fuelLabels = new String[]{
                getString(R.string.fuel_type_benzine),
                getString(R.string.fuel_type_diesel),
                getString(R.string.fuel_type_electric),
                getString(R.string.fuel_type_hybrid)
        };
        fuelSpinner.setAdapter(new ArrayAdapter<>(requireContext(), android.R.layout.simple_spinner_dropdown_item, fuelLabels));
        regEt.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {
            }

            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {
            }

            @Override
            public void afterTextChanged(Editable s) {
                String u = s.toString().toUpperCase(Locale.ROOT);
                if (!u.equals(s.toString())) {
                    regEt.removeTextChangedListener(this);
                    regEt.setText(u);
                    try {
                        regEt.setSelection(u.length());
                    } catch (Exception ignored) {
                    }
                    regEt.addTextChangedListener(this);
                }
            }
        });
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
            String reg = regEt.getText() != null ? regEt.getText().toString().trim().toUpperCase(Locale.ROOT) : "";
            String kmStr = kmEt.getText() != null ? kmEt.getText().toString().trim() : "";
            String consumptionStr = consumptionEt.getText() != null ? consumptionEt.getText().toString().trim() : "";
            if (brand.isEmpty()) { errorTv.setText(R.string.brand_required); errorTv.setVisibility(View.VISIBLE); return; }
            if (reg.isEmpty()) { errorTv.setText(R.string.registration_required); errorTv.setVisibility(View.VISIBLE); return; }
            int km = 0;
            try { if (!kmStr.isEmpty()) km = Integer.parseInt(kmStr); } catch (NumberFormatException e) { km = 0; }
            Double consumption = null;
            if (!consumptionStr.isEmpty()) {
                try { consumption = Double.parseDouble(consumptionStr.replace(",", ".")); } catch (NumberFormatException ignored) { }
            }
            int fuelPos = fuelSpinner.getSelectedItemPosition();
            String fuelType = fuelApi[fuelPos >= 0 && fuelPos < fuelApi.length ? fuelPos : 0];
            Map<String, Object> body = new HashMap<>();
            body.put("brand", brand);
            body.put("registrationNumber", reg);
            body.put("km", km);
            body.put("status", "AVAILABLE");
            body.put("fuelType", fuelType);
            if (consumption != null) body.put("averageConsumptionL100km", consumption);
            RetrofitClient.getApiService(new AuthRepository(requireContext()).getSessionPreferences())
                    .addCar(body).enqueue(new Callback<Car>() {
                @Override
                public void onResponse(Call<Car> call, Response<Car> response) {
                    if (getActivity() == null) return;
                    if (response.isSuccessful()) {
                        dialog.dismiss();
                        loadCars();
                        Toast.makeText(requireContext(), R.string.car_added, Toast.LENGTH_SHORT).show();
                    } else {
                        errorTv.setText(response.code() == 400 ? R.string.invalid_data : R.string.failed_add_car);
                        errorTv.setVisibility(View.VISIBLE);
                    }
                }
                @Override
                public void onFailure(Call<Car> call, Throwable t) {
                    if (getActivity() != null) {
                        errorTv.setText(R.string.network_error_short);
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
        String[] statusApi = getResources().getStringArray(R.array.car_status_api);
        String[] statusLabels = new String[]{
                getString(R.string.car_status_available),
                getString(R.string.car_status_reserved),
                getString(R.string.car_status_maintenance)
        };
        statusSpinner.setAdapter(new ArrayAdapter<>(requireContext(), android.R.layout.simple_spinner_dropdown_item, statusLabels));
        for (int i = 0; i < statusApi.length; i++) {
            if (statusApi[i].equals(car.getStatus())) { statusSpinner.setSelection(i); break; }
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
            int stPos = statusSpinner.getSelectedItemPosition();
            String status = statusApi[stPos >= 0 && stPos < statusApi.length ? stPos : 0];
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
                        Toast.makeText(requireContext(), R.string.car_updated, Toast.LENGTH_SHORT).show();
                    } else {
                        errorTv.setText(R.string.failed_update);
                        errorTv.setVisibility(View.VISIBLE);
                    }
                }
                @Override
                public void onFailure(Call<Car> call, Throwable t) {
                    if (getActivity() != null) {
                        errorTv.setText(R.string.network_error_short);
                        errorTv.setVisibility(View.VISIBLE);
                    }
                }
            });
        });
        dialog.show();
    }

    @Override
    public void onDelete(Car car) {
        String plate = car.getRegistrationNumber() != null ? car.getRegistrationNumber() : "";
        new AlertDialog.Builder(requireContext())
                .setTitle(R.string.delete_car_title)
                .setMessage(getString(R.string.delete_car_message_fmt, car.getBrand(), plate))
                .setPositiveButton(R.string.delete, (d, w) -> {
                    RetrofitClient.getApiService(new AuthRepository(requireContext()).getSessionPreferences())
                            .deleteCar(car.getId()).enqueue(new Callback<Void>() {
                        @Override
                        public void onResponse(Call<Void> call, Response<Void> response) {
                            if (getActivity() != null) {
                                if (response.isSuccessful()) {
                                    loadCars();
                                    Toast.makeText(requireContext(), R.string.car_deleted, Toast.LENGTH_SHORT).show();
                                } else {
                                    Toast.makeText(requireContext(), R.string.failed_delete, Toast.LENGTH_SHORT).show();
                                }
                            }
                        }
                        @Override
                        public void onFailure(Call<Void> call, Throwable t) {
                            if (getActivity() != null)
                                Toast.makeText(requireContext(), R.string.network_error, Toast.LENGTH_SHORT).show();
                        }
                    });
                })
                .setNegativeButton(R.string.cancel, null)
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
