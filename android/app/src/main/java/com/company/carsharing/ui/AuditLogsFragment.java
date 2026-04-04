package com.company.carsharing.ui;

import android.content.Context;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ArrayAdapter;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;

import com.company.carsharing.R;
import com.company.carsharing.data.repository.AuthRepository;
import com.company.carsharing.databinding.FragmentAuditLogsBinding;
import com.company.carsharing.network.RetrofitClient;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

/**
 * Shows the company audit log — an append-only list of important actions.
 * Admin-only. Supports filtering by entity type and basic pagination.
 */
public class AuditLogsFragment extends Fragment {

    private FragmentAuditLogsBinding binding;
    private AuditLogAdapter adapter;

    private int currentPage = 1;
    private int totalPages = 1;
    private static final int LIMIT = 25;
    private String activeEntityType = null; // null = all
    /** Parallel to {@link R.array#audit_filter_labels}; index 0 = all types. */
    private static final String[] AUDIT_FILTER_API = { null, "CAR", "RESERVATION", "COMPANY", "USER" };

    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        binding = FragmentAuditLogsBinding.inflate(inflater, container, false);
        if (getActivity() instanceof MainActivity) {
            ((MainActivity) getActivity()).setToolbarTitle(getString(R.string.audit_title));
        }

        adapter = new AuditLogAdapter(requireContext());
        binding.auditList.setAdapter(adapter);

        String[] filterLabels = getResources().getStringArray(R.array.audit_filter_labels);
        int colorActive   = androidx.core.content.ContextCompat.getColor(requireContext(), R.color.join_badge_text);
        int colorInactive = androidx.core.content.ContextCompat.getColor(requireContext(), R.color.on_surface_variant);
        for (int fi = 0; fi < filterLabels.length && fi < AUDIT_FILTER_API.length; fi++) {
            final int idx = fi;
            String label = filterLabels[fi];
            View chip = LayoutInflater.from(requireContext())
                    .inflate(R.layout.item_filter_chip, binding.filterChips, false);
            if (chip instanceof TextView) {
                TextView chipTv = (TextView) chip;
                chipTv.setText(label);
                boolean initiallySelected = idx == 0;
                chip.setSelected(initiallySelected);
                chipTv.setTextColor(initiallySelected ? colorActive : colorInactive);
                chip.setOnClickListener(v -> {
                    activeEntityType = AUDIT_FILTER_API[idx];
                    currentPage = 1;
                    for (int i = 0; i < binding.filterChips.getChildCount(); i++) {
                        View c = binding.filterChips.getChildAt(i);
                        c.setSelected(false);
                        if (c instanceof TextView) ((TextView) c).setTextColor(colorInactive);
                    }
                    chip.setSelected(true);
                    chipTv.setTextColor(colorActive);
                    loadLogs();
                });
            }
            binding.filterChips.addView(chip);
        }

        binding.btnPrevPage.setOnClickListener(v -> {
            if (currentPage > 1) { currentPage--; loadLogs(); }
        });
        binding.btnNextPage.setOnClickListener(v -> {
            if (currentPage < totalPages) { currentPage++; loadLogs(); }
        });

        loadLogs();
        return binding.getRoot();
    }

    private void loadLogs() {
        binding.auditProgress.setVisibility(View.VISIBLE);
        binding.auditEmpty.setVisibility(View.GONE);
        binding.auditError.setVisibility(View.GONE);
        binding.auditList.setVisibility(View.GONE);

        RetrofitClient.getApiService(new AuthRepository(requireContext()).getSessionPreferences())
                .getAuditLogs(currentPage, LIMIT, activeEntityType)
                .enqueue(new Callback<Map<String, Object>>() {
                    @Override
                    public void onResponse(@NonNull Call<Map<String, Object>> call,
                                           @NonNull Response<Map<String, Object>> response) {
                        if (binding == null) return;
                        binding.auditProgress.setVisibility(View.GONE);
                        if (response.isSuccessful() && response.body() != null) {
                            Map<String, Object> body = response.body();
                            double total = body.containsKey("total")
                                    ? ((Number) body.get("total")).doubleValue() : 0;
                            totalPages = (int) Math.max(1, Math.ceil(total / LIMIT));
                            binding.auditTotal.setText(getString(R.string.audit_entries_fmt, (int) total));
                            binding.paginationRow.setVisibility(totalPages > 1 ? View.VISIBLE : View.GONE);
                            binding.pageLabel.setText(getString(R.string.audit_page_fmt, currentPage, totalPages));
                            binding.btnPrevPage.setEnabled(currentPage > 1);
                            binding.btnNextPage.setEnabled(currentPage < totalPages);

                            @SuppressWarnings("unchecked")
                            List<Map<String, Object>> logs = (List<Map<String, Object>>) body.get("logs");
                            if (logs == null) logs = new ArrayList<>();
                            adapter.setLogs(logs);

                            if (logs.isEmpty()) {
                                binding.auditEmpty.setVisibility(View.VISIBLE);
                            } else {
                                binding.auditList.setVisibility(View.VISIBLE);
                            }
                        } else {
                            binding.auditError.setText(getString(R.string.audit_load_failed_http, response.code()));
                            binding.auditError.setVisibility(View.VISIBLE);
                        }
                    }

                    @Override
                    public void onFailure(@NonNull Call<Map<String, Object>> call, @NonNull Throwable t) {
                        if (binding == null) return;
                        binding.auditProgress.setVisibility(View.GONE);
                        binding.auditError.setText(getString(R.string.network_error_fmt,
                                t.getMessage() != null ? t.getMessage() : getString(R.string.network_error_short)));
                        binding.auditError.setVisibility(View.VISIBLE);
                    }
                });
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        binding = null;
    }

    // ── Adapter ──────────────────────────────────────────────────────────────

    static class AuditLogAdapter extends ArrayAdapter<Map<String, Object>> {

        private final SimpleDateFormat sdf = new SimpleDateFormat("dd MMM yyyy HH:mm", Locale.getDefault());

        AuditLogAdapter(Context ctx) {
            super(ctx, 0);
        }

        void setLogs(List<Map<String, Object>> logs) {
            clear();
            addAll(logs);
            notifyDataSetChanged();
        }

        @NonNull
        @Override
        public View getView(int position, @Nullable View convertView, @NonNull ViewGroup parent) {
            if (convertView == null) {
                convertView = LayoutInflater.from(getContext())
                        .inflate(R.layout.item_audit_log, parent, false);
            }
            Map<String, Object> log = getItem(position);
            if (log == null) return convertView;

            TextView actionView = convertView.findViewById(R.id.audit_action);
            TextView timestampView = convertView.findViewById(R.id.audit_timestamp);
            TextView entityTypeView = convertView.findViewById(R.id.audit_entity_type);
            TextView entityIdView = convertView.findViewById(R.id.audit_entity_id);
            TextView actorView = convertView.findViewById(R.id.audit_actor);
            TextView metaView = convertView.findViewById(R.id.audit_meta);

            String action = safeStr(log, "action");
            actionView.setText(actionLabel(getContext(), action));

            String createdAt = safeStr(log, "createdAt");
            if (!createdAt.isEmpty()) {
                try {
                    // ISO 8601 – trim to parseable format
                    Date d = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.getDefault())
                            .parse(createdAt.length() > 19 ? createdAt.substring(0, 19) : createdAt);
                    timestampView.setText(d != null ? sdf.format(d) : createdAt);
                } catch (Exception e) {
                    timestampView.setText(createdAt);
                }
            } else {
                timestampView.setText("");
            }

            entityTypeView.setText(entityTypeLabel(getContext(), safeStr(log, "entityType")));

            String eid = safeStr(log, "entityId");
            if (eid.length() > 8) eid = eid.substring(0, 8) + "…";
            entityIdView.setText(eid);

            @SuppressWarnings("unchecked")
            Map<String, Object> actor = (Map<String, Object>) log.get("actor");
            if (actor != null) {
                actorView.setText(getContext().getString(R.string.audit_actor_fmt,
                        safeStr(actor, "name"), safeStr(actor, "email")));
            } else {
                actorView.setText(getContext().getString(R.string.audit_actor_system));
            }

            Object meta = log.get("meta");
            if (meta instanceof Map) {
                @SuppressWarnings("unchecked")
                Map<String, Object> metaMap = (Map<String, Object>) meta;
                if (!metaMap.isEmpty()) {
                    StringBuilder sb = new StringBuilder();
                    for (Map.Entry<String, Object> e : metaMap.entrySet()) {
                        if (sb.length() > 0) sb.append("  ");
                        sb.append(e.getKey()).append(": ").append(e.getValue());
                    }
                    metaView.setText(sb.toString());
                    metaView.setVisibility(View.VISIBLE);
                } else {
                    metaView.setVisibility(View.GONE);
                }
            } else {
                metaView.setVisibility(View.GONE);
            }

            return convertView;
        }

        private String safeStr(Map<String, Object> m, String key) {
            Object v = m.get(key);
            return v != null ? String.valueOf(v) : "";
        }

        private static String actionLabel(Context c, String action) {
            if (c == null || action == null) return "";
            switch (action) {
                case "CAR_ADDED":             return c.getString(R.string.audit_action_car_added);
                case "CAR_UPDATED":           return c.getString(R.string.audit_action_car_updated);
                case "CAR_STATUS_CHANGED":    return c.getString(R.string.audit_action_car_status_changed);
                case "CAR_DELETED":           return c.getString(R.string.audit_action_car_deleted);
                case "RESERVATION_CREATED":   return c.getString(R.string.audit_action_reservation_created);
                case "RESERVATION_CANCELLED": return c.getString(R.string.audit_action_reservation_cancelled);
                case "RESERVATION_COMPLETED": return c.getString(R.string.audit_action_reservation_completed);
                case "RESERVATION_EXTENDED":  return c.getString(R.string.audit_action_reservation_extended);
                case "KM_EXCEEDED_APPROVED":  return c.getString(R.string.audit_action_km_exceeded_approved);
                case "KM_EXCEEDED_REJECTED":  return c.getString(R.string.audit_action_km_exceeded_rejected);
                case "PRICING_CHANGED":       return c.getString(R.string.audit_action_pricing_changed);
                case "COMPANY_SETTINGS_CHANGED": return c.getString(R.string.audit_action_company_settings_changed);
                case "USER_INVITED":          return c.getString(R.string.audit_action_user_invited);
                case "USER_ROLE_CHANGED":     return c.getString(R.string.audit_action_user_role_changed);
                case "USER_REMOVED":          return c.getString(R.string.audit_action_user_removed);
                case "DRIVING_LICENCE_STATUS_CHANGED": return c.getString(R.string.audit_action_dl_status_changed);
                default:                      return action;
            }
        }

        private static String entityTypeLabel(Context c, String raw) {
            if (c == null || raw == null || raw.isEmpty()) return raw != null ? raw : "";
            switch (raw) {
                case "CAR":         return c.getString(R.string.audit_entity_type_car);
                case "RESERVATION": return c.getString(R.string.audit_entity_type_reservation);
                case "COMPANY":     return c.getString(R.string.audit_entity_type_company);
                case "USER":        return c.getString(R.string.audit_entity_type_user);
                default:            return raw;
            }
        }
    }
}
