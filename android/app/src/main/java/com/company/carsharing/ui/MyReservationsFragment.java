package com.company.carsharing.ui;

import android.Manifest;
import android.app.DatePickerDialog;
import android.app.TimePickerDialog;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ArrayAdapter;
import android.widget.Spinner;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AlertDialog;
import androidx.core.content.ContextCompat;
import androidx.fragment.app.Fragment;

import com.company.carsharing.data.repository.AuthRepository;
import com.company.carsharing.databinding.FragmentMyReservationsBinding;
import com.company.carsharing.models.Car;
import com.company.carsharing.models.Reservation;
import com.company.carsharing.models.User;
import com.company.carsharing.network.RetrofitClient;
import com.company.carsharing.reminders.ReservationAlarmScheduler;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

import java.util.ArrayList;
import java.util.Calendar;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.TimeZone;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class MyReservationsFragment extends Fragment implements ReservationsAdapter.OnReservationActionListener {
    private FragmentMyReservationsBinding binding;
    private ReservationsAdapter adapter;

    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        binding = FragmentMyReservationsBinding.inflate(inflater, container, false);
        if (getActivity() instanceof MainActivity) ((MainActivity) getActivity()).setToolbarTitle("My Reservations");
        adapter = new ReservationsAdapter(requireContext(), this);
        binding.reservationsList.setAdapter(adapter);
        binding.fabNewReservation.setOnClickListener(v -> showCreateDialog());
        loadReservations();
        return binding.getRoot();
    }

    private static java.text.SimpleDateFormat isoFormat() {
        java.text.SimpleDateFormat f = new java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US);
        f.setTimeZone(TimeZone.getTimeZone("UTC"));
        return f;
    }

    private void showCreateDialog() {
        View dialogView = LayoutInflater.from(requireContext()).inflate(com.company.carsharing.R.layout.dialog_create_reservation, null);
        Spinner carSpinner = dialogView.findViewById(com.company.carsharing.R.id.dialog_res_car);
        com.google.android.material.textfield.TextInputEditText purposeEt = dialogView.findViewById(com.company.carsharing.R.id.dialog_res_purpose_et);
        com.google.android.material.textfield.TextInputEditText startEt = dialogView.findViewById(com.company.carsharing.R.id.dialog_res_start);
        com.google.android.material.textfield.TextInputEditText endEt = dialogView.findViewById(com.company.carsharing.R.id.dialog_res_end);
        TextView errorTv = dialogView.findViewById(com.company.carsharing.R.id.dialog_res_error);
        View cancelBtn = dialogView.findViewById(com.company.carsharing.R.id.dialog_res_cancel);
        View saveBtn = dialogView.findViewById(com.company.carsharing.R.id.dialog_res_save);

        long[] startMs = { 0 };
        long[] endMs = { 0 };
        java.text.SimpleDateFormat displayFmt = new java.text.SimpleDateFormat("dd/MM/yyyy HH:mm", Locale.getDefault());
        View.OnClickListener pickStart = v -> pickDateTime(requireContext(), startMs[0] > 0 ? startMs[0] : System.currentTimeMillis(), (year, month, day, hour, minute) -> {
            Calendar c = Calendar.getInstance();
            c.set(year, month, day, hour, minute, 0);
            c.set(Calendar.MILLISECOND, 0);
            startMs[0] = c.getTimeInMillis();
            startEt.setText(displayFmt.format(c.getTime()));
        });
        View.OnClickListener pickEnd = v -> pickDateTime(requireContext(), endMs[0] > 0 ? endMs[0] : (startMs[0] > 0 ? startMs[0] + 3600000 : System.currentTimeMillis() + 3600000), (year, month, day, hour, minute) -> {
            Calendar c = Calendar.getInstance();
            c.set(year, month, day, hour, minute, 0);
            c.set(Calendar.MILLISECOND, 0);
            endMs[0] = c.getTimeInMillis();
            endEt.setText(displayFmt.format(c.getTime()));
        });
        if (startEt != null) startEt.setOnClickListener(pickStart);
        if (endEt != null) endEt.setOnClickListener(pickEnd);

        RetrofitClient.getApiService(new AuthRepository(requireContext()).getSessionPreferences())
                .getCars("AVAILABLE").enqueue(new Callback<List<Car>>() {
            @Override
            public void onResponse(Call<List<Car>> call, Response<List<Car>> response) {
                if (getActivity() == null) return;
                if (!response.isSuccessful() || response.body() == null) return;
                List<Car> cars = response.body();
                if (cars.isEmpty()) {
                    Toast.makeText(requireContext(), "No available cars", Toast.LENGTH_SHORT).show();
                    return;
                }
                List<String> labels = new ArrayList<>();
                for (Car c : cars) labels.add(c.getBrand() + " " + (c.getRegistrationNumber() != null ? c.getRegistrationNumber() : c.getId()));
                carSpinner.setAdapter(new ArrayAdapter<>(requireContext(), android.R.layout.simple_spinner_dropdown_item, labels));
                AlertDialog dialog = new AlertDialog.Builder(requireContext()).setView(dialogView).setCancelable(true).create();
                cancelBtn.setOnClickListener(v -> dialog.dismiss());
                saveBtn.setOnClickListener(v -> {
                    errorTv.setVisibility(View.GONE);
                    int pos = carSpinner.getSelectedItemPosition();
                    if (pos < 0 || pos >= cars.size()) {
                        errorTv.setText("Select a car");
                        errorTv.setVisibility(View.VISIBLE);
                        return;
                    }
                    Car selected = cars.get(pos);
                    String purpose = purposeEt.getText() != null ? purposeEt.getText().toString().trim() : "";
                    Map<String, Object> body = new HashMap<>();
                    body.put("carId", selected.getId());
                    if (!purpose.isEmpty()) body.put("purpose", purpose);
                    if (startMs[0] > 0 && endMs[0] > 0) {
                        if (endMs[0] <= startMs[0]) {
                            errorTv.setText("End must be after start");
                            errorTv.setVisibility(View.VISIBLE);
                            return;
                        }
                        body.put("startDate", isoFormat().format(new java.util.Date(startMs[0])));
                        body.put("endDate", isoFormat().format(new java.util.Date(endMs[0])));
                    }
                    RetrofitClient.getApiService(new AuthRepository(requireContext()).getSessionPreferences())
                            .createReservation(body).enqueue(new Callback<Reservation>() {
                        @Override
                        public void onResponse(Call<Reservation> call, Response<Reservation> response) {
                            if (getActivity() == null) return;
                            if (response.isSuccessful()) {
                                dialog.dismiss();
                                loadReservations();
                                Toast.makeText(requireContext(), "Reservation created", Toast.LENGTH_SHORT).show();
                            } else {
                                errorTv.setText("Failed to create reservation");
                                errorTv.setVisibility(View.VISIBLE);
                            }
                        }
                        @Override
                        public void onFailure(Call<Reservation> call, Throwable t) {
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
            public void onFailure(Call<List<Car>> call, Throwable t) {
                if (getActivity() != null) Toast.makeText(requireContext(), "Failed to load cars", Toast.LENGTH_SHORT).show();
            }
        });
    }

    private interface DateTimeCallback {
        void onPicked(int year, int month, int day, int hour, int minute);
    }

    private void pickDateTime(android.content.Context context, long initialMs, DateTimeCallback callback) {
        Calendar cal = Calendar.getInstance();
        cal.setTimeInMillis(initialMs);
        DatePickerDialog dateDialog = new DatePickerDialog(context, (view, year, month, dayOfMonth) -> {
            TimePickerDialog timeDialog = new TimePickerDialog(context, (v, hour, minute) -> callback.onPicked(year, month, dayOfMonth, hour, minute), cal.get(Calendar.HOUR_OF_DAY), cal.get(Calendar.MINUTE), true);
            timeDialog.show();
        }, cal.get(Calendar.YEAR), cal.get(Calendar.MONTH), cal.get(Calendar.DAY_OF_MONTH));
        dateDialog.show();
    }

    @Override
    public void onRelease(Reservation r) {
        int fallbackKm = r.getCar() != null ? r.getCar().getKm() : 0;
        AuthRepository authRepo = new AuthRepository(requireContext());
        RetrofitClient.getApiService(authRepo.getSessionPreferences())
                .getCar(r.getCarId())
                .enqueue(new Callback<Car>() {
                    @Override
                    public void onResponse(@NonNull Call<Car> call, @NonNull Response<Car> response) {
                        int km = fallbackKm;
                        if (response.isSuccessful() && response.body() != null) {
                            km = response.body().getKm();
                        }
                        if (getActivity() == null) return;
                        showReleaseReservationDialog(r, km);
                    }

                    @Override
                    public void onFailure(@NonNull Call<Car> call, @NonNull Throwable t) {
                        if (getActivity() == null) return;
                        showReleaseReservationDialog(r, fallbackKm);
                    }
                });
    }

    private void showReleaseReservationDialog(Reservation r, int lastKnownKm) {
        View dialogView = LayoutInflater.from(requireContext()).inflate(com.company.carsharing.R.layout.dialog_release_reservation, null);
        TextView currentKmTv = dialogView.findViewById(com.company.carsharing.R.id.dialog_release_current_km);
        currentKmTv.setText("Last known odometer: " + lastKnownKm + " km (must be ≥ this)");
        com.google.android.material.textfield.TextInputEditText newKmEt = dialogView.findViewById(com.company.carsharing.R.id.dialog_release_new_km_et);
        newKmEt.setText(String.valueOf(lastKnownKm));
        com.google.android.material.textfield.TextInputEditText reasonEt = dialogView.findViewById(com.company.carsharing.R.id.dialog_release_reason_et);
        TextView errorTv = dialogView.findViewById(com.company.carsharing.R.id.dialog_release_error);
        View cancelBtn = dialogView.findViewById(com.company.carsharing.R.id.dialog_release_cancel);
        View saveBtn = dialogView.findViewById(com.company.carsharing.R.id.dialog_release_save);

        AlertDialog dialog = new AlertDialog.Builder(requireContext()).setView(dialogView).setCancelable(true).create();
        cancelBtn.setOnClickListener(v -> dialog.dismiss());
        saveBtn.setOnClickListener(v -> {
            errorTv.setVisibility(View.GONE);
            String newKmStr = newKmEt.getText() != null ? newKmEt.getText().toString().trim() : "";
            int newKm;
            try {
                newKm = Integer.parseInt(newKmStr);
            } catch (NumberFormatException e) {
                errorTv.setText("Enter a valid odometer number");
                errorTv.setVisibility(View.VISIBLE);
                return;
            }
            if (newKm < lastKnownKm) {
                errorTv.setText("Odometer must be greater than or equal to " + lastKnownKm + " km");
                errorTv.setVisibility(View.VISIBLE);
                return;
            }
            String reason = reasonEt.getText() != null ? reasonEt.getText().toString().trim() : "";
            Map<String, Object> body = new HashMap<>();
            body.put("action", "release");
            body.put("newKm", newKm);
            if (!reason.isEmpty()) body.put("exceededReason", reason);
            RetrofitClient.getApiService(new AuthRepository(requireContext()).getSessionPreferences())
                    .updateReservation(r.getId(), body).enqueue(new Callback<Map<String, Object>>() {
                        @Override
                        public void onResponse(@NonNull Call<Map<String, Object>> call, @NonNull Response<Map<String, Object>> response) {
                            if (getActivity() == null) return;
                            if (response.isSuccessful()) {
                                dialog.dismiss();
                                loadReservations();
                                Toast.makeText(requireContext(), "Car released", Toast.LENGTH_SHORT).show();
                            } else {
                                String apiErr = parseApiErrorMessage(response);
                                errorTv.setText(apiErr != null ? apiErr : (response.code() == 422 ? "Invalid km or reason required" : "Failed to release"));
                                errorTv.setVisibility(View.VISIBLE);
                            }
                        }

                        @Override
                        public void onFailure(@NonNull Call<Map<String, Object>> call, @NonNull Throwable t) {
                            if (getActivity() != null) {
                                errorTv.setText("Network error");
                                errorTv.setVisibility(View.VISIBLE);
                            }
                        }
                    });
        });
        dialog.show();
    }

    private static String parseApiErrorMessage(Response<?> response) {
        try {
            if (response.errorBody() == null) return null;
            String raw = response.errorBody().string();
            JsonObject o = JsonParser.parseString(raw).getAsJsonObject();
            if (o.has("error") && !o.get("error").isJsonNull()) {
                return o.get("error").getAsString();
            }
        } catch (Exception ignored) {
        }
        return null;
    }

    @Override
    public void onRequestCodes(Reservation r) {
        Map<String, Object> body = new HashMap<>();
        body.put("action", "refreshCodes");
        RetrofitClient.getApiService(new AuthRepository(requireContext()).getSessionPreferences())
                .updateReservation(r.getId(), body).enqueue(new Callback<Map<String, Object>>() {
            @Override
            public void onResponse(Call<Map<String, Object>> call, Response<Map<String, Object>> response) {
                if (getActivity() != null) {
                    if (response.isSuccessful()) {
                        loadReservations();
                        Toast.makeText(requireContext(), "Codes updated", Toast.LENGTH_SHORT).show();
                    } else {
                        String msg = "Could not get codes";
                        try {
                            if (response.errorBody() != null) {
                                String body = response.errorBody().string();
                                if (body != null && body.contains("error")) {
                                    int i = body.indexOf("\"error\":\"");
                                    if (i >= 0) {
                                        int j = body.indexOf("\"", i + 9);
                                        if (j > i + 9) msg = body.substring(i + 9, j);
                                    }
                                }
                            }
                        } catch (Exception ignored) { }
                        Toast.makeText(requireContext(), msg, Toast.LENGTH_SHORT).show();
                    }
                }
            }
            @Override
            public void onFailure(Call<Map<String, Object>> call, Throwable t) {
                if (getActivity() != null) Toast.makeText(requireContext(), "Network error", Toast.LENGTH_SHORT).show();
            }
        });
    }

    @Override
    public void onCancel(Reservation r) {
        new AlertDialog.Builder(requireContext())
                .setTitle("Cancel reservation")
                .setMessage("Cancel this reservation?")
                .setPositiveButton("Cancel reservation", (d, w) -> {
                    Map<String, Object> body = new HashMap<>();
                    body.put("action", "cancel");
                    RetrofitClient.getApiService(new AuthRepository(requireContext()).getSessionPreferences())
                            .updateReservation(r.getId(), body).enqueue(new Callback<Map<String, Object>>() {
                        @Override
                        public void onResponse(Call<Map<String, Object>> call, Response<Map<String, Object>> response) {
                            if (getActivity() != null) {
                                if (response.isSuccessful()) {
                                    loadReservations();
                                    Toast.makeText(requireContext(), "Reservation cancelled", Toast.LENGTH_SHORT).show();
                                } else {
                                    Toast.makeText(requireContext(), "Failed to cancel", Toast.LENGTH_SHORT).show();
                                }
                            }
                        }
                        @Override
                        public void onFailure(Call<Map<String, Object>> call, Throwable t) {
                            if (getActivity() != null) Toast.makeText(requireContext(), "Network error", Toast.LENGTH_SHORT).show();
                        }
                    });
                })
                .setNegativeButton("Keep", null)
                .show();
    }

    private void loadReservations() {
        RetrofitClient.getApiService(new AuthRepository(requireContext()).getSessionPreferences())
                .getReservations(null).enqueue(new Callback<List<Reservation>>() {
            @Override
            public void onResponse(Call<List<Reservation>> call, Response<List<Reservation>> response) {
                if (response.isSuccessful() && response.body() != null) {
                    adapter.setReservations(response.body());
                    binding.emptyText.setVisibility(response.body().isEmpty() ? View.VISIBLE : View.GONE);
                    if (Build.VERSION.SDK_INT >= 33
                            && ContextCompat.checkSelfPermission(requireContext(), Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                        requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS}, 1001);
                    }
                    AuthRepository repo = new AuthRepository(requireContext());
                    User u = repo.getSessionPreferences().getUser();
                    if (u != null && u.getId() != null) {
                        ReservationAlarmScheduler.schedule(requireContext(), response.body(), u.getId());
                    }
                }
            }
            @Override
            public void onFailure(Call<List<Reservation>> call, Throwable t) { }
        });
    }
}
