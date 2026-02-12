package com.company.carsharing.data;

import com.company.carsharing.models.Company;
import com.company.carsharing.models.User;

/** Holds current user and company after session load. Set by MainActivity. */
public final class SessionHolder {
    private static User user;
    private static Company company;

    public static void set(User u, Company c) {
        user = u;
        company = c;
    }

    public static User getUser() { return user; }
    public static Company getCompany() { return company; }
    public static boolean isAdmin() {
        return user != null && "ADMIN".equalsIgnoreCase(user.getRole());
    }
    public static boolean hasCompany() { return company != null; }
}
