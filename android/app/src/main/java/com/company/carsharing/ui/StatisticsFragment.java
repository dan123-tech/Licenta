package com.company.carsharing.ui;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.LinearLayout;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.fragment.app.Fragment;

import com.company.carsharing.data.SessionHolder;
import com.company.carsharing.data.repository.AuthRepository;
import com.company.carsharing.databinding.FragmentStatisticsBinding;
import com.company.carsharing.models.Car;
import com.company.carsharing.models.Company;
import com.company.carsharing.models.Reservation;
import com.company.carsharing.network.RetrofitClient;

import java.util.ArrayList;
import java.util.Calendar;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class StatisticsFragment extends Fragment {
    private FragmentStatisticsBinding binding;

    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        binding = FragmentStatisticsBinding.inflate(inflater, container, false);
        if (getActivity() instanceof MainActivity) ((MainActivity) getActivity()).setToolbarTitle("Statistics");
        View downloadBtn = binding.getRoot().findViewById(com.company.carsharing.R.id.stat_download);
        if (downloadBtn != null) downloadBtn.setOnClickListener(v -> {
            android.content.Intent share = new android.content.Intent(android.content.Intent.ACTION_SEND);
            share.setType("text/plain");
            share.putExtra(android.content.Intent.EXTRA_TEXT, buildStatsText());
            startActivity(android.content.Intent.createChooser(share, "Share statistics"));
        });
        loadData();
        return binding.getRoot();
    }

    private void loadData() {
        binding.statLoading.setVisibility(View.VISIBLE);
        binding.statActive.setText("–");
        binding.statKm.setText("–");
        binding.statFuel.setText("–");
        binding.statLeaderboard.removeAllViews();

        RetrofitClient.getApiService(new AuthRepository(requireContext()).getSessionPreferences())
                .getReservations(null).enqueue(new Callback<List<Reservation>>() {
            @Override
            public void onResponse(Call<List<Reservation>> call, Response<List<Reservation>> response) {
                if (!response.isSuccessful() || response.body() == null) {
                    binding.statLoading.setText("Failed to load reservations");
                    binding.statLoading.setVisibility(View.VISIBLE);
                    return;
                }
                List<Reservation> reservations = response.body();
                RetrofitClient.getApiService(new AuthRepository(requireContext()).getSessionPreferences())
                        .getCars(null).enqueue(new Callback<List<Car>>() {
                    @Override
                    public void onResponse(Call<List<Car>> call, Response<List<Car>> response) {
                        if (getActivity() == null) return;
                        List<Car> cars = response.isSuccessful() && response.body() != null ? response.body() : new ArrayList<>();
                        Company company = SessionHolder.getCompany();
                        double fuelPrice = company != null && company.getAverageFuelPricePerLiter() != null ? company.getAverageFuelPricePerLiter() : 0;
                        double defaultL100 = company != null ? company.getDefaultConsumptionL100km() : 7.5;
                        Map<String, Car> carMap = new HashMap<>();
                        for (Car c : cars) carMap.put(c.getId(), c);

                        int activeCount = 0;
                        for (Reservation r : reservations) {
                            if ("ACTIVE".equalsIgnoreCase(r.getStatus() != null ? r.getStatus() : "")) activeCount++;
                        }
                        binding.statActive.setText(String.valueOf(activeCount));

                        Calendar cal = Calendar.getInstance();
                        int thisMonth = cal.get(Calendar.MONTH);
                        int thisYear = cal.get(Calendar.YEAR);
                        long totalKmThisMonth = 0;
                        double fuelCostThisMonth = 0;
                        for (Reservation r : reservations) {
                            if (!"COMPLETED".equalsIgnoreCase(r.getStatus() != null ? r.getStatus() : "")) continue;
                            String updated = r.getUpdatedAt();
                            if (updated == null || updated.isEmpty()) continue;
                            try {
                                int rYear = Integer.parseInt(updated.substring(0, 4));
                                int rMonth = Integer.parseInt(updated.substring(5, 7));
                                if (rMonth != thisMonth + 1 || rYear != thisYear) continue;
                            } catch (Exception ignored) {
                                continue;
                            }
                            int km = r.getReleasedKmUsed() != null ? r.getReleasedKmUsed() : 0;
                            totalKmThisMonth += km;
                            String carId = r.getCarId() != null ? r.getCarId() : (r.getCar() != null ? r.getCar().getId() : null);
                            double l100 = defaultL100;
                            if (carId != null && carMap.get(carId) != null && carMap.get(carId).getAverageConsumptionL100km() != null)
                                l100 = carMap.get(carId).getAverageConsumptionL100km();
                            if (km > 0 && fuelPrice > 0) fuelCostThisMonth += (km / 100.0) * l100 * fuelPrice;
                        }
                        binding.statKm.setText(String.format(Locale.getDefault(), "%d km", totalKmThisMonth));
                        binding.statFuel.setText(fuelPrice > 0 ? String.format(Locale.getDefault(), "%.2f", fuelCostThisMonth) + " (price/L: " + fuelPrice + ")" : "–");

                        Map<String, Double> byCarFuelCost = new HashMap<>();
                        for (Reservation r : reservations) {
                            if (!"COMPLETED".equalsIgnoreCase(r.getStatus() != null ? r.getStatus() : "")) continue;
                            String cid = r.getCarId() != null ? r.getCarId() : (r.getCar() != null ? r.getCar().getId() : null);
                            if (cid == null) continue;
                            int km = r.getReleasedKmUsed() != null ? r.getReleasedKmUsed() : 0;
                            double l100 = defaultL100;
                            if (carMap.get(cid) != null && carMap.get(cid).getAverageConsumptionL100km() != null)
                                l100 = carMap.get(cid).getAverageConsumptionL100km();
                            double cost = (km > 0 && fuelPrice > 0) ? (km / 100.0) * l100 * fuelPrice : 0;
                            byCarFuelCost.put(cid, (byCarFuelCost.get(cid) != null ? byCarFuelCost.get(cid) : 0) + cost);
                        }
                        List<CarCost> leaderboard = new ArrayList<>();
                        for (Car c : cars) {
                            double cost = byCarFuelCost.get(c.getId()) != null ? byCarFuelCost.get(c.getId()) : 0;
                            leaderboard.add(new CarCost(c, cost));
                        }
                        leaderboard.sort((a, b) -> Double.compare(b.cost, a.cost));
                        for (int i = 0; i < leaderboard.size(); i++) {
                            CarCost item = leaderboard.get(i);
                            TextView row = new TextView(requireContext());
                            row.setText(String.format(Locale.getDefault(), "%d. %s %s – %.2f", i + 1,
                                    item.car.getBrand(),
                                    item.car.getRegistrationNumber() != null ? item.car.getRegistrationNumber() : "",
                                    item.cost));
                            row.setTextSize(14f);
                            row.setPadding(0, 12, 0, 12);
                            binding.statLeaderboard.addView(row);
                        }
                        binding.statLoading.setVisibility(View.GONE);
                    }
                    @Override
                    public void onFailure(Call<List<Car>> call, Throwable t) {
                        if (getActivity() != null) {
                            binding.statLoading.setText("Error loading cars: " + (t.getMessage() != null ? t.getMessage() : ""));
                            binding.statLoading.setVisibility(View.VISIBLE);
                        }
                    }
                });
            }
            @Override
            public void onFailure(Call<List<Reservation>> call, Throwable t) {
                binding.statLoading.setText("Error: " + (t.getMessage() != null ? t.getMessage() : "network failure"));
                binding.statLoading.setVisibility(View.VISIBLE);
            }
        });
    }

    private String buildStatsText() {
        StringBuilder sb = new StringBuilder();
        sb.append("Statistics\n");
        sb.append("Active: ").append(binding.statActive.getText()).append("\n");
        sb.append("Km this month: ").append(binding.statKm.getText()).append("\n");
        sb.append("Fuel cost: ").append(binding.statFuel.getText()).append("\n");
        return sb.toString();
    }

    private static class CarCost {
        final Car car;
        final double cost;
        CarCost(Car car, double cost) { this.car = car; this.cost = cost; }
    }
}
