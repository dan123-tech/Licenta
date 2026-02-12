package com.company.carsharing.ui;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ListView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.fragment.app.Fragment;

import com.company.carsharing.data.SessionHolder;
import com.company.carsharing.data.repository.AuthRepository;
import com.company.carsharing.databinding.FragmentAvailableCarsBinding;
import com.company.carsharing.models.Car;
import com.company.carsharing.network.RetrofitClient;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class AvailableCarsFragment extends Fragment {
    private FragmentAvailableCarsBinding binding;
    private AvailableCarsAdapter adapter;

    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        binding = FragmentAvailableCarsBinding.inflate(inflater, container, false);
        if (getActivity() instanceof MainActivity) ((MainActivity) getActivity()).setToolbarTitle("Available Cars");
        adapter = new AvailableCarsAdapter(requireContext(), this::reserve);
        binding.availableCarsList.setAdapter(adapter);
        loadCars();
        return binding.getRoot();
    }

    private void loadCars() {
        RetrofitClient.getApiService(new AuthRepository(requireContext()).getSessionPreferences())
                .getCars("AVAILABLE").enqueue(new Callback<List<Car>>() {
            @Override
            public void onResponse(Call<List<Car>> call, Response<List<Car>> response) {
                if (response.isSuccessful() && response.body() != null) {
                    adapter.setCars(response.body());
                }
            }
            @Override
            public void onFailure(Call<List<Car>> call, Throwable t) { }
        });
    }

    private void reserve(Car car) {
        if (SessionHolder.getUser() != null && "APPROVED".equalsIgnoreCase(SessionHolder.getUser().getDrivingLicenceStatus())) {
            Map<String, Object> body = new HashMap<>();
            body.put("carId", car.getId());
            body.put("purpose", (Object) null);
            RetrofitClient.getApiService(new AuthRepository(requireContext()).getSessionPreferences())
                    .createReservation(body).enqueue(new Callback<com.company.carsharing.models.Reservation>() {
                @Override
                public void onResponse(Call<com.company.carsharing.models.Reservation> call, Response<com.company.carsharing.models.Reservation> response) {
                    if (response.isSuccessful()) {
                        Toast.makeText(requireContext(), "Reserved", Toast.LENGTH_SHORT).show();
                        loadCars();
                    } else Toast.makeText(requireContext(), "Cannot reserve (check driving licence)", Toast.LENGTH_SHORT).show();
                }
                @Override
                public void onFailure(Call<com.company.carsharing.models.Reservation> call, Throwable t) {
                    Toast.makeText(requireContext(), t.getMessage() != null ? t.getMessage() : "Failed", Toast.LENGTH_SHORT).show();
                }
            });
        } else Toast.makeText(requireContext(), "Driving licence must be approved to reserve", Toast.LENGTH_SHORT).show();
    }
}
