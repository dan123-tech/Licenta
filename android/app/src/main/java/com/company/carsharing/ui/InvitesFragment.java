package com.company.carsharing.ui;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ArrayAdapter;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.fragment.app.Fragment;

import com.company.carsharing.data.repository.AuthRepository;
import com.company.carsharing.databinding.FragmentInvitesBinding;
import com.company.carsharing.models.Invite;
import com.company.carsharing.network.RetrofitClient;

import java.util.ArrayList;
import java.util.List;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class InvitesFragment extends Fragment {
    private FragmentInvitesBinding binding;
    private final List<String> lines = new ArrayList<>();

    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        binding = FragmentInvitesBinding.inflate(inflater, container, false);
        if (getActivity() instanceof MainActivity) ((MainActivity) getActivity()).setToolbarTitle("Invites");
        binding.invitesList.setAdapter(new ArrayAdapter<>(requireContext(), android.R.layout.simple_list_item_1, lines));
        loadInvites();
        return binding.getRoot();
    }

    private void loadInvites() {
        lines.clear();
        RetrofitClient.getApiService(new AuthRepository(requireContext()).getSessionPreferences())
                .getInvites().enqueue(new Callback<List<Invite>>() {
            @Override
            public void onResponse(Call<List<Invite>> call, Response<List<Invite>> response) {
                if (response.isSuccessful() && response.body() != null) {
                    for (Invite i : response.body()) {
                        lines.add(i.getEmail() + " – " + (i.getStatus() != null ? i.getStatus() : ""));
                    }
                    ((ArrayAdapter<?>) binding.invitesList.getAdapter()).notifyDataSetChanged();
                }
            }
            @Override
            public void onFailure(Call<List<Invite>> call, Throwable t) {
                if (getActivity() != null) {
                    Toast.makeText(requireContext(),
                            "Could not load invites: " + (t.getMessage() != null ? t.getMessage() : "network error"),
                            Toast.LENGTH_SHORT).show();
                }
            }
        });
    }
}
