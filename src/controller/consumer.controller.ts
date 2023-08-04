import { Router, response } from "express";
import { Billing, User } from "../models";
import {
  createComplaint,
  createConsumer,
  getCurrentUserCount,
  userAlreadyExist,
} from "../services/consumer.service";
import { Complaint } from "../models";
import { billingCollection, consumerCollection } from "../services/initDb";

export const consumerRouter = Router();

/**
 * {
 *  email: string,
 *  phoneNumber: number,
 *  fullName: string,
 *  address: string,
 *  consumerType: "Domestic" | "Commercial" | "Industrial",
 *  phase: 1 | 3,
 *  supportingDocs: Array<string>
 * }
*/
consumerRouter.post("/createConsumer", async (req, res) => {
  try {
    if (
      (await userAlreadyExist(req.body.email, Number(req.body.phoneNumber))) ==
      true
    ) {
      return res
        .status(403)
        .json({ success: false, message: "user already exists" });
    }

    const user: User = {
      fullName: req.body.fullName,
      phoneNumber: Number(req.body.phoneNumber),
      address: req.body.address,
      email: req.body.email,
      meterNumber: await getCurrentUserCount(),
      sanctionedLoad: 0,
      consumerType: req.body.consumerType,
      subsidyRate: 0,
      phase: req.body.phase,
      approved: false,
      supportingDocs: req.body.supportingDocs,
      status: "Pending",
      rejectionReason: null,
    };

    const createdConsumer: string = await createConsumer(user);
    createdConsumer
      ? res.status(200).json({
          success: true,
          message: "created consumer successfully",
          addedConsumerId: createdConsumer,
        })
      : res
          .status(500)
          .json({ success: false, message: "consumer creation failed" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: "internal server error" });
  }
});

/**
 * {
 *  consumerDocId: string
 * }
 */
consumerRouter.post("/createComplaint", async (req, res) => {
  try {
    if (
      (await consumerCollection.doc(req.body.consumerDocId).get()).data() ==
      null
    ) {
      return res
        .status(403)
        .json({ success: false, message: "comsumer doesnt exists" });
    }

    const complaint: Complaint = {
      description: req.body.description,
      status: "Pending",
      billDocId: req.body.billDocId,
      consumerDocId: req.body.consumerDocId,
    };

    const createdComplaint: string = await createComplaint(complaint);
    createdComplaint
      ? res.status(200).json({
          success: true,
          message: "created complaint successfully",
          complaintId: createComplaint,
        })
      : res.status(500).json({
          success: false,
          message: "consumer complaint creation failed",
        });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: "internal server error" });
  }
});

consumerRouter.get("/consumerBillDetails/:consumerDocId", async (req, res) => {
  try {
    const consumerId: string = req.params.consumerDocId;
    const consumerBill = (
      await billingCollection.doc(consumerId).get()
    ).data() as Billing;

    consumerBill
      ? res.status(200).json({
          success: true,
          message: "Consumer bill found",
          consumerBill: consumerBill,
        })
      : res.status(500).json({
          success: false,
          message: `Failed to get bill details of consumer ${consumerId}`,
        });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      message: "internal error, failed to get consumer bill details",
      error: err,
      success: false,
    });
  }
});
