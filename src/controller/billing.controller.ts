import { Router } from "express";
import {
  addCommercialRate,
  addDomesticRate,
  addIndustrialRate,
  calculateDomesticOrCommercialTotalCharge,
  calculateIndustrialTotalCharge,
  getCorrespondingBillRateDoc,
  getRateDoc,
  updateCommercialRate,
  updateDomesticRate,
  updateIndustrialRate,
} from "../services/billing.service";
import { Breakage, ConsumerType } from "custom";
import {
  Billing,
  CommercialRate,
  Complaint,
  DomesticRate,
  IndustrialRate,
} from "../models";
import {
  commercialRateCollection,
  complaintCollection,
  consumerCollection,
  domesticRateCollection,
  industrialRateCollection,
} from "../services/initDb";
import { billingCollection } from "../services/initDb";
import { User } from "../models";
import { updateBillingStatus } from "../services/billing.service";
import path from "path";
import ejs from "ejs";
import HTMLToPDF from "convert-html-to-pdf";
import { createPDFAndMail } from "../lib/utils";

export const billingRouter = Router();

/**
 * This route will be used to add slab rates
 *
 * The request object will contain the following object
 * {
 *  rateType: "Domestic" | "Commercial" | "Industrial",
 *  slabs: Array<ECSlab | IndustrialSlab>,
 *  fixedChargeRate: number | Array<CommercialFCSlab>,
 *  validTill: string
 * }
 */
billingRouter.post("/createRate", async (req, res) => {
  try {
    var addedRate = null;
    switch (req.body.rateType as ConsumerType) {
      case "Domestic":
        addedRate = await addDomesticRate(req.body);
        break;
      case "Commercial":
        addedRate = await addCommercialRate(req.body);
        break;
      case "Industrial":
        addedRate = await addIndustrialRate(req.body);
        break;
      default:
        return res.status(401).json({
          success: false,
          message: `Invalid rate type or consumer type ${req.body.rateType}`,
        });
    }

    !addedRate
      ? res.status(500).json({
          success: false,
          message: "Rate creation failed, please try again",
        })
      : res.status(200).json({
          success: true,
          message: `Created rate successfully for ${req.body.rateType}`,
        });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      message: "Failed to add rates",
      error: err.message,
      success: false,
    });
  }
});

billingRouter.post("/updateRate", async (req, res) => {
  try {
    var updatededRate = null;

    switch (req.body.rateType as ConsumerType) {
      case "Domestic":
        updatededRate = updateDomesticRate(req.body);
        break;
      case "Commercial":
        updatededRate = await updateCommercialRate(req.body);
        break;
      case "Industrial":
        updatededRate = await updateIndustrialRate(req.body);
        break;
      default:
        return res.status(401).json({
          success: false,
          message: `Invalid rate type or consumer type ${req.body.rateType}`,
        });
    }

    !updatededRate
      ? res.status(500).json({
          success: false,
          message: "Rate updation failed, please try again",
        })
      : res.status(200).json({
          success: true,
          message: `Updated rate successfully for ${req.body.rateType}`,
        });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      message: "Failed to update rates",
      error: err.message,
      success: false,
    });
  }
});

/**
 * This route will be used to create a bill
 *
 * The request object should contain following properties
 * {
 *  billReadings: Array<{
 *      consumerId: string,
 *      meterNumber: number,
 *      currentReading: number,
 *      dateOfReading: Date
 *  }>
 * }
 */
billingRouter.post("/createBill", async (req, res) => {
  try {
    const bills: Array<
      Billing & { meterRent: number; subsidyDiscount: number }
    > = [];
    const failedBills: Array<{ reason: string; consumerId: string }> = [];
    if (req.body.billReadings.length < 1) {
      return res.status(400).json({});
    }

    await Promise.all(
      req.body.billReadings.map(
        async (reading: {
          consumerId: string;
          meterNumber: number;
          currentReading: number;
          dateOfReading: string;
          dueDate: string;
        }) => {
          const consumer = (
            await consumerCollection.doc(reading.consumerId).get()
          ).data() as User;

          if (!consumer) {
            console.log(
              `Invalid consumer Id ${reading.consumerId}, consumer not found!`
            );
            failedBills.push({
              consumerId: reading.consumerId,
              reason: "Consumer not found",
            });

            return;
          } else if (consumer.meterNumber != reading.meterNumber) {
            console.log(`Invalid meter number ${reading.meterNumber}!`);
            failedBills.push({
              consumerId: reading.consumerId,
              reason: "Meter number not corresponding to the consumer",
            });

            return;
          } else if (!consumer.approved) {
            console.log(`Consumer ${consumer.fullName} not yet approved`);
            failedBills.push({
              consumerId: reading.consumerId,
              reason: "Consumer not yet approved",
            });

            return;
          }

          const previousBillDoc = (
            await billingCollection
              .where("consumerDocId", "==", reading.consumerId)
              .where("latest", "==", true)
              .get()
          ).docs[0];

          const previousBill = previousBillDoc
            ? (previousBillDoc.data() as Billing)
            : null;
          console.log(previousBill, "PREVIOUS");
          const rateDoc = await getRateDoc(consumer.consumerType);

          if (previousBill) {
            await billingCollection
              .doc(previousBillDoc.id)
              .update({ latest: false });

            if (
              Number(reading.currentReading) <
              Number(previousBill.currentReading)
            ) {
              console.log("Previous reading is less than current reading");
              failedBills.push({
                consumerId: reading.consumerId,
                reason: `Previous reading is greater than current reading. Previous reading = ${previousBill.currentReading}, Current reading = ${reading.currentReading}`,
              });

              return;
            }
          }

          var calculatedTotalCharge: {
            totalCharge: number;
            breakage: Array<Breakage>;
            fixedCharge: { amount: number; calculation: string };
            meterRent: number;
            subsidyDiscount: number;
          } = null;

          // Add subsidy percentage
          switch (consumer.consumerType) {
            case "Commercial":
              console.log("Commercial");
              calculatedTotalCharge =
                await calculateDomesticOrCommercialTotalCharge(
                  reading.currentReading -
                    (previousBill ? previousBill.currentReading : 0),
                  rateDoc.data() as DomesticRate,
                  consumer
                );
              break;
            case "Domestic":
              console.log("Domestic");
              calculatedTotalCharge =
                await calculateDomesticOrCommercialTotalCharge(
                  reading.currentReading -
                    (previousBill ? previousBill.currentReading : 0),
                  rateDoc.data() as DomesticRate,
                  consumer
                );
              break;
            case "Industrial":
              console.log("Industrial");
              calculatedTotalCharge = await calculateIndustrialTotalCharge(
                reading.currentReading -
                  (previousBill ? previousBill.currentReading : 0),
                rateDoc.data() as IndustrialRate,
                consumer
              );
              break;
          }

          var totalEC = 0;
          calculatedTotalCharge.breakage.map((slab) => {
            totalEC += slab.amount;
          });

          const bill: Billing = {
            paid: false,
            latest: true,
            consumerDocId: reading.consumerId,
            sanctionedLoad: consumer.sanctionedLoad,
            consumption:
              reading.currentReading -
              (previousBill ? previousBill.currentReading : 0),
            currentDate: reading.dateOfReading,
            currentReading: reading.currentReading,
            meterNumber: consumer.meterNumber,
            paymentDate: null,
            rateDocId: rateDoc.id,
            fixedCharge: calculatedTotalCharge.fixedCharge,
            meterRent: consumer.phase == 1 ? 15 : 25,
            previousReading: previousBill ? previousBill.currentReading : 0,
            totalCharge: Math.round(calculatedTotalCharge.totalCharge),
            breakage: calculatedTotalCharge.breakage,
            consumerType: consumer.consumerType,
            totalEC: Math.round(totalEC),
            dueDate: reading.dueDate,
          };

          const oldBill = (
            await billingCollection
              .where("consumerDocId", "==", reading.consumerId)
              .where("latest", "==", true)
              .get()
          ).docs[0];

          if (oldBill) {
            await billingCollection
              .doc(oldBill.id)
              .update({ latest: false } as Billing);
          }

          const createdBill = await billingCollection.add(bill);
          bills.push({
            ...bill,
            subsidyDiscount: Math.round(calculatedTotalCharge.subsidyDiscount),
            meterRent: calculatedTotalCharge.meterRent,
          });

          createPDFAndMail(
            {
              ...bill,
              subsidyDiscount: Math.round(
                calculatedTotalCharge.subsidyDiscount
              ),
            },
            consumer,
            createdBill.id,
            false,
            false
          );
        }
      )
    );

    res.status(200).json({
      addedBills: bills,
      failedBills,
      success: true,
      createdBills: bills.length,
      message: `Created ${bills.length} out of ${req.body.billReadings.length} bill(s)`,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      message: "Failed to create bills",
      error: err.message,
      success: false,
    });
  }
});

/**
 * {
 *  billId: string,
 *  newReading: number
 * }
 */
billingRouter.post("/billCorrectionMeterReading", async (req, res) => {
  try {
    const currentBillData = (
      await billingCollection.doc(req.body.billId).get()
    ).data() as Billing;
    const rateDoc = await getCorrespondingBillRateDoc(
      currentBillData.consumerType,
      currentBillData.rateDocId
    );
    const consumer = await consumerCollection
      .doc(currentBillData.consumerDocId)
      .get();

    var calculatedTotalCharge: {
      totalCharge: number;
      breakage: Array<Breakage>;
      fixedCharge: { amount: number; calculation: string };
      subsidyDiscount: number;
      totalEC: number;
    } = null;

    switch (currentBillData.consumerType) {
      case "Domestic":
        calculatedTotalCharge = await calculateDomesticOrCommercialTotalCharge(
          Number(req.body.newReading) - currentBillData.previousReading,
          rateDoc.data() as DomesticRate,
          consumer.data() as User
        );
        break;
      case "Commercial":
        calculatedTotalCharge = await calculateDomesticOrCommercialTotalCharge(
          Number(req.body.newReading) - currentBillData.previousReading,
          rateDoc.data() as DomesticRate,
          consumer.data() as User
        );
        break;
      case "Industrial":
        calculatedTotalCharge = await calculateDomesticOrCommercialTotalCharge(
          Number(req.body.newReading) - currentBillData.previousReading,
          rateDoc.data() as DomesticRate,
          consumer.data() as User
        );
        break;
    }

    const updatedBill = await billingCollection.doc(req.body.billId).update({
      ...currentBillData,
      currentReading: Number(req.body.newReading),
      consumption:
        Number(req.body.newReading) - currentBillData.previousReading,
      breakage: calculatedTotalCharge.breakage,
      totalCharge: calculatedTotalCharge.totalCharge,
      totalEC: calculatedTotalCharge.totalEC,
    } as Billing);

    const bill = (
      await billingCollection.doc(req.body.billId).get()
    ).data() as Billing;

    createPDFAndMail(
      {
        ...bill,
        subsidyDiscount: calculatedTotalCharge.subsidyDiscount,
      },
      consumer.data() as User,
      req.body.billId,
      true,
      false
    );

    updatedBill
      ? res.status(200).json({
          success: true,
          message: "Updated bill successfully",
          oldBreakage: currentBillData.breakage,
          newBreakage: calculatedTotalCharge.breakage,
          oldBillAmount: currentBillData.totalCharge,
          newBillAmount: calculatedTotalCharge.totalCharge,
        })
      : res.status(500).json({
          success: false,
          message: "New bill generation failed, please try again",
        });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      message: "Failed to update and regenerate bill",
      error: err.message,
      success: false,
    });
  }
});

/**
 * rateType: "Domestic" | "Commercial" | "Industrial",
 * slabs: Array<ECSlab | IndustrialSlab>
 * complaintId: string
 */
billingRouter.post("/billCorrectionSlabRate", async (req, res) => {
  try {
    const compliant = (
      await complaintCollection.doc(req.body.complaintId).get()
    ).data() as Complaint;

    const currentBillData = (
      await billingCollection.doc(compliant.billDocId).get()
    ).data() as Billing;

    const consumer = await consumerCollection
      .doc(currentBillData.consumerDocId)
      .get();

    var calculatedTotalCharge: {
      totalCharge: number;
      breakage: Array<Breakage>;
      fixedCharge: { amount: number; calculation: string };
      subsidyDiscount: number;
      totalEC: number;
    } = null;
    var rateDoc = null;

    switch (currentBillData.consumerType) {
      case "Domestic":
        await domesticRateCollection.doc(currentBillData.rateDocId).update({
          slabs: req.body.slabs,
        } as DomesticRate);

        rateDoc = await getCorrespondingBillRateDoc(
          currentBillData.consumerType,
          currentBillData.rateDocId
        );

        calculatedTotalCharge = await calculateDomesticOrCommercialTotalCharge(
          currentBillData.consumption,
          rateDoc.data() as DomesticRate,
          consumer.data() as User
        );
        break;
      case "Commercial":
        await commercialRateCollection.doc(currentBillData.rateDocId).update({
          slabs: req.body.slabs,
        } as DomesticRate);

        rateDoc = await getCorrespondingBillRateDoc(
          currentBillData.consumerType,
          currentBillData.rateDocId
        );

        calculatedTotalCharge = await calculateDomesticOrCommercialTotalCharge(
          currentBillData.consumption,
          rateDoc.data() as CommercialRate,
          consumer.data() as User
        );
        break;
      case "Industrial":
        await industrialRateCollection.doc(currentBillData.rateDocId).update({
          slabs: req.body.slabs,
        } as DomesticRate);

        rateDoc = await getCorrespondingBillRateDoc(
          currentBillData.consumerType,
          currentBillData.rateDocId
        );

        calculatedTotalCharge = await calculateIndustrialTotalCharge(
          currentBillData.consumption,
          rateDoc.data() as IndustrialRate,
          consumer.data() as User
        );
        break;
    }

    const updatedBill = await billingCollection
      .doc(compliant.billDocId)
      .update({
        ...currentBillData,
        consumption: currentBillData.consumption,
        breakage: calculatedTotalCharge.breakage,
        totalCharge: calculatedTotalCharge.totalCharge,
        totalEC: calculatedTotalCharge.totalEC,
      } as Billing);

    const bill = (
      await billingCollection.doc(compliant.billDocId).get()
    ).data() as Billing;

    createPDFAndMail(
      {
        ...bill,
        subsidyDiscount: calculatedTotalCharge.subsidyDiscount,
      },
      consumer.data() as User,
      compliant.billDocId,
      true,
      false
    );

    updatedBill
      ? res.status(200).json({
          success: true,
          message: "Updated bill successfully",
          oldBreakage: currentBillData.breakage,
          newBreakage: calculatedTotalCharge.breakage,
          oldBillAmount: currentBillData.totalCharge,
          newBillAmount: calculatedTotalCharge.totalCharge,
        })
      : res.status(500).json({
          success: false,
          message: "New bill generation failed, please try again",
        });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: "internal server error" });
  }
});

/**
 * This route will be used to update the payment
 * status of the bill
 *
 * {
 *  billId: string
 * }
 */
billingRouter.put("/updatePaymentStatus", async (req, res) => {
  try {
    const updatedStatus = await updateBillingStatus(req.body.billId);
    updatedStatus
      ? res.status(200).json({
          success: true,
          message: "Updated Payment status successfully",
        })
      : res
          .status(500)
          .json({ success: false, message: "Payment status update failed" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

billingRouter.get("/currentRates", async (req, res) => {
  try {
    var domesticRate:
      | (DomesticRate & { id: string })
      | FirebaseFirestore.DocumentData = (
      await domesticRateCollection.where("latest", "==", true).get()
    ).docs[0];

    if (!domesticRate) {
      domesticRate = {
        fixedChargeRate: 0,
        id: "Domestic No Rate",
        slabs: [
          {
            pricePerUnit: 0,
            range: "0-100",
          },
          {
            pricePerUnit: 0,
            range: "101-200",
          },
          {
            pricePerUnit: 0,
            range: "201-300",
          },
          {
            pricePerUnit: 0,
            range: "301-400",
          },
          {
            pricePerUnit: 0,
            range: ">400",
          },
        ],
        validFrom: null,
        validTill: null,
        type: "Domestic",
      } as DomesticRate & { id: string };
    } else {
      domesticRate = { ...domesticRate.data(), id: domesticRate.id };
    }

    var commercialRate: CommercialRate | FirebaseFirestore.DocumentData = (
      await commercialRateCollection.where("latest", "==", true).get()
    ).docs[0];

    if (!commercialRate) {
      commercialRate = {
        id: "Commercial No Rate",
        fixedChargeRate: [
          { pricePerUnit: 0, range: "0-20" },
          { pricePerUnit: 0, range: "20-90" },
        ],
        slabs: [
          {
            pricePerUnit: 0,
            range: "0-100",
          },
          {
            pricePerUnit: 0,
            range: "101-200",
          },
          {
            pricePerUnit: 0,
            range: "201-300",
          },
          {
            pricePerUnit: 0,
            range: "301-400",
          },
          {
            pricePerUnit: 0,
            range: ">400",
          },
        ],
        validFrom: null,
        validTill: null,
        type: "Commercial",
      } as CommercialRate & { id: string };
    } else {
      commercialRate = { ...commercialRate.data(), id: commercialRate.id };
    }

    var industrialRate: IndustrialRate | FirebaseFirestore.DocumentData = (
      await industrialRateCollection.where("latest", "==", true).get()
    ).docs[0];

    if (!industrialRate) {
      industrialRate = {
        fixedChargeRate: 0,
        id: "Industrial No Rate",
        slabs: [
          {
            pricePerUnit: 0,
            range: "0-500",
          },
          {
            pricePerUnit: 0,
            range: ">500",
          },
        ],
        validFrom: null,
        validTill: null,
        type: "Industrial",
      } as IndustrialRate & { id: string };
    } else {
      industrialRate = { ...industrialRate.data(), id: industrialRate.id };
    }

    res.status(200).json({
      success: true,
      message: "Found current rates",
      rates: {
        domesticRate,
        commercialRate,
        industrialRate,
      },
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      message: "Error while getting current rates",
      error: err.message,
      success: false,
    });
  }
});

billingRouter.get("/bills", async (_req, res) => {
  try {
    const billsRef = await billingCollection.get();
    const bills: Array<{
      consumerDocId: string;
      consumerType: string;
      fullName: string;
      consumption: number;
      currentDate: string;
      totalCharge: number;
      billId: string;
      dueDate: string;
      paid: boolean;
    }> = [];

    await Promise.all(
      billsRef.docs.map(async (bill) => {
        const consumer = await consumerCollection
          .doc(bill.data().consumerDocId)
          .get();

        bills.push({
          billId: bill.id,
          consumerDocId: bill.data().consumerDocId,
          consumerType: consumer.data().consumerType,
          consumption: bill.data().consumption,
          currentDate: bill.data().currentDate,
          fullName: consumer.data().fullName,
          totalCharge: bill.data().totalCharge,
          dueDate: bill.data().dueDate,
          paid: bill.data().paid,
        });
      })
    );

    return res
      .status(200)
      .json({ message: "Bill found", success: true, bills: bills });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      message: "Internal error, failed to bills",
      error: err.message,
      success: false,
    });
  }
});

billingRouter.get("/bill/:billId", async (req, res) => {
  try {
    const billId = req.params.billId;
    const bill = await billingCollection.doc(billId).get();
    var rateDoc:
      | (DomesticRate & { rateDocId: string })
      | (CommercialRate & { rateDocId: string })
      | (IndustrialRate & { rateDocId: string }) = null;
    if (!bill.data()) {
      throw new Error(`Bill ${billId} not found!`);
    }

    switch (bill.data().consumerType as ConsumerType) {
      case "Domestic":
        rateDoc = {
          ...((
            await domesticRateCollection.doc(bill.data().rateDocId).get()
          ).data() as DomesticRate),
          rateDocId: bill.data().rateDocId,
        };
        break;
      case "Commercial":
        rateDoc = {
          ...((
            await commercialRateCollection.doc(bill.data().rateDocId).get()
          ).data() as CommercialRate),
          rateDocId: bill.data().rateDocId,
        };
        break;
      case "Industrial":
        rateDoc = {
          ...((
            await industrialRateCollection.doc(bill.data().rateDocId).get()
          ).data() as IndustrialRate),
          rateDocId: bill.data().rateDocId,
        };
        break;
    }
    const consumer = await consumerCollection
      .doc(bill.data().consumerDocId)
      .get();

    if (!consumer.data()) {
      throw new Error("Consumer not found!");
    }

    res.status(200).json({
      success: true,
      billData: {
        ...bill.data(),
        ...consumer.data(),
        rateDoc,
        billDocId: bill.id,
      },
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      message: `Internal error, failed to bill with bill id ${req.params.billId}`,
      error: err.message,
      success: false,
    });
  }
});
