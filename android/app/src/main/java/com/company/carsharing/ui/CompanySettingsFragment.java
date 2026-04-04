package com.company.carsharing.ui;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;

import com.company.carsharing.ui.MainActivity;
import com.company.carsharing.R;
import com.company.carsharing.data.SessionHolder;
import com.company.carsharing.models.Company;
import com.company.carsharing.network.ApiService;
import com.company.carsharing.network.RetrofitClient;
import android.widget.Button;
import android.widget.EditText;

import java.util.HashMap;
import java.util.Map;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

/**
 * Company Settings: Default KM (fuel) per reservation.
 * Admin only.
 */
public class CompanySettingsFragment extends Fragment {

    private EditText defaultKmInput;
    private EditText benzineInput;
    private EditText dieselInput;
    private EditText hybridInput;
    private EditText electricityInput;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_company_settings, container, false);
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);
        if (getActivity() instanceof MainActivity) {
            ((MainActivity) getActivity()).setToolbarTitle(getString(R.string.nav_company_settings));
        }
        defaultKmInput = view.findViewById(R.id.company_settings_default_km);
        benzineInput = view.findViewById(R.id.company_settings_benzine);
        dieselInput = view.findViewById(R.id.company_settings_diesel);
        hybridInput = view.findViewById(R.id.company_settings_hybrid);
        electricityInput = view.findViewById(R.id.company_settings_electricity);
        Button save = view.findViewById(R.id.company_settings_save);

        Company company = SessionHolder.getCompany();
        if (company != null) {
            defaultKmInput.setText(String.valueOf(company.getDefaultKmUsage()));
            setFuel(benzineInput, company.getPriceBenzinePerLiter());
            setFuel(dieselInput, company.getPriceDieselPerLiter());
            setFuel(hybridInput, company.getPriceHybridPerLiter());
            setFuel(electricityInput, company.getPriceElectricityPerKwh());
        }

        save.setOnClickListener(v -> saveSettings());
    }

    private void setFuel(EditText et, Double value) {
        if (et == null) return;
        et.setText(value != null ? String.valueOf(value) : "");
    }

    private void saveSettings() {
        String kmStr = defaultKmInput.getText() != null ? defaultKmInput.getText().toString().trim() : "";
        int km;
        try {
            km = Integer.parseInt(kmStr);
            if (km < 1 || km > 10000) {
                Toast.makeText(requireContext(), getString(R.string.enter_km_range), Toast.LENGTH_SHORT).show();
                return;
            }
        } catch (NumberFormatException e) {
            Toast.makeText(requireContext(), getString(R.string.enter_valid_number), Toast.LENGTH_SHORT).show();
            return;
        }

        ApiService api = RetrofitClient.getApiService(
                ((MainActivity) requireActivity()).getAuthRepository().getSessionPreferences());
        Map<String, Object> body = new HashMap<>();
        body.put("defaultKmUsage", km);
        Double benzine = parseDouble(benzineInput);
        Double diesel = parseDouble(dieselInput);
        Double hybrid = parseDouble(hybridInput);
        Double electricity = parseDouble(electricityInput);
        if (benzine != null) body.put("priceBenzinePerLiter", benzine);
        if (diesel != null) body.put("priceDieselPerLiter", diesel);
        if (hybrid != null) body.put("priceHybridPerLiter", hybrid);
        if (electricity != null) body.put("priceElectricityPerKwh", electricity);

        api.updateCompanyCurrent(body).enqueue(new Callback<Company>() {
            @Override
            public void onResponse(@NonNull Call<Company> call, @NonNull Response<Company> response) {
                if (response.isSuccessful() && response.body() != null) {
                    Toast.makeText(requireContext(), getString(R.string.saved), Toast.LENGTH_SHORT).show();
                    SessionHolder.set(SessionHolder.getUser(), response.body());
                } else {
                    Toast.makeText(requireContext(), getString(R.string.failed_to_save), Toast.LENGTH_SHORT).show();
                }
            }
            @Override
            public void onFailure(@NonNull Call<Company> call, @NonNull Throwable t) {
                Toast.makeText(requireContext(), t.getMessage() != null ? t.getMessage() : getString(R.string.error_generic), Toast.LENGTH_SHORT).show();
            }
        });
    }

    private Double parseDouble(EditText et) {
        if (et == null) return null;
        String s = et.getText() != null ? et.getText().toString().trim().replace(",", ".") : "";
        if (s.isEmpty()) return null;
        try { return Double.parseDouble(s); } catch (NumberFormatException e) { return null; }
    }
}
