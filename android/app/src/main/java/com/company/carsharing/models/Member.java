package com.company.carsharing.models;

import com.google.gson.annotations.SerializedName;

public class Member {
    @SerializedName("id")
    private String id;
    @SerializedName("userId")
    private String userId;
    @SerializedName("email")
    private String email;
    @SerializedName("name")
    private String name;
    @SerializedName("role")
    private String role;
    @SerializedName("status")
    private String status;
    @SerializedName("drivingLicenceStatus")
    private String drivingLicenceStatus;
    @SerializedName("drivingLicenceUrl")
    private String drivingLicenceUrl;

    public String getId() { return id; }
    public String getUserId() { return userId; }
    public String getEmail() { return email; }
    public String getName() { return name; }
    public String getRole() { return role; }
    public String getStatus() { return status; }
    public String getDrivingLicenceStatus() { return drivingLicenceStatus; }
    public String getDrivingLicenceUrl() { return drivingLicenceUrl; }
}
