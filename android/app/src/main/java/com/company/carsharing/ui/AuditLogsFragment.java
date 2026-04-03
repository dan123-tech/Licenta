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

    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        binding = FragmentAuditLogsBinding.inflate(inflater, container, false);
        if (getActivity() instanceof MainActivity) {
            ((MainActivity) getActivity()).setToolbarTitle("Audit Logs");
        }

        adapter = new AuditLogAdapter(requireContext());
        binding.auditList.setAdapter(adapter);

        // Filter chips
        String[] filters = {"All", "CAR", "RESERVATION", "COMPANY", "USER"};
        int colorActive   = androidx.core.content.ContextCompat.getColor(requireContext(), R.color.join_badge_text);
        int colorInactive = androidx.core.content.ContextCompat.getColor(requireContext(), R.color.on_surface_variant);
        for (String f : filters) {
            View chip = LayoutInflater.from(requireContext())
                    .inflate(R.layout.item_filter_chip, binding.filterChips, false);
            if (chip instanceof TextView) {
                TextView chipTv = (TextView) chip;
                chipTv.setText(f);
                boolean initiallySelected = "All".equals(f);
                chip.setSelected(initiallySelected);
                chipTv.setTextColor(initiallySelected ? colorActive : colorInactive);
                chip.setOnClickListener(v -> {
                    activeEntityType = "All".equals(f) ? null : f;
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
                            binding.auditTotal.setText((int) total + " entries");
                            binding.paginationRow.setVisibility(totalPages > 1 ? View.VISIBLE : View.GONE);
                            binding.pageLabel.setText("Page " + currentPage + " / " + totalPages);
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
                            binding.auditError.setText("Failed to load audit logs (HTTP " + response.code() + ")");
                            binding.auditError.setVisibility(View.VISIBLE);
                        }
                    }

                    @Override
                    public void onFailure(@NonNull Call<Map<String, Object>> call, @NonNull Throwable t) {
                        if (binding == null) return;
                        binding.auditProgress.setVisibility(View.GONE);
                        binding.auditError.setText("Network error: " + t.getMessage());
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
            actionView.setText(actionLabel(action));

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

            entityTypeView.setText(safeStr(log, "entityType"));

            String eid = safeStr(log, "entityId");
            if (eid.length() > 8) eid = eid.substring(0, 8) + "…";
            entityIdView.setText(eid);

            @SuppressWarnings("unchecked")
            Map<String, Object> actor = (Map<String, Object>) log.get("actor");
            if (actor != null) {
                actorView.setText("By: " + safeStr(actor, "name") + " <" + safeStr(actor, "email") + ">");
            } else {
                actorView.setText("By: System");
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

        /** Convert enum value to a human-readable label. */
        private String actionLabel(String action) {
            if (action == null) return "";
            switch (action) {
                case "CAR_ADDED":             return "Car added";
                case "CAR_UPDATED":           return "Car updated";
                case "CAR_STATUS_CHANGED":    return "Car status changed";
                case "CAR_DELETED":           return "Car deleted";
                case "RESERVATION_CREATED":   return "Reservation created";
                case "RESERVATION_CANCELLED": return "Reservation cancelled";
                case "RESERVATION_COMPLETED": return "Reservation completed";
                case "RESERVATION_EXTENDED":  return "Reservation extended";
                case "KM_EXCEEDED_APPROVED":  return "Km exceeded – approved";
                case "KM_EXCEEDED_REJECTED":  return "Km exceeded – rejected";
                case "PRICING_CHANGED":       return "Pricing changed";
                case "COMPANY_SETTINGS_CHANGED": return "Settings changed";
                case "USER_INVITED":          return "User invited";
                case "USER_ROLE_CHANGED":     return "Role changed";
                case "USER_REMOVED":          return "User removed";
                case "DRIVING_LICENCE_STATUS_CHANGED": return "Licence status changed";
                default:                      return action;
            }
        }
    }
}
