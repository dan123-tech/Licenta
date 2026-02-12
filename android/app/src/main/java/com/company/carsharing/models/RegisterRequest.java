package com.company.carsharing.models;

import com.google.gson.annotations.SerializedName;

/**
 * Request body for POST /api/auth/register.
 */
public class RegisterRequest {
    @SerializedName("email")
    private final String email;

    @SerializedName("password")
    private final String password;

    @SerializedName("name")
    private final String name;

    public RegisterRequest(String email, String password, String name) {
        this.email = email;
        this.password = password;
        this.name = name;
    }
}
