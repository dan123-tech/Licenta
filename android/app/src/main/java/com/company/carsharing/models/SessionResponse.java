package com.company.carsharing.models;

import com.google.gson.annotations.SerializedName;

/**
 * Response from GET /api/auth/session.
 */
public class SessionResponse {
    @SerializedName("user")
    private User user;

    @SerializedName("company")
    private Company company;

    public User getUser() {
        return user;
    }

    public Company getCompany() {
        return company;
    }
}
