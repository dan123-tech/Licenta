package com.company.carsharing.models;

import com.google.gson.annotations.SerializedName;

public class Invite {
    @SerializedName("id")
    private String id;
    @SerializedName("email")
    private String email;
    @SerializedName("createdAt")
    private String createdAt;
    @SerializedName("expiresAt")
    private String expiresAt;
    @SerializedName("usedAt")
    private String usedAt;
    @SerializedName("status")
    private String status;

    public String getId() { return id; }
    public String getEmail() { return email; }
    public String getCreatedAt() { return createdAt; }
    public String getExpiresAt() { return expiresAt; }
    public String getUsedAt() { return usedAt; }
    public String getStatus() { return status; }
}
