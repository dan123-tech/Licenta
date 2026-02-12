package com.company.carsharing.models;

import com.google.gson.annotations.SerializedName;

public class Reservation {
    @SerializedName("id")
    private String id;
    @SerializedName("carId")
    private String carId;
    @SerializedName("car")
    private Car car;
    @SerializedName("userId")
    private String userId;
    @SerializedName("user")
    private User user;
    @SerializedName("startDate")
    private String startDate;
    @SerializedName("endDate")
    private String endDate;
    @SerializedName("purpose")
    private String purpose;
    @SerializedName("status")
    private String status;
    @SerializedName("pickup_code")
    private String pickupCode;
    @SerializedName("release_code")
    private String releaseCode;
    @SerializedName("code_valid_from")
    private String codeValidFrom;
    @SerializedName("releasedKmUsed")
    private Integer releasedKmUsed;
    @SerializedName("releasedExceededReason")
    private String releasedExceededReason;
    @SerializedName("releasedExceededStatus")
    private String releasedExceededStatus;
    @SerializedName("createdAt")
    private String createdAt;
    @SerializedName("updatedAt")
    private String updatedAt;

    public String getId() { return id; }
    public String getCarId() { return carId; }
    public Car getCar() { return car; }
    public String getUserId() { return userId; }
    public User getUser() { return user; }
    public String getStartDate() { return startDate; }
    public String getEndDate() { return endDate; }
    public String getPurpose() { return purpose; }
    public String getStatus() { return status; }
    public String getPickupCode() { return pickupCode; }
    public String getReleaseCode() { return releaseCode; }
    public String getCodeValidFrom() { return codeValidFrom; }
    public Integer getReleasedKmUsed() { return releasedKmUsed; }
    public String getReleasedExceededReason() { return releasedExceededReason; }
    public String getReleasedExceededStatus() { return releasedExceededStatus; }
    public String getCreatedAt() { return createdAt; }
    public String getUpdatedAt() { return updatedAt; }
}
