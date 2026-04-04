package com.company.carsharing.ui;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.fragment.app.Fragment;

import com.company.carsharing.R;
import com.company.carsharing.data.repository.AuthRepository;
import com.company.carsharing.databinding.FragmentHistoryBinding;
import com.company.carsharing.models.Reservation;
import com.company.carsharing.network.RetrofitClient;

import java.util.List;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class HistoryFragment extends Fragment {
    private FragmentHistoryBinding binding;
    private HistoryAdapter adapter;

    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        binding = FragmentHistoryBinding.inflate(inflater, container, false);
        if (getActivity() instanceof MainActivity) ((MainActivity) getActivity()).setToolbarTitle(getString(R.string.history_screen_title));
        adapter = new HistoryAdapter(requireContext());
        binding.historyList.setAdapter(adapter);
        loadHistory();
        return binding.getRoot();
    }

    private void loadHistory() {
        RetrofitClient.getApiService(new AuthRepository(requireContext()).getSessionPreferences())
                .getReservationHistory().enqueue(new Callback<List<Reservation>>() {
            @Override
            public void onResponse(Call<List<Reservation>> call, Response<List<Reservation>> response) {
                if (response.isSuccessful() && response.body() != null) {
                    adapter.setReservations(response.body());
                }
            }
            @Override
            public void onFailure(Call<List<Reservation>> call, Throwable t) {
                if (getActivity() != null) {
                    Toast.makeText(requireContext(),
                            getString(R.string.history_load_error_fmt,
                                    t.getMessage() != null ? t.getMessage() : getString(R.string.network_error_short)),
                            Toast.LENGTH_SHORT).show();
                }
            }
        });
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        binding = null;
    }
}
