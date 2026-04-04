package com.company.carsharing.ui;

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
import androidx.fragment.app.Fragment;

import com.company.carsharing.R;
import com.company.carsharing.data.SessionHolder;
import com.company.carsharing.data.repository.AuthRepository;
import com.company.carsharing.databinding.FragmentUsersBinding;
import com.company.carsharing.models.Member;
import com.company.carsharing.network.RetrofitClient;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class UsersFragment extends Fragment implements UsersAdapter.OnUserActionListener {
    private FragmentUsersBinding binding;
    private UsersAdapter usersAdapter;

    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        binding = FragmentUsersBinding.inflate(inflater, container, false);
        if (getActivity() instanceof MainActivity) ((MainActivity) getActivity()).setToolbarTitle(getString(R.string.nav_users));
        String currentUserId = SessionHolder.getUser() != null ? SessionHolder.getUser().getId() : null;
        usersAdapter = new UsersAdapter(requireContext(), currentUserId, SessionHolder.isAdmin(), this);
        binding.usersList.setAdapter(usersAdapter);
        if (SessionHolder.isAdmin()) {
            binding.fabInvite.setVisibility(View.VISIBLE);
            binding.fabInvite.setOnClickListener(v -> showInviteDialog());
        } else {
            binding.fabInvite.setVisibility(View.GONE);
        }
        loadUsers();
        return binding.getRoot();
    }

    private void showInviteDialog() {
        View dialogView = LayoutInflater.from(requireContext()).inflate(R.layout.dialog_invite_user, null);
        com.google.android.material.textfield.TextInputEditText emailEt = dialogView.findViewById(R.id.dialog_invite_email_et);
        com.google.android.material.textfield.TextInputEditText nameEt = dialogView.findViewById(R.id.dialog_invite_name_et);
        Spinner roleSpinner = dialogView.findViewById(R.id.dialog_invite_role);
        TextView errorTv = dialogView.findViewById(R.id.dialog_invite_error);
        View cancelBtn = dialogView.findViewById(R.id.dialog_invite_cancel);
        View saveBtn = dialogView.findViewById(R.id.dialog_invite_save);

        roleSpinner.setAdapter(new ArrayAdapter<>(requireContext(), android.R.layout.simple_spinner_dropdown_item, new String[]{"USER", "ADMIN"}));
        AlertDialog dialog = new AlertDialog.Builder(requireContext()).setView(dialogView).setCancelable(true).create();
        cancelBtn.setOnClickListener(v -> dialog.dismiss());
        saveBtn.setOnClickListener(v -> {
            errorTv.setVisibility(View.GONE);
            String email = emailEt.getText() != null ? emailEt.getText().toString().trim() : "";
            String name = nameEt.getText() != null ? nameEt.getText().toString().trim() : "";
            String role = (String) roleSpinner.getSelectedItem();
            if (email.isEmpty()) {
                errorTv.setText(getString(R.string.email_required));
                errorTv.setVisibility(View.VISIBLE);
                return;
            }
            Map<String, String> body = new HashMap<>();
            body.put("email", email);
            body.put("role", role);
            if (!name.isEmpty()) body.put("name", name);
            RetrofitClient.getApiService(new AuthRepository(requireContext()).getSessionPreferences())
                    .inviteUser(body).enqueue(new Callback<Object>() {
                @Override
                public void onResponse(Call<Object> call, Response<Object> response) {
                    if (getActivity() == null) return;
                    if (response.isSuccessful() || response.code() == 201) {
                        dialog.dismiss();
                        loadUsers();
                        Toast.makeText(requireContext(), getString(R.string.invite_created_hint), Toast.LENGTH_LONG).show();
                    } else {
                        errorTv.setText(response.code() == 400 ? getString(R.string.invalid_email_or_invited) : getString(R.string.failed_to_invite));
                        errorTv.setVisibility(View.VISIBLE);
                    }
                }
                @Override
                public void onFailure(Call<Object> call, Throwable t) {
                    if (getActivity() != null) {
                        errorTv.setText(getString(R.string.network_error));
                        errorTv.setVisibility(View.VISIBLE);
                    }
                }
            });
        });
        dialog.show();
    }

    @Override
    public void onChangeRole(Member member) {
        String userId = member.getUserId();
        if (userId == null) return;
        if (userId.equals(SessionHolder.getUser() != null ? SessionHolder.getUser().getId() : null)) {
            Toast.makeText(requireContext(), getString(R.string.cannot_change_own_role), Toast.LENGTH_SHORT).show();
            return;
        }
        String[] roles = new String[]{"USER", "ADMIN"};
        int selected = "ADMIN".equalsIgnoreCase(member.getRole()) ? 1 : 0;
        new AlertDialog.Builder(requireContext())
                .setTitle(R.string.change_role_title)
                .setSingleChoiceItems(roles, selected, null)
                .setPositiveButton(R.string.ok, (d, w) -> {
                    int which = ((AlertDialog) d).getListView().getCheckedItemPosition();
                    if (which < 0) return;
                    String newRole = roles[which];
                    Map<String, Object> body = new HashMap<>();
                    body.put("role", newRole);
                    RetrofitClient.getApiService(new AuthRepository(requireContext()).getSessionPreferences())
                            .updateUser(userId, body).enqueue(new Callback<Void>() {
                        @Override
                        public void onResponse(Call<Void> call, Response<Void> response) {
                            if (getActivity() != null) {
                                if (response.isSuccessful()) {
                                    loadUsers();
                                    Toast.makeText(requireContext(), getString(R.string.role_updated), Toast.LENGTH_SHORT).show();
                                } else {
                                    Toast.makeText(requireContext(), response.code() == 400 ? getString(R.string.cannot_change_role) : getString(R.string.failed_generic), Toast.LENGTH_SHORT).show();
                                }
                            }
                        }
                        @Override
                        public void onFailure(Call<Void> call, Throwable t) {
                            if (getActivity() != null) Toast.makeText(requireContext(), getString(R.string.network_error), Toast.LENGTH_SHORT).show();
                        }
                    });
                })
                .setNegativeButton(R.string.cancel, null)
                .show();
    }

    private void setDrivingLicenceStatus(String userId, String status) {
        Map<String, Object> body = new HashMap<>();
        body.put("drivingLicenceStatus", status);
        RetrofitClient.getApiService(new AuthRepository(requireContext()).getSessionPreferences())
                .updateUser(userId, body).enqueue(new Callback<Void>() {
            @Override
            public void onResponse(Call<Void> call, Response<Void> response) {
                if (getActivity() != null) {
                    if (response.isSuccessful()) {
                        loadUsers();
                        Toast.makeText(requireContext(),
                                "APPROVED".equalsIgnoreCase(status)
                                        ? getString(R.string.dl_toast_approved) : getString(R.string.dl_toast_rejected),
                                Toast.LENGTH_SHORT).show();
                    }
                }
            }
            @Override
            public void onFailure(Call<Void> call, Throwable t) {
                if (getActivity() != null) Toast.makeText(requireContext(), getString(R.string.network_error), Toast.LENGTH_SHORT).show();
            }
        });
    }

    @Override
    public void onApproveDl(Member member) {
        if (member.getUserId() == null) return;
        setDrivingLicenceStatus(member.getUserId(), "APPROVED");
    }

    @Override
    public void onRejectDl(Member member) {
        if (member.getUserId() == null) return;
        setDrivingLicenceStatus(member.getUserId(), "REJECTED");
    }

    @Override
    public void onRemove(Member member) {
        String userId = member.getUserId();
        if (userId == null) return;
        if (userId.equals(SessionHolder.getUser() != null ? SessionHolder.getUser().getId() : null)) {
            Toast.makeText(requireContext(), getString(R.string.cannot_remove_self), Toast.LENGTH_SHORT).show();
            return;
        }
        String who = member.getName() != null && !member.getName().isEmpty()
                ? member.getName() : (member.getEmail() != null ? member.getEmail() : "");
        new AlertDialog.Builder(requireContext())
                .setTitle(R.string.remove_user_title)
                .setMessage(getString(R.string.remove_user_message_fmt, who))
                .setPositiveButton(R.string.remove, (d, w) -> {
                    RetrofitClient.getApiService(new AuthRepository(requireContext()).getSessionPreferences())
                            .removeUser(userId).enqueue(new Callback<Void>() {
                        @Override
                        public void onResponse(Call<Void> call, Response<Void> response) {
                            if (getActivity() != null) {
                                if (response.isSuccessful()) {
                                    loadUsers();
                                    Toast.makeText(requireContext(), getString(R.string.user_removed), Toast.LENGTH_SHORT).show();
                                } else {
                                    Toast.makeText(requireContext(), response.code() == 400 ? getString(R.string.cannot_remove_yourself_error) : getString(R.string.failed_generic), Toast.LENGTH_SHORT).show();
                                }
                            }
                        }
                        @Override
                        public void onFailure(Call<Void> call, Throwable t) {
                            if (getActivity() != null) Toast.makeText(requireContext(), getString(R.string.network_error), Toast.LENGTH_SHORT).show();
                        }
                    });
                })
                .setNegativeButton(R.string.cancel, null)
                .show();
    }

    private void loadUsers() {
        RetrofitClient.getApiService(new AuthRepository(requireContext()).getSessionPreferences())
                .getUsers(null).enqueue(new Callback<List<Member>>() {
            @Override
            public void onResponse(Call<List<Member>> call, Response<List<Member>> response) {
                if (response.isSuccessful() && response.body() != null) {
                    usersAdapter.setMembers(response.body());
                }
            }
            @Override
            public void onFailure(Call<List<Member>> call, Throwable t) { }
        });
    }
}
