import { ECSlab, CommercialFCSlab, IndustrialSlab } from "custom";
import {
  commercialRateCollection,
  domesticRateCollection,
  industrialRateCollection,
} from "./initDb";
import { CommercialRate, DomesticRate, IndustrialRate } from "../models";

export const addDomesticRate = async (rateBody: {
  rateType: "Domestic" | "Commercial" | "Industrial";
  slabs: Array<ECSlab>;
  fixedChargeRate: number;
  upperLimit: number;
}) => {
  const previousRateDoc = (
    await domesticRateCollection.where("latest", "==", true).get()
  ).docs[0];

  if (previousRateDoc) {
    await domesticRateCollection
      .doc(previousRateDoc.id)
      .update({ latest: false } as DomesticRate);
  }

  const createdRate = await domesticRateCollection.add({
    fixedChargeRate: rateBody.fixedChargeRate,
    slabs: rateBody.slabs,
    latest: true,
  } as DomesticRate);

  if (createdRate) {
    return true;
  }
  return false;
};

export const addCommercialRate = async (rateBody: {
  rateType: "Domestic" | "Commercial" | "Industrial";
  slabs: Array<ECSlab>;
  fixedChargeRate: number | Array<CommercialFCSlab>;
}) => {
  const previousRateDoc = (
    await commercialRateCollection.where("latest", "==", true).get()
  ).docs[0];

  if (previousRateDoc) {
    await commercialRateCollection
      .doc(previousRateDoc.id)
      .update({ latest: false } as CommercialRate);
  }

  const createdRate = await commercialRateCollection.add({
    fixedChargeRate: rateBody.fixedChargeRate,
    slabs: rateBody.slabs,
    latest: true,
  } as CommercialRate);

  if (createdRate) {
    return true;
  }

  return false;
};

export const addIndustrialRate = async (rateBody: {
  rateType: "Domestic" | "Commercial" | "Industrial";
  slabs: Array<ECSlab | IndustrialSlab>;
  fixedChargeRate: number;
}) => {
  const previousRateDoc = (
    await industrialRateCollection.where("latest", "==", true).get()
  ).docs[0];

  if (previousRateDoc) {
    await industrialRateCollection
      .doc(previousRateDoc.id)
      .update({ latest: false } as IndustrialRate);
  }

  const createdRate = await industrialRateCollection.add({
    fixedChargeRate: rateBody.fixedChargeRate,
    slabs: rateBody.slabs,
    latest: true,
  } as IndustrialRate);

  if (createdRate) {
    return true;
  }

  return false;
};
