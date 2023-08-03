import { Breakage, ConsumerType, ECSlab, IndustrialFCSlab, IndustrialSlab } from "./@custom_types/custom"
import { Timestamp } from "@google-cloud/firestore";

export type Admin = {
    userName: string,
    password: string
}

export type UserApplicationStatus = "Approved" | "Pending" | "Rejected"

export type User = {
    phoneNumber: number,
    fullName: string,
    address: string,
    email: string,
    meterNumber: number,
    sanctionedLoad: number,
    consumerType: ConsumerType,
    subsidyRate: number,
    phase: 1 | 3,
    approved: boolean,
    supportingDocs: Array<string>,
    status: UserApplicationStatus 
}

export type Billing = {
    consumerDocId: string,
    meterNumber: number,
    currentDate: Timestamp,
    paymentDate: Timestamp,
    previousReading: number,
    consumption: number,
    breakage: Array<Breakage>,
    fixedCharge: number,
    meterRent: number,
    totalCharge: number,
    paid: boolean
    rateDocId: string
}

export type DomesticRate = {
    slabs: Array<ECSlab>
    fixedChargeRate: number
}

export type IndustrialRate = {
    slabs: Array<ECSlab>,
    fixedChargeRate: number
}

export type CommercialRate = {
    slabs: Array<IndustrialSlab>,
    fixedChargeRate: Array<IndustrialFCSlab>
}

export type Complaint = {
    description: string,
    status: "Resolved"|"Rejected"|"Pending",
    billDocId: string,
    consumerDocId:string
}