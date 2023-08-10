import {
  ECSlab,
  CommercialFCSlab,
  IndustrialSlab,
  ConsumerType,
  Breakage,
} from "custom";
import {
  billingCollection,
  commercialRateCollection,
  consumerCollection,
  domesticRateCollection,
  industrialRateCollection,
} from "./initDb";
import {
  Billing,
  CommercialRate,
  DomesticRate,
  IndustrialRate,
  User,
} from "../models";
import { DomesticRangeRates, createPDFAndMail } from "../lib/utils";
import moment from "moment";

export const addDomesticRate = async (rateBody: {
  rateType: "Domestic" | "Commercial" | "Industrial";
  slabs: Array<ECSlab>;
  validTill: string;
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
      validFrom: moment().format("MM-DD-YYYY").toString(),
      validTill: rateBody.validTill,
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
  validTill: string;
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
      validFrom: moment().format("MM-DD-YYYY").toString(),
      validTill: rateBody.validTill,
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
  validTill: string;
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

    console.log({
      fixedChargeRate: rateBody.fixedChargeRate,
      slabs: rateBody.slabs,
      latest: true,
      validFrom: moment().format("MM-DD-YYYY").toString(),
      validTill: rateBody.validTill,
      type: "Industrial",
    });

    const createdRate = await industrialRateCollection.add({
      fixedChargeRate: rateBody.fixedChargeRate,
      slabs: rateBody.slabs,
      latest: true,
      validFrom: moment().format("MM-DD-YYYY").toString(),
      validTill: rateBody.validTill,
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

export const updateDomesticRate = async (rateBody: {
  rateType: "Domestic" | "Commercial" | "Industrial";
  slabs: Array<ECSlab>;
  fixedChargeRate: number;
  upperLimit: number;
  validTill: string;
}) => {
  try {
    if (rateBody.slabs.length != 5) {
      throw new Error("Invalid request body");
    }

    const currentRateDoc = (
      await domesticRateCollection.where("latest", "==", true).get()
    ).docs[0];

    const updatedRate = await domesticRateCollection
      .doc(currentRateDoc.id)
      .update({
        fixedChargeRate: rateBody.fixedChargeRate,
        slabs: rateBody.slabs,
        validTill: rateBody.validTill,
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

export const updateIndustrialRate = async (rateBody: {
  rateType: "Domestic" | "Commercial" | "Industrial";
  slabs: Array<ECSlab | IndustrialSlab>;
  fixedChargeRate: number;
  upperLimit: number;
  validTill: string;
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

    const updatedRate = await industrialRateCollection
      .doc(currentRateDoc.id)
      .update({
        fixedChargeRate: rateBody.fixedChargeRate,
        slabs: rateBody.slabs,
        validTill: rateBody.validTill,
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
  validTill: string;
}) => {
  try {
    if (rateBody.slabs.length != 5) {
      throw new Error("Invalid request body");
    }

    const currentRateDoc = (
      await commercialRateCollection.where("latest", "==", true).get()
    ).docs[0];

    const updatedRate = await commercialRateCollection
      .doc(currentRateDoc.id)
      .update({
        fixedChargeRate: rateBody.fixedChargeRate,
        slabs: rateBody.slabs,
        validTill: rateBody.validTill,
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
      throw new Error(`No valid document for ${consumerType} found`);
    }
    return rateDoc;
  } catch (err) {
    console.log(err);
    throw new Error(err.message);
  }
};

export const getCorrespondingBillRateDoc = async (
  consumerType: ConsumerType,
  rateDocId: string
) => {
  try {
    var rateDoc = null;
    switch (consumerType) {
      case "Domestic":
        rateDoc = await domesticRateCollection.doc(rateDocId).get();
        break;
      case "Commercial":
        rateDoc = await commercialRateCollection.doc(rateDocId).get();
        break;
      case "Industrial":
        rateDoc = await industrialRateCollection.doc(rateDocId).get();
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
  subsidyDiscount: number;
  meterRent: number;
  totalEC: number;
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
    const fixedChargeRate =
      consumer.sanctionedLoad < 20
        ? rateDocData.fixedChargeRate.find((charge) => charge.range == "0-20")
            .pricePerUnit
        : consumer.sanctionedLoad < 90
        ? rateDocData.fixedChargeRate.find((charge) => charge.range == "20-90")
            .pricePerUnit
        : 0;

    if (fixedChargeRate == 0) {
      throw new Error(
        `Invalid fixed charge, Sanc Load cannot be more than 90. It is ${consumer.sanctionedLoad}`
      );
    }

    console.log("Fixed Charge", fixedChargeRate);
    const meterRent = consumer.phase == 1 ? 15 : 25;
    const fixedCharge = consumer.sanctionedLoad * fixedChargeRate;
    console.log(
      consumer.subsidyRate,
      totalEnergyCharges,
      fixedCharge,
      meterRent,
      consumer.subsidyRate / 100,
      totalEnergyCharges + fixedCharge + meterRent,
      "Billing"
    );
    const subsidyDiscount =
      (consumer.subsidyRate / 100) *
      (totalEnergyCharges + fixedCharge + meterRent);

    return {
      breakage: breakage,

      totalCharge:
        totalEnergyCharges + meterRent + fixedCharge - subsidyDiscount,

      fixedCharge: {
        amount: Math.round(fixedChargeRate * consumer.sanctionedLoad),
        calculation: `${fixedChargeRate} * ${consumer.sanctionedLoad}`,
      },

      meterRent: meterRent,
      subsidyDiscount: Math.round(subsidyDiscount),
      totalEC: totalEnergyCharges,
    };
  } else if (
    consumer.consumerType == "Domestic" &&
    rateDocData.type == "Domestic"
  ) {
    const meterRent = consumer.phase == 1 ? 15 : 25;
    const fixedCharge = consumer.sanctionedLoad * rateDocData.fixedChargeRate;
    const subsidyDiscount =
      (consumer.subsidyRate / 100) *
      (totalEnergyCharges + fixedCharge + meterRent);

    return {
      breakage: breakage,

      totalCharge:
        totalEnergyCharges + fixedCharge + meterRent - subsidyDiscount,

      fixedCharge: {
        amount: Math.round(
          rateDocData.fixedChargeRate * consumer.sanctionedLoad
        ),
        calculation: `${rateDocData.fixedChargeRate} * ${consumer.sanctionedLoad}`,
      },

      meterRent: meterRent,
      subsidyDiscount: Math.round(subsidyDiscount),
      totalEC: totalEnergyCharges,
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
  subsidyDiscount: number;
  meterRent: number;
  totalEC: number;
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
          amount: Math.round(amount),
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
  const meterRent = consumer.phase == 1 ? 15 : 25;
  const subsidyDiscount =
    (consumer.subsidyRate / 100) *
    (totalEnergyCharges + fixedCharge + meterRent);

  return {
    breakage: breakage,

    totalCharge: totalEnergyCharges + fixedCharge + meterRent - subsidyDiscount,

    fixedCharge: {
      amount: Math.round(rateDocData.fixedChargeRate * consumer.sanctionedLoad),
      calculation: `${rateDocData.fixedChargeRate}*${consumer.sanctionedLoad}`,
    },

    meterRent: meterRent,
    subsidyDiscount: subsidyDiscount,
    totalEC: totalEnergyCharges,
  };
};

export async function updateBillingStatus(billId: string) {
  const updatePaymentStatus = await billingCollection.doc(billId).update({
    paid: true,
    paymentDate: moment().format("MM-DD-YYYY").toString(),
  } as Billing);
  return updatePaymentStatus;
}

export const sendMailIfBillOverDue = async () => {
  const bills = await billingCollection.get();

  await Promise.all(
    bills.docs.map(async (bill) => {
      const billDueDate = bill.data().dueDate;
      console.log(billDueDate);
      if (moment().isAfter(moment(new Date(billDueDate)).toISOString())) {
        const consumer = await consumerCollection
          .doc(bill.data().consumerDocId)
          .get();

        const subsidyDiscount =
          (consumer.data().subsidyRate / 100) *
          (bill.data().totalEC +
            bill.data().fixedCharge.amount +
            bill.data().meterRent);

        createPDFAndMail(
          { ...(bill.data() as Billing), subsidyDiscount },
          consumer.data() as User,
          bill.id,
          false,
          true
        );

        console.log("Sent overdue bill");
      }
    })
  );
};
