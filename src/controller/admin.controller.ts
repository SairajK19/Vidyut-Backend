import { Router } from "express";
import { ConsumerFetchDetails, fetchConsumer } from "../services/admin.service";
import { User } from "../models";
import { Complaint } from "../models";
import { complaintCollection, consumerCollection } from "../services/initDb";
import { ConsumerCollectionName } from "../lib/commons";
import { ConsumerType } from "custom";
import {
  addCommercialRate,
  addDomesticRate,
  addIndustrialRate,
} from "../services/billing.service";

export const adminRouter = Router();

/**
 * This route will be used by the distribution company to
 * approve a consumer application
 *
 * Request body should contain following object
 * {
 *  consumerId: string
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
    const approvedConsumer = await consumerCollection
      .doc(consumerId)
      .update({ approved: true, status: "Approved" } as User);

    approvedConsumer.writeTime
      ? res
          .status(200)
          .json({
            success: true,
            message: `Approved Consumer ${consumer.fullName}`,
            approvedConsumerId: consumerId,
          })
      : res
          .status(500)
          .json({
            success: false,
            message: "Error while approving consumer, please try again",
          });
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({
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

    const approvedConsumer = await consumerCollection
      .doc(consumerId)
      .update({
        approved: false,
        status: "Rejected",
        rejectionReason: req.body.rejectionReason,
      } as User);

    approvedConsumer.writeTime
      ? res
          .status(200)
          .json({
            success: true,
            message: `Rejected Consumer ${consumer.fullName}`,
            rejectedConsumerId: consumerId,
          })
      : res
          .status(500)
          .json({
            success: false,
            message: "Error while rejecting consumer, please try again",
          });
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({
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
        addedRate = addDomesticRate(req.body);
        break;
      case "Commercial":
        addedRate = addCommercialRate(req.body);
        break;
      case "Industrial":
        addedRate = addIndustrialRate(req.body);
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

adminRouter.post("/createBill", async (req, res) => {
  try {
    res.send("TODO: Create Bills");
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
      ? res
          .status(200)
          .json({ success: true, message: `Resolved Consumer complaint ` })
      : res
          .status(500)
          .json({
            success: false,
            message:
              "Error while Resolving consumer complaint , please try again",
          });
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({
        message: "Error while changing  status (Acceptance)",
        error: err.message,
        success: false,
      });
  }
});
