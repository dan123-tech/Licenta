package com.company.carsharing.ui;

import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.BaseAdapter;
import android.widget.PopupMenu;
import android.widget.TextView;

import com.company.carsharing.R;
import com.company.carsharing.models.Member;
import com.company.carsharing.util.I18n;

import java.util.ArrayList;
import java.util.List;

public class UsersAdapter extends BaseAdapter {
    private final Context context;
    private final List<Member> members = new ArrayList<>();
    private final String currentUserId;
    private final boolean isAdmin;
    private final OnUserActionListener listener;

    public interface OnUserActionListener {
        void onChangeRole(Member member);
        void onApproveDl(Member member);
        void onRejectDl(Member member);
        void onRemove(Member member);
    }

    public UsersAdapter(Context context, String currentUserId, boolean isAdmin, OnUserActionListener listener) {
        this.context = context;
        this.currentUserId = currentUserId;
        this.isAdmin = isAdmin;
        this.listener = listener;
    }

    public void setMembers(List<Member> members) {
        this.members.clear();
        if (members != null) this.members.addAll(members);
        notifyDataSetChanged();
    }

    @Override
    public int getCount() { return members.size(); }
    @Override
    public Member getItem(int position) { return members.get(position); }
    @Override
    public long getItemId(int position) { return position; }

    @Override
    public View getView(int position, View convertView, ViewGroup parent) {
        View row = convertView;
        if (row == null) {
            row = LayoutInflater.from(context).inflate(R.layout.item_user, parent, false);
        }
        Member m = members.get(position);
        boolean isSelf = m.getUserId() != null && m.getUserId().equals(currentUserId);
        String name = m.getName() != null && !m.getName().isEmpty() ? m.getName() : (m.getEmail() != null ? m.getEmail() : "");
        ((TextView) row.findViewById(R.id.user_title)).setText(name);
        TextView roleTv = row.findViewById(R.id.user_role);
        String role = m.getRole() != null ? m.getRole() : "";
        String roleDisplay;
        if ("ADMIN".equalsIgnoreCase(role)) {
            roleDisplay = context.getString(R.string.role_display_admin);
        } else if ("USER".equalsIgnoreCase(role)) {
            roleDisplay = context.getString(R.string.role_display_member);
        } else {
            roleDisplay = role;
        }
        roleTv.setText(roleDisplay);
        int roleColor = "ADMIN".equalsIgnoreCase(role)
                ? androidx.core.content.ContextCompat.getColor(context, R.color.role_admin)
                : androidx.core.content.ContextCompat.getColor(context, R.color.role_user);
        roleTv.setTextColor(roleColor);
        String em = m.getEmail() != null ? m.getEmail() : "";
        String sub = em;
        if (m.getDrivingLicenceStatus() != null) {
            sub = context.getString(R.string.user_dl_status_fmt, em, context.getString(R.string.dl_short_label),
                    I18n.drivingLicenceStatusForDisplay(context, m.getDrivingLicenceStatus()));
        }
        ((TextView) row.findViewById(R.id.user_subtitle)).setText(sub);

        View roleBtn = row.findViewById(R.id.user_role_btn);
        View approveDl = row.findViewById(R.id.user_approve_dl);
        View rejectDl = row.findViewById(R.id.user_reject_dl);
        View removeBtn = row.findViewById(R.id.user_remove);

        if (isAdmin) {
            roleBtn.setVisibility(View.VISIBLE);
            approveDl.setVisibility(View.VISIBLE);
            rejectDl.setVisibility(View.VISIBLE);
            removeBtn.setVisibility(isSelf ? View.GONE : View.VISIBLE);
            roleBtn.setOnClickListener(v -> listener.onChangeRole(m));
            approveDl.setOnClickListener(v -> listener.onApproveDl(m));
            rejectDl.setOnClickListener(v -> listener.onRejectDl(m));
            removeBtn.setOnClickListener(v -> listener.onRemove(m));
        } else {
            roleBtn.setVisibility(View.GONE);
            approveDl.setVisibility(View.GONE);
            rejectDl.setVisibility(View.GONE);
            removeBtn.setVisibility(View.GONE);
        }

        row.setOnLongClickListener(v -> {
            if (!isAdmin || isSelf) return false;
            PopupMenu popup = new PopupMenu(context, v);
            popup.getMenu().add(0, 0, 0, "ADMIN".equalsIgnoreCase(m.getRole())
                    ? context.getString(R.string.menu_demote_user) : context.getString(R.string.menu_promote_admin));
            popup.getMenu().add(0, 1, 1, context.getString(R.string.remove));
            popup.setOnMenuItemClickListener(item -> {
                if (item.getItemId() == 0) listener.onChangeRole(m);
                else if (item.getItemId() == 1) listener.onRemove(m);
                return true;
            });
            popup.show();
            return true;
        });
        return row;
    }
}
