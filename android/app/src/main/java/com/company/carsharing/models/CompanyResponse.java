package com.company.carsharing.models;

import com.google.gson.annotations.SerializedName;

/** GET /api/companies/current and POST /api/companies/join return { company } */
public class CompanyResponse {
    @SerializedName("company")
    private Company company;
    public Company getCompany() { return company; }
}
