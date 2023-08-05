import { Router } from "express";
import { Complaint, User } from "../models";
import { complaintCollection, consumerCollection } from "../services/initDb";
import {
  fetchComplaints,
  fetchConsumer,
  updateConsumerDetails,
} from "../services/admin.service";
import { ConsumerFetchDetails } from "custom";

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
          fetchedConsumers: fetchedConsumers,
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
 *  "consumerId": string,
 *  "meterNumber": Number,
 *  "phoneNumber":Number,
 *  "subsidyRate":Number
 * }
 *
 * This route will be used to update the details of consumer (meternumber, phoneNumber, subsidyRate)
 */
adminRouter.put("/updateConsumers", async (req, res) => {
  try {
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
          .json({ success: false, message: "Consumer updation failed" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: "Internal server error" });
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

/**
 * This route fetches all the consumer applications
 * to be listed on the distributor's admin dashboard
 */
adminRouter.get("/fetchComplaints", async (_req, res) => {
  try {
    const fetchedComplaints: Array<Complaint> = await fetchComplaints();

    fetchedComplaints
      ? res.status(200).json({
          success: true,
          message: "fetched complaints successfully",
          fetchComplaints: fetchedComplaints,
        })
      : res
          .status(500)
          .json({ success: false, message: "complaint fetching failed" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: "internal server error" });
  }
});

adminRouter.put("/updateComplaintStatus", async (req, res) => {
  try {
    const complaintId = req.body.complaintId;

    const complaint = await complaintCollection.doc(complaintId).get();
    if (!complaint.id) {
      throw new Error("complaint not found");
    } else if (complaint.data().status == "Rejected") {
      throw new Error(`compliant already rejected, cannot Resolve`);
    } else if (complaint.data().status == "Resolved") {
      throw new Error(`Complaint already Resolved`);
    }
    const changedComplaintStatus = await complaintCollection
      .doc(complaint.id)
      .update({ status: req.body.status } as Complaint);

    changedComplaintStatus.writeTime
      ? res.status(200).json({
          success: true,
          message: `Changed consumer complaint status to ${req.body.status}`,
        })
      : res.status(500).json({
          success: false,
          message:
            "Error while changing consumer complaint status , please try again",
        });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      message: "Error while changing status",
      error: err.message,
      success: false,
    });
  }
});
