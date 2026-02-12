package com.company.carsharing.models;

import com.google.gson.annotations.SerializedName;

/**
 * Company model matching the web app API response.
 */
public class Company {
    @SerializedName("id")
    private String id;
    @SerializedName("name")
    private String name;
    @SerializedName("domain")
    private String domain;
    @SerializedName("joinCode")
    private String joinCode;
    @SerializedName("defaultKmUsage")
    private Integer defaultKmUsage;
    @SerializedName("averageFuelPricePerLiter")
    private Double averageFuelPricePerLiter;
    @SerializedName("defaultConsumptionL100km")
    private Double defaultConsumptionL100km;
    @SerializedName("priceBenzinePerLiter")
    private Double priceBenzinePerLiter;
    @SerializedName("priceDieselPerLiter")
    private Double priceDieselPerLiter;
    @SerializedName("priceElectricityPerKwh")
    private Double priceElectricityPerKwh;
    @SerializedName("_count")
    private Count count;

    public static class Count {
        @SerializedName("members")
        public Integer members;
        @SerializedName("cars")
        public Integer cars;
    }

    public String getId() { return id; }
    public String getName() { return name; }
    public String getDomain() { return domain; }
    public String getJoinCode() { return joinCode; }
    public int getDefaultKmUsage() { return defaultKmUsage != null ? defaultKmUsage : 100; }
    public Double getAverageFuelPricePerLiter() { return averageFuelPricePerLiter; }
    public double getDefaultConsumptionL100km() { return defaultConsumptionL100km != null ? defaultConsumptionL100km : 7.5; }
    public Double getPriceBenzinePerLiter() { return priceBenzinePerLiter; }
    public Double getPriceDieselPerLiter() { return priceDieselPerLiter; }
    public Double getPriceElectricityPerKwh() { return priceElectricityPerKwh; }
    public Count getCount() { return count; }
}
