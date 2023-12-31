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
  consumerType: ConsumerType;
  sanctionedLoad: number;
  meterNumber: number;
  currentDate: string;
  dueDate: string;
  currentReading: number;
  paymentDate: string;
  previousReading: number;
  consumption: number;
  breakage: Array<Breakage>;
  fixedCharge: { amount: number; calculation: string };
  meterRent: number;
  totalCharge: number;
  paid: boolean;
  rateDocId: string;
  latest: boolean;
  totalEC: number;
};

export type DomesticRate = {
  slabs: Array<ECSlab>;
  fixedChargeRate: number;
  latest: boolean;
  validFrom: string;
  validTill: string;
  type: "Domestic";
};

export type IndustrialRate = {
  slabs: Array<IndustrialSlab>;
  fixedChargeRate: number;
  latest: boolean;
  validFrom: string;
  validTill: string;
  type: "Industrial";
};

export type CommercialRate = {
  slabs: Array<ECSlab>;
  fixedChargeRate: Array<CommercialFCSlab>;
  latest: boolean;
  validFrom: string;
  validTill: string;
  type: "Commercial";
};

export type Complaint = {
  description: string;
  status: "Resolved" | "Rejected" | "Pending";
  billDocId: string;
  consumerDocId: string;
  complaintType: "meterReading" | "slabRate";
};

export type OTP = {
  email: string;
  otp: number;
};
