package com.company.carsharing.models;

import com.google.gson.annotations.SerializedName;

/**
 * User model matching the web app API response.
 */
public class User {
    @SerializedName("id")
    private String id;

    @SerializedName("email")
    private String email;

    @SerializedName("name")
    private String name;

    @SerializedName("role")
    private String role;

    @SerializedName("companyId")
    private String companyId;
    @SerializedName("drivingLicenceStatus")
    private String drivingLicenceStatus;
    @SerializedName("drivingLicenceUrl")
    private String drivingLicenceUrl;

    public String getId() {
        return id;
    }

    public String getEmail() {
        return email;
    }

    public String getName() {
        return name;
    }

    public String getRole() {
        return role;
    }

    public String getCompanyId() {
        return companyId;
    }
    public String getDrivingLicenceStatus() { return drivingLicenceStatus; }
    public String getDrivingLicenceUrl() { return drivingLicenceUrl; }
}
