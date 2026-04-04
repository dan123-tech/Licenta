package com.company.carsharing.models;

import com.google.gson.annotations.SerializedName;

/**
 * Request body for POST /api/auth/login.
 * {@code clientType} "mobile" uses a separate server session slot from browsers ("web"),
 * so one phone + one browser can stay logged in; a second phone login revokes the first phone.
 */
public class LoginRequest {
    @SerializedName("email")
    private final String email;

    @SerializedName("password")
    private final String password;

    @SerializedName("clientType")
    private final String clientType;

    public LoginRequest(String email, String password) {
        this(email, password, "mobile");
    }

    public LoginRequest(String email, String password, String clientType) {
        this.email = email;
        this.password = password;
        this.clientType = clientType != null ? clientType : "mobile";
    }
}
