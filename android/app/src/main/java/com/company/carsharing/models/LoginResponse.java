package com.company.carsharing.models;

import com.google.gson.annotations.SerializedName;

/**
 * Response body from POST /api/auth/login.
 */
public class LoginResponse {
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
