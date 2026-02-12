package com.company.carsharing.models;

import com.google.gson.annotations.SerializedName;

/**
 * Request body for POST /api/auth/login.
 */
public class LoginRequest {
    @SerializedName("email")
    private final String email;

    @SerializedName("password")
    private final String password;

    public LoginRequest(String email, String password) {
        this.email = email;
        this.password = password;
    }
}
