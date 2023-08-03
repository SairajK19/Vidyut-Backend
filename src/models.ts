import {
  Breakage,
  ConsumerType,
  ECSlab,
  CommercialFCSlab,
  IndustrialSlab,
} from "./@custom_types/custom";
import { Timestamp } from "@google-cloud/firestore";

type SubsidyDoc = { fileName: string; url: string };

export type Admin = {
  userName: string;
  password: string;
};

export type UserApplicationStatus = "Approved" | "Pending" | "Rejected";

export type User = {
  phoneNumber: number;
  fullName: string;
  address: string;
  email: string;
  meterNumber: number;
  sanctionedLoad: number;
  consumerType: ConsumerType;
  subsidyRate: number;
  phase: 1 | 3;
  approved: boolean;
  supportingDocs: Array<SubsidyDoc>;
  status: UserApplicationStatus;
  rejectionReason: string | null;
};

export type Billing = {
  consumerDocId: string;
  meterNumber: number;
  currentDate: Timestamp;
  paymentDate: Timestamp;
  previousReading: number;
  consumption: number;
  breakage: Array<Breakage>;
  fixedCharge: number;
  meterRent: number;
  totalCharge: number;
  paid: boolean;
  rateDocId: string;
};

export type DomesticRate = {
  slabs: Array<ECSlab>;
  fixedChargeRate: number;
  latest: boolean;
};

export type IndustrialRate = {
  slabs: Array<IndustrialSlab>;
  fixedChargeRate: number;
  latest: boolean;
};

export type CommercialRate = {
  slabs: Array<ECSlab>;
  fixedChargeRate: Array<CommercialFCSlab>;
  latest: boolean;
};

export type Complaint = {
  description: string;
  status: "Resolved" | "Rejected" | "Pending";
  billDocId: string;
  consumerDocId: string;
};
