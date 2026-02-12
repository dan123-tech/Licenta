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
import com.company.carsharing.databinding.FragmentNoCompanyBinding;
import com.company.carsharing.models.Company;
import com.company.carsharing.models.User;
import com.company.carsharing.network.RetrofitClient;

import java.util.HashMap;
import java.util.Map;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class NoCompanyFragment extends Fragment {

    private FragmentNoCompanyBinding binding;
    private AuthRepository authRepository;

    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        binding = FragmentNoCompanyBinding.inflate(inflater, container, false);
        authRepository = new AuthRepository(requireContext());
        binding.btnCreate.setOnClickListener(v -> createCompany());
        binding.btnJoin.setOnClickListener(v -> joinCompany());
        return binding.getRoot();
    }

    private void createCompany() {
        String name = binding.createNameLayout.getEditText() != null ? binding.createNameLayout.getEditText().getText().toString().trim() : "";
        if (name.isEmpty()) {
            showError("Enter company name");
            return;
        }
        setLoading(true);
        Map<String, Object> body = new HashMap<>();
        body.put("name", name);
        body.put("domain", (Object) null);
        RetrofitClient.getApiService(authRepository.getSessionPreferences()).createCompany(body)
                .enqueue(new Callback<com.company.carsharing.models.CompanyResponse>() {
                    @Override
                    public void onResponse(Call<com.company.carsharing.models.CompanyResponse> call, Response<com.company.carsharing.models.CompanyResponse> response) {
                        setLoading(false);
                        if (response.isSuccessful() && response.body() != null) {
                            Toast.makeText(requireContext(), "Company created", Toast.LENGTH_SHORT).show();
                            refreshSession();
                        } else showError("Failed to create company");
                    }
                    @Override
                    public void onFailure(Call<com.company.carsharing.models.CompanyResponse> call, Throwable t) {
                        setLoading(false);
                        showError(t.getMessage() != null ? t.getMessage() : "Network error");
                    }
                });
    }

    private void joinCompany() {
        String code = binding.joinCodeLayout.getEditText() != null ? binding.joinCodeLayout.getEditText().getText().toString().trim().toUpperCase() : "";
        if (code.isEmpty()) {
            showError("Enter join code");
            return;
        }
        setLoading(true);
        Map<String, String> body = new HashMap<>();
        body.put("joinCode", code);
        RetrofitClient.getApiService(authRepository.getSessionPreferences()).joinCompany(body)
                .enqueue(new Callback<com.company.carsharing.models.CompanyResponse>() {
                    @Override
                    public void onResponse(Call<com.company.carsharing.models.CompanyResponse> call, Response<com.company.carsharing.models.CompanyResponse> response) {
                        setLoading(false);
                        if (response.isSuccessful() && response.body() != null && response.body().getCompany() != null) {
                            Toast.makeText(requireContext(), "Joined company", Toast.LENGTH_SHORT).show();
                            refreshSession();
                        } else showError("Invalid join code or already a member");
                    }
                    @Override
                    public void onFailure(Call<com.company.carsharing.models.CompanyResponse> call, Throwable t) {
                        setLoading(false);
                        showError(t.getMessage() != null ? t.getMessage() : "Network error");
                    }
                });
    }

    private void refreshSession() {
        authRepository.refreshSession(new AuthRepository.SessionCallback() {
            @Override
            public void onLoaded(User user, Company company) {
                SessionHolder.set(user, company);
                if (getActivity() instanceof MainActivity) {
                    MainActivity ma = (MainActivity) getActivity();
                    if (ma != null) ma.runOnUiThread(() -> {
                        ma.setupDrawer(user, company);
                        ma.showFragment(new CompanyFragment());
                    });
                }
            }
            @Override
            public void onError(String message) {
                showError(message);
            }
        });
    }

    private void showError(String msg) {
        if (binding != null) {
            binding.errorText.setVisibility(View.VISIBLE);
            binding.errorText.setText(msg);
        }
    }

    private void setLoading(boolean loading) {
        if (binding != null) {
            binding.btnCreate.setEnabled(!loading);
            binding.btnJoin.setEnabled(!loading);
        }
    }
}
