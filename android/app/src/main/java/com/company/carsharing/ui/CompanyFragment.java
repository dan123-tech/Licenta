package com.company.carsharing.ui;

import android.content.Intent;
import android.os.Bundle;
import android.util.Log;
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

    private static final String TAG = "CompanyFragment";

    private FragmentCompanyBinding binding;
    private AuthRepository authRepo;
    private Call<List<Reservation>> pendingApprovalsCall;

    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        binding = FragmentCompanyBinding.inflate(inflater, container, false);
        return binding.getRoot();
    }

    @Override
    public void onViewCreated(@NonNull View view, Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);
        if (binding == null) return;

        if (getActivity() instanceof MainActivity) {
            ((MainActivity) getActivity()).setToolbarTitle(getString(R.string.nav_company));
        }

        android.content.Context ctx = getContext();
        if (ctx == null) return;
        authRepo = new AuthRepository(ctx);

        try {
            bindCompanyFromSession();
        } catch (Exception e) {
            Log.e(TAG, "bindCompanyFromSession", e);
            safeToast(ctx, getString(R.string.could_not_load_company_screen));
        }
    }

    private void bindCompanyFromSession() {
        if (binding == null) return;
        Company c = SessionHolder.getCompany();
        if (c != null) {
            binding.joinCode.setText(c.getJoinCode() != null ? c.getJoinCode() : "");
            View shareBtn = binding.btnShareJoinCode;
            shareBtn.setVisibility(View.VISIBLE);
            shareBtn.setOnClickListener(v -> {
                try {
                    shareJoinCode(c.getJoinCode());
                } catch (Exception e) {
                    Log.e(TAG, "shareJoinCode", e);
                    android.content.Context cx = getContext();
                    if (cx != null) Toast.makeText(cx, cx.getString(R.string.could_not_open_share), Toast.LENGTH_SHORT).show();
                }
            });
            binding.defaultKm.setText(String.valueOf(c.getDefaultKmUsage()));
            binding.fuelPrice.setText(c.getAverageFuelPricePerLiter() != null ? String.valueOf(c.getAverageFuelPricePerLiter()) : "");
            binding.defaultConsumption.setText(String.valueOf(c.getDefaultConsumptionL100km()));
            if (!SessionHolder.isAdmin()) {
                hideAdminOnlyUi();
            } else {
                binding.btnSave.setOnClickListener(v -> saveSettings());
                // Run after layout so ScrollView / binding are fully attached (avoids rare timing crashes).
                binding.getRoot().post(this::loadPendingApprovalsSafe);
            }
        } else {
            binding.joinCode.setText(getString(R.string.em_dash));
            hideAdminOnlyUi();
            binding.btnShareJoinCode.setVisibility(View.GONE);
        }
    }

    private void hideAdminOnlyUi() {
        if (binding == null) return;
        binding.labelDefaultKm.setVisibility(View.GONE);
        binding.defaultKm.setVisibility(View.GONE);
        binding.labelFuelPrice.setVisibility(View.GONE);
        binding.fuelPrice.setVisibility(View.GONE);
        binding.labelDefaultConsumption.setVisibility(View.GONE);
        binding.defaultConsumption.setVisibility(View.GONE);
        binding.btnSave.setVisibility(View.GONE);
        binding.pendingApprovalsTitle.setVisibility(View.GONE);
        binding.pendingApprovalsList.setVisibility(View.GONE);
    }

    private void safeToast(android.content.Context ctx, String msg) {
        if (ctx != null) Toast.makeText(ctx, msg, Toast.LENGTH_SHORT).show();
    }

    private void shareJoinCode(String joinCode) {
        if (joinCode == null) joinCode = "";
        Intent share = new Intent(Intent.ACTION_SEND);
        share.setType("text/plain");
        share.putExtra(Intent.EXTRA_TEXT, getString(R.string.join_share_body_fmt, joinCode));
        share.putExtra(Intent.EXTRA_SUBJECT, getString(R.string.join_share_subject));
        startActivity(Intent.createChooser(share, getString(R.string.share_join_code)));
    }

    private void saveSettings() {
        if (binding == null || authRepo == null) return;
        int km = 100;
        try {
            km = Integer.parseInt(binding.defaultKm.getText().toString().trim());
        } catch (Exception ignored) {
        }
        Double fuel = null;
        try {
            fuel = Double.parseDouble(binding.fuelPrice.getText().toString().trim().replace(",", "."));
        } catch (Exception ignored) {
        }
        Double consumption = null;
        try {
            consumption = Double.parseDouble(binding.defaultConsumption.getText().toString().trim().replace(",", "."));
        } catch (Exception ignored) {
        }
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
                            safeToast(getContext(), getString(R.string.saved));
                            if (response.body() != null) SessionHolder.set(SessionHolder.getUser(), response.body());
                        } else {
                            binding.companyError.setText(getString(R.string.could_not_save_settings));
                            binding.companyError.setVisibility(View.VISIBLE);
                        }
                    }

                    @Override
                    public void onFailure(Call<Company> call, Throwable t) {
                        if (!isAdded() || binding == null) return;
                        binding.companyError.setText(t.getMessage() != null ? t.getMessage() : getString(R.string.network_error_short));
                        binding.companyError.setVisibility(View.VISIBLE);
                    }
                });
    }

    private void loadPendingApprovalsSafe() {
        if (!isAdded() || binding == null || authRepo == null) return;
        if (!SessionHolder.isAdmin()) return;
        cancelPendingApprovalsCall();
        pendingApprovalsCall = RetrofitClient.getApiService(authRepo.getSessionPreferences())
                .getPendingExceededApprovals();
        pendingApprovalsCall.enqueue(new Callback<List<Reservation>>() {
            @Override
            public void onResponse(Call<List<Reservation>> call, Response<List<Reservation>> response) {
                if (getActivity() == null || !isAdded() || binding == null) return;
                if (!response.isSuccessful() || response.body() == null || response.body().isEmpty()) {
                    binding.pendingApprovalsTitle.setVisibility(View.GONE);
                    binding.pendingApprovalsList.setVisibility(View.GONE);
                    return;
                }
                android.content.Context ctx = getContext();
                if (ctx == null) return;
                binding.pendingApprovalsTitle.setVisibility(View.VISIBLE);
                binding.pendingApprovalsList.setVisibility(View.VISIBLE);
                binding.pendingApprovalsList.removeAllViews();
                try {
                    for (Reservation r : response.body()) {
                        if (r == null) continue;
                        View card = LayoutInflater.from(ctx).inflate(R.layout.item_pending_approval, binding.pendingApprovalsList, false);
                        String who = ctx.getString(R.string.pending_user_placeholder);
                        if (r.getUser() != null) {
                            String n = r.getUser().getName();
                            String em = r.getUser().getEmail();
                            if (n != null && !n.isEmpty()) who = n;
                            else if (em != null && !em.isEmpty()) who = em;
                        }
                        String carPart = "";
                        if (r.getCar() != null) {
                            String b = r.getCar().getBrand() != null ? r.getCar().getBrand() : "";
                            String reg = r.getCar().getRegistrationNumber() != null ? r.getCar().getRegistrationNumber() : "";
                            carPart = (b + " " + reg).trim();
                        }
                        String userCar = who + (carPart.isEmpty() ? "" : " – " + carPart);
                        String kmReason = (r.getReleasedKmUsed() != null
                                ? ctx.getString(R.string.km_suffix_fmt, r.getReleasedKmUsed()) : "")
                                + (r.getReleasedExceededReason() != null ? " • " + r.getReleasedExceededReason() : "");
                        TextView userCarTv = card.findViewById(R.id.pending_user_car);
                        TextView kmReasonTv = card.findViewById(R.id.pending_km_reason);
                        EditText obs = card.findViewById(R.id.pending_observations);
                        View approveBtn = card.findViewById(R.id.btnApprove);
                        View rejectBtn = card.findViewById(R.id.btnReject);
                        if (userCarTv != null) userCarTv.setText(userCar);
                        if (kmReasonTv != null) kmReasonTv.setText(kmReason);
                        final String resId = r.getId();
                        if (approveBtn != null) {
                            approveBtn.setOnClickListener(v -> setExceededApproval(
                                    resId,
                                    "approveExceeded",
                                    obs != null && obs.getText() != null ? obs.getText().toString().trim() : "",
                                    card
                            ));
                        }
                        if (rejectBtn != null) {
                            rejectBtn.setOnClickListener(v -> setExceededApproval(
                                    resId,
                                    "rejectExceeded",
                                    obs != null && obs.getText() != null ? obs.getText().toString().trim() : "",
                                    card
                            ));
                        }
                        binding.pendingApprovalsList.addView(card);
                    }
                } catch (Exception e) {
                    Log.e(TAG, "pending approvals UI", e);
                    binding.pendingApprovalsTitle.setVisibility(View.GONE);
                    binding.pendingApprovalsList.setVisibility(View.GONE);
                    safeToast(ctx, getString(R.string.could_not_show_pending_approvals));
                }
            }

            @Override
            public void onFailure(Call<List<Reservation>> call, Throwable t) {
                if (call.isCanceled() || !isAdded() || binding == null) return;
                safeToast(getContext(), getString(R.string.failed_load_approvals));
                binding.pendingApprovalsTitle.setVisibility(View.GONE);
                binding.pendingApprovalsList.setVisibility(View.GONE);
            }
        });
    }

    private void cancelPendingApprovalsCall() {
        if (pendingApprovalsCall != null && !pendingApprovalsCall.isCanceled()) {
            pendingApprovalsCall.cancel();
        }
        pendingApprovalsCall = null;
    }

    private void setExceededApproval(String reservationId, String action, String observations, View card) {
        if (reservationId == null || reservationId.isEmpty()) {
            safeToast(getContext(), getString(R.string.invalid_reservation_id));
            return;
        }
        if (authRepo == null) return;
        Map<String, Object> body = new HashMap<>();
        body.put("action", action);
        if (observations != null && !observations.isEmpty()) body.put("observations", observations);
        RetrofitClient.getApiService(authRepo.getSessionPreferences())
                .updateReservation(reservationId, body).enqueue(new Callback<Map<String, Object>>() {
                    @Override
                    public void onResponse(Call<Map<String, Object>> call, Response<Map<String, Object>> response) {
                        if (getActivity() == null || !isAdded() || binding == null) return;
                        if (response.isSuccessful()) {
                            safeToast(getContext(), action.equals("approveExceeded")
                                    ? getString(R.string.km_action_approved) : getString(R.string.km_action_rejected));
                            binding.pendingApprovalsList.removeView(card);
                            if (binding.pendingApprovalsList.getChildCount() == 0) {
                                binding.pendingApprovalsTitle.setVisibility(View.GONE);
                                binding.pendingApprovalsList.setVisibility(View.GONE);
                            }
                        }
                    }

                    @Override
                    public void onFailure(Call<Map<String, Object>> call, Throwable t) {
                        if (!isAdded()) return;
                        safeToast(getContext(), t.getMessage() != null ? t.getMessage() : getString(R.string.failed_generic));
                    }
                });
    }

    @Override
    public void onDestroyView() {
        cancelPendingApprovalsCall();
        super.onDestroyView();
        binding = null;
    }
}
