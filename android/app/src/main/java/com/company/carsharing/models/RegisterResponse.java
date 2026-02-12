package com.company.carsharing.models;

import com.google.gson.annotations.SerializedName;

/**
 * Response body from POST /api/auth/register.
 */
public class RegisterResponse {
    @SerializedName("user")
    private User user;

    public User getUser() {
        return user;
    }
}
