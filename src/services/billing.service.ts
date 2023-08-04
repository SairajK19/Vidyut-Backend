import {
  ECSlab,
  CommercialFCSlab,
  IndustrialSlab,
  ConsumerType,
  Breakage,
} from "custom";
import {
  commercialRateCollection,
  domesticRateCollection,
  industrialRateCollection,
} from "./initDb";
import { CommercialRate, DomesticRate, IndustrialRate, User } from "../models";
import { DomesticRangeRates } from "../lib/utils";

export const addDomesticRate = async (rateBody: {
  rateType: "Domestic" | "Commercial" | "Industrial";
  slabs: Array<ECSlab>;
  validTill: Date;
  fixedChargeRate: number;
  upperLimit: number;
}) => {
  try {
    if (rateBody.slabs.length != 5) {
      throw new Error("Invalid request body");
    }

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
      validFrom: new Date(),
      validTill: new Date(rateBody.validTill),
    } as DomesticRate);

    if (createdRate) {
      return true;
    }
    return false;
  } catch (err) {
    console.log(err);
    throw new Error(err.message);
  }
};

export const addCommercialRate = async (rateBody: {
  rateType: "Domestic" | "Commercial" | "Industrial";
  slabs: Array<ECSlab>;
  validTill: Date;
  fixedChargeRate: number | Array<CommercialFCSlab>;
}) => {
  try {
    if (rateBody.slabs.length != 5) {
      throw new Error("Invalid request body");
    }

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
      validFrom: new Date(),
      validTill: new Date(rateBody.validTill),
    } as CommercialRate);

    if (createdRate) {
      return true;
    }

    return false;
  } catch (err) {
    console.log(err);
    throw new Error(err.message);
  }
};

export const addIndustrialRate = async (rateBody: {
  rateType: "Domestic" | "Commercial" | "Industrial";
  slabs: Array<ECSlab | IndustrialSlab>;
  validTill: Date;
  fixedChargeRate: number;
}) => {
  try {
    if (rateBody.slabs.length != 2) {
      throw new Error(
        "Invalid request body, slab cannot be more or less than 2 for industrial"
      );
    }
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
      validFrom: new Date(),
      validTill: new Date(rateBody.validTill),
    } as IndustrialRate);

    if (createdRate) {
      return true;
    }

    return false;
  } catch (err) {
    console.log(err);
    throw new Error(err.message);
  }
};

export const updateDomesticRate = async ( rateBody: {
  rateType: "Domestic" | "Commercial" | "Industrial";
  slabs: Array<ECSlab>;
  fixedChargeRate: number;
  upperLimit: number;
}) => {
  try {
    if (rateBody.slabs.length != 5) {
      throw new Error("Invalid request body");
    }

    const currentRateDoc = (
      await domesticRateCollection.where("latest", "==", true).get()
    ).docs[0];

    const updatedRate = await domesticRateCollection.doc(currentRateDoc.id).update({
      fixedChargeRate: rateBody.fixedChargeRate,
      slabs: rateBody.slabs,
    } as DomesticRate);

    if (updatedRate) {
      return true;
    }
    return false;
  } catch (err) {
    console.log(err);
    throw new Error(err.message);
  }
};

export const updateIndustrialRate = async ( rateBody: {
  rateType: "Domestic" | "Commercial" | "Industrial";
  slabs: Array<ECSlab | IndustrialSlab>;
  fixedChargeRate: number;
  upperLimit: number;
}) => {
  try {
    if (rateBody.slabs.length != 2) {
      throw new Error(
        "Invalid request body, slab cannot be more or less than 2 for industrial"
      );
    }
    const currentRateDoc = (
      await industrialRateCollection.where("latest", "==", true).get()
    ).docs[0];

    console.log(currentRateDoc.data);

    const updatedRate = await industrialRateCollection.doc(currentRateDoc.id).update({
      fixedChargeRate: rateBody.fixedChargeRate,
      slabs: rateBody.slabs,
    } as IndustrialRate);

    if (updatedRate) {
      return true;
    }

    return false;
  } catch (err) {
    console.log(err);
    throw new Error(err.message);
  }
};

export const updateCommercialRate = async (rateBody: {
  rateType: "Domestic" | "Commercial" | "Industrial";
  slabs: Array<ECSlab>;
  fixedChargeRate: number | Array<CommercialFCSlab>;
}) => {
  try {
    if (rateBody.slabs.length != 5) {
      throw new Error("Invalid request body");
    }

    const currentRateDoc = (
      await commercialRateCollection.where("latest", "==", true).get()
    ).docs[0];

    const updatedRate = await commercialRateCollection.doc(currentRateDoc.id).update({
      fixedChargeRate: rateBody.fixedChargeRate,
      slabs: rateBody.slabs,
    } as CommercialRate);

    if (updatedRate) {
      return true;
    }

    return false;
  } catch (err) {
    console.log(err);
    throw new Error(err.message);
  }
};


export const getRateDoc = async (consumerType: ConsumerType) => {
  try {
    var rateDoc = null;
    switch (consumerType) {
      case "Domestic":
        rateDoc = (
          await domesticRateCollection.where("latest", "==", true).get()
        ).docs[0];
        break;
      case "Commercial":
        rateDoc = (
          await commercialRateCollection.where("latest", "==", true).get()
        ).docs[0];
        break;
      case "Industrial":
        rateDoc = (
          await industrialRateCollection.where("latest", "==", true).get()
        ).docs[0];
        break;
    }

    if (!rateDoc) {
      throw new Error(`No valid document for ${consumerType} not found`);
    }

    return rateDoc;
  } catch (err) {
    console.log(err);
    throw new Error(err.message);
  }
};

export const calculateDomesticTotalCharge = async (
  consumption: number,
  rateDocData: DomesticRate,
  consumer: User
): Promise<{ totalCharge: number; breakage: Array<Breakage> } | null> => {
  try {
    const breakage: Array<Breakage> = [];
    var totalCharge = 0;

    console.log(`CONSUMER`, consumer);
    console.log(`RATE_DOC_DATA`, rateDocData);
    console.log(`CONSUMPTION`, consumption)

    return null;
  } catch (err) {
    console.log(err);
    throw new Error(err.message);
  }
};
