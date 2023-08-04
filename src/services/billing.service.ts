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
      type: "Domestic",
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
      type: "Commercial",
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
      type: "Industrial",
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
      throw new Error(`No valid document for ${consumerType} found`);
    }

    return rateDoc;
  } catch (err) {
    console.log(err);
    throw new Error(err.message);
  }
};

export const calculateDomesticOrCommercialTotalCharge = async (
  consumption: number,
  rateDocData: DomesticRate | CommercialRate,
  consumer: User
): Promise<{
  totalCharge: number;
  breakage: Array<Breakage>;
  fixedCharge: { amount: number; calculation: string };
} | null> => {
  const breakage: Array<Breakage> = [];
  var totalEnergyCharges = 0;

  for (var i = 0; i < rateDocData.slabs.length; i++) {
    var rate;
    if (i == 0) {
      rate = rateDocData.slabs.find((slab) => slab.range == `0-100`);
    } else if (i == rateDocData.slabs.length - 1) {
      rate = rateDocData.slabs.find((slab) => slab.range == ">400");
    } else {
      rate = rateDocData.slabs.find(
        (slab) => slab.range == `${100 * i + 1}-${100 * (i + 1)}`
      );
    }

    if (consumption < 100 || rate.range == ">400") {
      breakage.push({
        amount: Math.round(consumption * rate.pricePerUnit),
        quantity: consumption,
        rate: rate.pricePerUnit,
      });

      totalEnergyCharges += consumption * rate.pricePerUnit;
      consumption -= consumption;
    } else {
      breakage.push({
        amount: Math.round(100 * rate.pricePerUnit),
        quantity: 100,
        rate: rate.pricePerUnit,
      });

      totalEnergyCharges += 100 * rate.pricePerUnit;
      consumption -= 100;
    }

    if (consumption == 0) {
      break;
    }
  }

  if (
    consumer.consumerType == "Commercial" &&
    rateDocData.type == "Commercial"
  ) {
    const fixedCharge =
      consumer.sanctionedLoad < 20
        ? rateDocData.fixedChargeRate.find((charge) => charge.range == "0-20")
            .pricePerUnit
        : consumer.sanctionedLoad < 90
        ? rateDocData.fixedChargeRate.find((charge) => charge.range == "20-90")
            .pricePerUnit
        : 0;

    if (fixedCharge == 0) {
      throw new Error(
        `Invalid fixed charge, Sanc Load cannot be more than 90. It is ${consumer.sanctionedLoad}`
      );
    }

    console.log("Fixed Charge", fixedCharge)

    return {
      breakage: breakage,
      totalCharge:
        totalEnergyCharges +
        consumer.sanctionedLoad +
        fixedCharge -
        consumer.subsidyRate,
      fixedCharge: {
        amount: fixedCharge * consumer.sanctionedLoad,
        calculation: `${fixedCharge} * ${consumer.sanctionedLoad}`,
      },
    };
  } else if (
    consumer.consumerType == "Domestic" &&
    rateDocData.type == "Domestic"
  ) {
    const fixedCharge = consumer.sanctionedLoad * rateDocData.fixedChargeRate;

    return {
      breakage: breakage,
      totalCharge: totalEnergyCharges + fixedCharge - consumer.subsidyRate,
      fixedCharge: {
        amount: rateDocData.fixedChargeRate * consumer.sanctionedLoad,
        calculation: `${rateDocData.fixedChargeRate} * ${consumer.sanctionedLoad}`,
      },
    };
  }
};

export const calculateIndustrialTotalCharge = async (
  consumption: number,
  rateDocData: IndustrialRate,
  consumer: User
): Promise<{
  totalCharge: number;
  breakage: Array<Breakage>;
  fixedCharge: { amount: number; calculation: string };
} | null> => {
  const breakage: Array<Breakage> = [];
  var totalEnergyCharges = 0;

  await Promise.all(
    rateDocData.slabs.map(() => {
      if (consumption > 500) {
        const amount =
          500 *
          rateDocData.slabs.find((slab) => slab.range == "0-500").pricePerUnit;

        breakage.push({
          amount: amount,
          quantity: 500,
          rate: rateDocData.slabs.find((slab) => slab.range == "0-500")
            .pricePerUnit,
        });

        totalEnergyCharges += amount;
        consumption -= 500;
      } else if (consumption < 500 && consumption > 0) {
        const amount =
          consumption *
          rateDocData.slabs.find((slab) => slab.range == "0-500").pricePerUnit;

        breakage.push({
          amount: amount,
          quantity: consumption,
          rate: rateDocData.slabs.find((slab) => slab.range == "0-500")
            .pricePerUnit,
        });

        totalEnergyCharges += amount;
        consumption -= consumption;
      }
    })
  );
  const fixedCharge = consumer.sanctionedLoad * rateDocData.fixedChargeRate;

  return {
    breakage: breakage,
    totalCharge: totalEnergyCharges + fixedCharge - consumer.subsidyRate,
    fixedCharge: {
      amount: rateDocData.fixedChargeRate * consumer.sanctionedLoad,
      calculation: `${rateDocData.fixedChargeRate}*${consumer.sanctionedLoad}`,
    },
  };
};
