import { Router } from "express";
import {
  Billing,
  CommercialRate,
  Complaint,
  DomesticRate,
  IndustrialRate,
  User,
} from "../models";
import {
  billingCollection,
  complaintCollection,
  consumerCollection,
} from "../services/initDb";
import {
  ConsumerFetchDetails,
  fetchConsumer,
  updateConsumerDetails,
} from "../services/admin.service";
import { Breakage, ConsumerType } from "custom";
import {
  addCommercialRate,
  addDomesticRate,
  addIndustrialRate,
  calculateDomesticOrCommercialTotalCharge,
  calculateIndustrialTotalCharge,
  getRateDoc,
  updateCommercialRate,
  updateDomesticRate,
  updateIndustrialRate,
} from "../services/billing.service";

export const adminRouter = Router();

/**
 * This route will be used by the distribution company to
 * approve a consumer application
 *
 * Request body should contain following object
 * {
 *  consumerId: string
 *  sanctionedLoad: string
 * }
 */
adminRouter.post("/approveConsumer", async (req, res) => {
  try {
    const consumerId = req.body.consumerId;
    if (!consumerId) {
      throw new Error("ConsumerId cannot be null or undefined");
    }

    const consumer = (
      await consumerCollection.doc(consumerId).get()
    ).data() as User;
    if (!consumer) {
      throw new Error("Consumer not found, invalid consumerId");
    } else if (consumer.status == "Rejected") {
      throw new Error(
        `Consumer ${consumer.fullName} already rejected, cannot approve`
      );
    } else if (consumer.status == "Approved") {
      throw new Error(`Consumer ${consumer.fullName} already approved`);
    }
    const approvedConsumer = await consumerCollection.doc(consumerId).update({
      approved: true,
      status: "Approved",
      sanctionedLoad: Number(req.body.sanctionedLoad),
    } as User);

    approvedConsumer.writeTime
      ? res.status(200).json({
          success: true,
          message: `Approved Consumer ${consumer.fullName}`,
          approvedConsumerId: consumerId,
        })
      : res.status(500).json({
          success: false,
          message: "Error while approving consumer, please try again",
        });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      message: "Error while changing approval status (Acceptance)",
      error: err.message,
      success: false,
    });
  }
});

/**
 * This route will be used by the distribution company to
 * reject a consumer application
 *
 * Request body should contain following object
 * {
 *  consumerId: string,
 *  rejectionReason: string
 * }
 */
adminRouter.post("/rejectConsumer", async (req, res) => {
  try {
    const consumerId = req.body.consumerId;
    if (!consumerId) {
      throw new Error("ConsumerId cannot be null or undefined");
    }

    const consumer = (
      await consumerCollection.doc(consumerId).get()
    ).data() as User;
    console.log(consumer);
    if (!consumer) {
      throw new Error("Consumer not found, invalid consumerId");
    } else if (consumer.status == "Rejected") {
      throw new Error(`Consumer ${consumer.fullName} already rejected`);
    } else if (consumer.status == "Approved") {
      throw new Error(`Consumer ${consumer.fullName} already approved`);
    }

    const approvedConsumer = await consumerCollection.doc(consumerId).update({
      approved: false,
      status: "Rejected",
      rejectionReason: req.body.rejectionReason,
    } as User);

    approvedConsumer.writeTime
      ? res.status(200).json({
          success: true,
          message: `Rejected Consumer ${consumer.fullName}`,
          rejectedConsumerId: consumerId,
        })
      : res.status(500).json({
          success: false,
          message: "Error while rejecting consumer, please try again",
        });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      message: "Error while changing approval status (Rejection)",
      error: err.message,
      success: false,
    });
  }
});

/**
 * This route will be used to add slab rates
 *
 * The request object will contain the following object
 * {
 *  rateType: "Domestic" | "Commercial" | "Industrial",
 *  slabs: Array<ECSlab | IndustrialSlab>,
 *  fixedChargeRate: number | Array<CommercialFCSlab>
 * }
 */
adminRouter.post("/createRate", async (req, res) => {
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

adminRouter.post("/updateRate", async (req, res) => {
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

interface BillResponse extends Billing {
  rateDocument: DomesticRate | IndustrialRate | CommercialRate;
}

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
adminRouter.post("/createBill", async (req, res) => {
  try {
    const bills: Array<Billing> = [];
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
        }) => {
          const consumer = (
            await consumerCollection.doc(reading.consumerId).get()
          ).data() as User;

          if (!consumer) {
            throw new Error("Invalid consumer Id, consumer not found!");
          }

          const previousBillDoc = (
            await billingCollection
              .where("consumerId", "==", reading.consumerId)
              .where("latest", "==", true)
              .get()
          ).docs[0];

          const previousBill = previousBillDoc
            ? (previousBillDoc.data() as Billing)
            : null;
          const rateDoc = await getRateDoc(consumer.consumerType);

          if (previousBill) {
            await billingCollection
              .doc(previousBillDoc.id)
              .update({ latest: false });
          }

          var calculatedTotalCharge: {
            totalCharge: number;
            breakage: Array<Breakage>;
            fixedCharge: { amount: number; calculation: string };
          } = null;

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

          const bill: Billing = {
            paid: false,
            latest: true,
            consumerDocId: reading.consumerId,
            sanctionedLoad: consumer.sanctionedLoad,
            consumption:
              reading.currentReading -
              (previousBill ? previousBill.currentReading : 0),
            currentDate: new Date(reading.dateOfReading),
            currentReading: reading.currentReading,
            meterNumber: consumer.meterNumber,
            paymentDate: null,
            rateDocId: rateDoc.id,
            fixedCharge: calculatedTotalCharge.fixedCharge,
            meterRent: consumer.phase == 1 ? 15 : 25,
            previousReading: previousBill ? previousBill.currentReading : 0,
            totalCharge: calculatedTotalCharge.totalCharge,
            breakage: calculatedTotalCharge.breakage,
            consumerType: consumer.consumerType,
            // rateDocument: rateDoc.data() as
            //   | DomesticRate
            //   | CommercialRate
            //   | IndustrialRate,
          };

          await billingCollection.add(bill);
          bills.push(bill);
        }
      )
    );

    res
      .status(200)
      .json({ addedBills: bills, success: true, createdBills: bills.length });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      message: "Failed to create bills",
      error: err.message,
      success: false,
    });
  }
});

adminRouter.post("/updateAndRegenBill", async (req, res) => {
  try {
    res.send("TODO: Update and regenerate Bill");
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
 * This route fetches all the consumer applications
 * to be listed on the distributor's admin dashboard
 */
adminRouter.get("/fetchConsumers", async (_req, res) => {
  try {
    const fetchedConsumers: Array<ConsumerFetchDetails> = await fetchConsumer();

    fetchedConsumers
      ? res.status(200).json({
          success: true,
          message: "fetched consumer successfully",
          fetchedConsumerIds: fetchedConsumers,
        })
      : res
          .status(500)
          .json({ success: false, message: "consumer fetching failed" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: "internal server error" });
  }
});

/**Request param should contain
 * {
    "consumerId": string,
    "meterNumber": Number,
    "phoneNumber":Number,
    "subsidyRate":Number}
 * 
    This route will be used to update the details of consumer(meternumber,phoneNumber,subsidyRate)
*/
adminRouter.put("/updateConsumers", async (req, res) => {
  try {
    console.log(req.body);
    const updatedConsumers = await updateConsumerDetails(
      req.body.consumerId,
      req.body.meterNumber,
      req.body.phoneNumber,
      req.body.subsidyRate
    );

    updatedConsumers
      ? res.status(200).json({
          success: true,
          message: "Updated consumer successfully",
        })
      : res
          .status(500)
          .json({ success: false, message: "consumer Updation failed" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: "internal server error" });
  }
});

/**
 * This route will be used to get all the details
 * of a particular consumer application
 *
 * Request param should contain consumerId
 */
adminRouter.get("/consumerApplicationDetails/:consumerId", async (req, res) => {
  try {
    const consumerId: string = req.params.consumerId;
    const consumerApplication = (
      await consumerCollection.doc(consumerId).get()
    ).data() as User;

    consumerApplication
      ? res.status(200).json({
          success: true,
          message: "Consumer application found",
          consumerApplication: consumerApplication,
        })
      : res.status(500).json({
          success: false,
          message: `Failed to get application details of consumer ${consumerId}`,
        });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      message: "Failed to get consumer application details",
      error: err,
      success: false,
    });
  }
});

adminRouter.put("/updateComplaintStatus", async (req, res) => {
  try {
    const consumerId = req.body.consumerDocId;
    if (!consumerId) {
      throw new Error("ConsumerId cannot be null or undefined");
    }

    const complaint = (
      await complaintCollection.where("consumerDocId", "==", consumerId).get()
    ).docs[0];
    if (!complaint.id) {
      throw new Error("complaint not found");
    } else if (complaint.data().status == "Rejected") {
      throw new Error(`compliant already rejected, cannot Resolve`);
    } else if (complaint.data().status == "Resolved") {
      throw new Error(`Complaint already Resolved`);
    }
    const resolvedComplaintConsumer = await complaintCollection
      .doc(complaint.id)
      .update({ status: req.body.status } as Complaint);

    resolvedComplaintConsumer.writeTime
      ? res.status(200).json({
          success: true,
          message: `${req.body.status} Consumer complaint`,
        })
      : res.status(500).json({
          success: false,
          message:
            "Error while changing consumer complaint status , please try again",
        });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      message: "Error while changing  status (Acceptance)",
      error: err.message,
      success: false,
    });
  }
});
