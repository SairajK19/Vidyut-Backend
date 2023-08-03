import "express-session";
export type ConsumerType = "Domestic" | "Commercial" | "Industrial";

export type Breakage = {
  quantity: number;
  rate: number;
  amount: number;
};

export type ECSlab = {
  range: "0-100" | "101-200" | "201-300" | "301-400" | ">400";
  pricePerUnit: number;
};

export type IndustrialSlab = {
  range: "0-500" | ">500";
  pricePerUnit: number;
};

export type CommercialFCSlab = {
  range: "0-20" | "20-90";
  pricePerUnit: number;
};

type UserSession = {
  userDocId: string | null;
  loggedIn: boolean;
};

export enum DomesticRangeRates {
  ZeroToHundred = 1.6,
  HundredOneToTwoHundred = 2.35,
  TwoHundredOneToThreeHundred = 2.95,
  ThreeHundredOneToFourHundred = 3.9,
  AboveFourHundred = 4.5,
}

export enum CommercialRangeRate {
  ZeroToHundred = 3.55,
  HundredOneToTwoHundred = 4.35,
  TwoHundredOneToThreeHundred = 4.85,
  ThreeHundredOneToFourHundred = 4.85,
  AboveFourHundred = 5.25,
}

export enum IndustrialRangeRate {
  ZeroToFiveHundred = 3.4,
  AboveFiveHundred = 3.95,
}

declare module "express-session" {
  interface SessionData {
    userData: UserSession;
  }
}
