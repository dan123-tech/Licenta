package com.company.carsharing.ui;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.fragment.app.Fragment;

import com.company.carsharing.R;
import com.company.carsharing.data.SessionHolder;
import com.company.carsharing.data.repository.AuthRepository;
import com.company.carsharing.databinding.FragmentAvailableCarsBinding;
import com.company.carsharing.models.Car;
import com.company.carsharing.network.RetrofitClient;

import java.util.List;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class AvailableCarsFragment extends Fragment {
    private FragmentAvailableCarsBinding binding;
    private AvailableCarsAdapter adapter;

    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        binding = FragmentAvailableCarsBinding.inflate(inflater, container, false);
        if (getActivity() instanceof MainActivity) ((MainActivity) getActivity()).setToolbarTitle(getString(R.string.nav_available_cars));
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
                if (binding == null) return;
                if (response.isSuccessful() && response.body() != null) {
                    adapter.setCars(response.body());
                    boolean empty = response.body().isEmpty();
                    binding.availableCarsEmpty.setVisibility(empty ? View.VISIBLE : View.GONE);
                    binding.availableCarsList.setVisibility(empty ? View.GONE : View.VISIBLE);
                } else {
                    binding.availableCarsEmpty.setText(getString(R.string.could_not_load_cars_http, response.code()));
                    binding.availableCarsEmpty.setVisibility(View.VISIBLE);
                    binding.availableCarsList.setVisibility(View.GONE);
                }
            }
            @Override
            public void onFailure(Call<List<Car>> call, Throwable t) {
                if (binding == null || getActivity() == null) return;
                binding.availableCarsEmpty.setText(getString(R.string.network_error_fmt,
                        t.getMessage() != null ? t.getMessage() : getString(R.string.check_connection)));
                binding.availableCarsEmpty.setVisibility(View.VISIBLE);
                binding.availableCarsList.setVisibility(View.GONE);
                Toast.makeText(requireContext(), getString(R.string.failed_load_available_cars), Toast.LENGTH_SHORT).show();
            }
        });
    }

    private void reserve(Car car) {
        if (SessionHolder.getUser() != null && "APPROVED".equalsIgnoreCase(SessionHolder.getUser().getDrivingLicenceStatus())) {
            ReservationScheduleDialog.show(this, car, this::loadCars);
        } else {
            Toast.makeText(requireContext(), getString(R.string.driving_licence_required), Toast.LENGTH_SHORT).show();
        }
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        binding = null;
    }
}
