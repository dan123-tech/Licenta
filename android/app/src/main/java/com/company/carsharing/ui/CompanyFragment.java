package com.company.carsharing.ui;

import android.content.Intent;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.EditText;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.fragment.app.Fragment;

import com.company.carsharing.R;
import com.company.carsharing.data.SessionHolder;
import com.company.carsharing.data.repository.AuthRepository;
import com.company.carsharing.databinding.FragmentCompanyBinding;
import com.company.carsharing.models.Company;
import com.company.carsharing.models.Reservation;
import com.company.carsharing.network.RetrofitClient;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class CompanyFragment extends Fragment {

    private FragmentCompanyBinding binding;
    private AuthRepository authRepo;

    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        binding = FragmentCompanyBinding.inflate(inflater, container, false);
        return binding.getRoot();
    }

    @Override
    public void onViewCreated(@NonNull View view, Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);
        if (getActivity() instanceof MainActivity) ((MainActivity) getActivity()).setToolbarTitle("Company");
        android.content.Context ctx = getContext();
        if (ctx == null) return;
        authRepo = new AuthRepository(ctx);
        Company c = SessionHolder.getCompany();
        if (c != null) {
            binding.joinCode.setText(c.getJoinCode() != null ? c.getJoinCode() : "");
            View shareBtn = binding.getRoot().findViewById(R.id.btnShareJoinCode);
            if (shareBtn != null) {
                shareBtn.setVisibility(View.VISIBLE);
                shareBtn.setOnClickListener(v -> shareJoinCode(c.getJoinCode()));
            }
            binding.defaultKm.setText(String.valueOf(c.getDefaultKmUsage()));
            binding.fuelPrice.setText(c.getAverageFuelPricePerLiter() != null ? String.valueOf(c.getAverageFuelPricePerLiter()) : "");
            binding.defaultConsumption.setText(String.valueOf(c.getDefaultConsumptionL100km()));
            if (!SessionHolder.isAdmin()) {
                binding.labelDefaultKm.setVisibility(View.GONE);
                binding.defaultKm.setVisibility(View.GONE);
                binding.labelFuelPrice.setVisibility(View.GONE);
                binding.fuelPrice.setVisibility(View.GONE);
                binding.labelDefaultConsumption.setVisibility(View.GONE);
                binding.defaultConsumption.setVisibility(View.GONE);
                binding.btnSave.setVisibility(View.GONE);
                binding.pendingApprovalsTitle.setVisibility(View.GONE);
                binding.pendingApprovalsList.setVisibility(View.GONE);
            } else {
                binding.btnSave.setOnClickListener(v -> saveSettings());
                loadPendingApprovals();
            }
        } else {
            binding.joinCode.setText("—");
            binding.labelDefaultKm.setVisibility(View.GONE);
            binding.defaultKm.setVisibility(View.GONE);
            binding.labelFuelPrice.setVisibility(View.GONE);
            binding.fuelPrice.setVisibility(View.GONE);
            binding.labelDefaultConsumption.setVisibility(View.GONE);
            binding.defaultConsumption.setVisibility(View.GONE);
            binding.btnSave.setVisibility(View.GONE);
            binding.pendingApprovalsTitle.setVisibility(View.GONE);
            binding.pendingApprovalsList.setVisibility(View.GONE);
            View shareBtn = binding.getRoot().findViewById(R.id.btnShareJoinCode);
            if (shareBtn != null) shareBtn.setVisibility(View.GONE);
        }
    }

    private void shareJoinCode(String joinCode) {
        if (joinCode == null) joinCode = "";
        Intent share = new Intent(Intent.ACTION_SEND);
        share.setType("text/plain");
        share.putExtra(Intent.EXTRA_TEXT, "Join our company car sharing. Use code: " + joinCode);
        share.putExtra(Intent.EXTRA_SUBJECT, "Car sharing join code");
        startActivity(Intent.createChooser(share, "Share join code"));
    }

    private void saveSettings() {
        int km = 100;
        try { km = Integer.parseInt(binding.defaultKm.getText().toString().trim()); } catch (Exception ignored) { }
        Double fuel = null;
        try { fuel = Double.parseDouble(binding.fuelPrice.getText().toString().trim().replace(",", ".")); } catch (Exception ignored) { }
        Double consumption = null;
        try { consumption = Double.parseDouble(binding.defaultConsumption.getText().toString().trim().replace(",", ".")); } catch (Exception ignored) { }
        Map<String, Object> body = new HashMap<>();
        body.put("defaultKmUsage", km);
        body.put("averageFuelPricePerLiter", fuel);
        if (consumption != null) body.put("defaultConsumptionL100km", consumption);
        RetrofitClient.getApiService(authRepo.getSessionPreferences())
                .updateCompanyCurrent(body).enqueue(new Callback<Company>() {
            @Override
            public void onResponse(Call<Company> call, Response<Company> response) {
                if (getActivity() == null || !isAdded() || binding == null) return;
                if (response.isSuccessful()) {
                    Toast.makeText(getContext(), "Saved", Toast.LENGTH_SHORT).show();
                    if (response.body() != null) SessionHolder.set(SessionHolder.getUser(), response.body());
                } else binding.companyError.setVisibility(View.VISIBLE);
            }
            @Override
            public void onFailure(Call<Company> call, Throwable t) {
                if (getActivity() != null && isAdded() && binding != null) binding.companyError.setVisibility(View.VISIBLE);
            }
        });
    }

    private void loadPendingApprovals() {
        RetrofitClient.getApiService(authRepo.getSessionPreferences())
                .getPendingExceededApprovals().enqueue(new Callback<List<Reservation>>() {
            @Override
            public void onResponse(Call<List<Reservation>> call, Response<List<Reservation>> response) {
                if (getActivity() == null || !isAdded() || binding == null) return;
                if (response.isSuccessful() && response.body() != null && !response.body().isEmpty()) {
                    binding.pendingApprovalsTitle.setVisibility(View.VISIBLE);
                    binding.pendingApprovalsList.setVisibility(View.VISIBLE);
                    binding.pendingApprovalsList.removeAllViews();
                    android.content.Context ctx = getContext();
                    if (ctx == null) return;
                    for (Reservation r : response.body()) {
                        View card = LayoutInflater.from(ctx).inflate(R.layout.item_pending_approval, binding.pendingApprovalsList, false);
                        String userCar = (r.getUser() != null ? r.getUser().getName() : "User") + " – " + (r.getCar() != null ? r.getCar().getBrand() + " " + r.getCar().getRegistrationNumber() : "");
                        String kmReason = (r.getReleasedKmUsed() != null ? r.getReleasedKmUsed() + " km" : "") + (r.getReleasedExceededReason() != null ? " • " + r.getReleasedExceededReason() : "");
                        TextView userCarTv = card.findViewById(R.id.pending_user_car);
                        TextView kmReasonTv = card.findViewById(R.id.pending_km_reason);
                        EditText obs = card.findViewById(R.id.pending_observations);
                        View approveBtn = card.findViewById(R.id.btnApprove);
                        View rejectBtn = card.findViewById(R.id.btnReject);
                        if (userCarTv != null) userCarTv.setText(userCar);
                        if (kmReasonTv != null) kmReasonTv.setText(kmReason);
                        if (approveBtn != null) {
                            approveBtn.setOnClickListener(v -> setExceededApproval(
                                    r.getId(),
                                    "approveExceeded",
                                    obs != null && obs.getText() != null ? obs.getText().toString().trim() : "",
                                    card
                            ));
                        }
                        if (rejectBtn != null) {
                            rejectBtn.setOnClickListener(v -> setExceededApproval(
                                    r.getId(),
                                    "rejectExceeded",
                                    obs != null && obs.getText() != null ? obs.getText().toString().trim() : "",
                                    card
                            ));
                        }
                        binding.pendingApprovalsList.addView(card);
                    }
                } else {
                    binding.pendingApprovalsTitle.setVisibility(View.GONE);
                    binding.pendingApprovalsList.setVisibility(View.GONE);
                }
            }
            @Override
            public void onFailure(Call<List<Reservation>> call, Throwable t) {
                if (getActivity() != null && isAdded()) {
                    Toast.makeText(requireContext(), "Failed to load approvals", Toast.LENGTH_SHORT).show();
                    binding.pendingApprovalsTitle.setVisibility(View.GONE);
                    binding.pendingApprovalsList.setVisibility(View.GONE);
                }
            }
        });
    }

    private void setExceededApproval(String reservationId, String action, String observations, View card) {
        if (reservationId == null || reservationId.isEmpty()) {
            if (getActivity() != null && isAdded()) {
                Toast.makeText(requireContext(), "Invalid reservation id", Toast.LENGTH_SHORT).show();
            }
            return;
        }
        Map<String, Object> body = new HashMap<>();
        body.put("action", action);
        if (!observations.isEmpty()) body.put("observations", observations);
        RetrofitClient.getApiService(authRepo.getSessionPreferences())
                .updateReservation(reservationId, body).enqueue(new Callback<Map<String, Object>>() {
            @Override
            public void onResponse(Call<Map<String, Object>> call, Response<Map<String, Object>> response) {
                if (getActivity() == null || !isAdded() || binding == null) return;
                if (response.isSuccessful()) {
                    Toast.makeText(getContext(), action.equals("approveExceeded") ? "Approved" : "Rejected", Toast.LENGTH_SHORT).show();
                    binding.pendingApprovalsList.removeView(card);
                    if (binding.pendingApprovalsList.getChildCount() == 0) {
                        binding.pendingApprovalsTitle.setVisibility(View.GONE);
                        binding.pendingApprovalsList.setVisibility(View.GONE);
                    }
                }
            }
            @Override
            public void onFailure(Call<Map<String, Object>> call, Throwable t) {
                if (getActivity() != null) Toast.makeText(getContext(), t.getMessage() != null ? t.getMessage() : "Failed", Toast.LENGTH_SHORT).show();
            }
        });
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        binding = null;
    }
}
