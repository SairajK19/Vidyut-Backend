import { Router, response } from "express";
import { Billing, OTP, User } from "../models";
import {
  createComplaint,
  createConsumer,
  getCurrentUserCount,
  userAlreadyExist,
} from "../services/consumer.service";
import { Complaint } from "../models";
import {
  billingCollection,
  consumerCollection,
  otpCollection,
} from "../services/initDb";
import ejs from "ejs";
import path from "path";
import { transporter } from "../lib/commons";

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

consumerRouter.get("/otp/:consumerId", async (req, res) => {
  try {
    const consumerId = req.params.consumerId;
    const otp = Math.floor(1000 + Math.random() * 9000);
    const consumer = await consumerCollection.doc(consumerId).get();

    if (!consumer.data()) {
      return res
        .status(404)
        .json({ message: "Consumer not found", success: false });
    }
    ejs.renderFile(
      path.join(__dirname, "../lib/views/pages/otp.ejs"),
      { consumerData: { ...consumer.data(), otp: otp } },
      async (err: any, mail: any) => {
        var mainOptions = {
          from: '"EBS" noreply.ebsos@gmail.com',
          to: consumer.data().email,
          subject: "Vidyut: Complaint OTP",
          html: mail,
        };

        if (err) {
          throw new Error("Error while sending mail");
        }

        transporter.sendMail(
          mainOptions,
          function (err: any, info: { response: string }) {
            if (err) {
              console.log(err);
            } else {
              console.log(
                `Message sent to ${consumer.data().email}: ` + info.response
              );
            }
          }
        );
      }
    );

    await otpCollection.add({ consumerId: consumer.id, otp } as OTP);
    // res.render("otp.ejs", { consumerData: { ...consumer.data(), otp: otp } });
    return res
      .status(200)
      .json({ success: true, message: `OTP sent to ${consumer.data().email}` });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      message: "internal error, failed to get consumer bill details",
      error: err,
      success: false,
    });
  }
});

/**
 * {
 *  consumerId: string,
 *  otp: number
 * }
 */
consumerRouter.post("/verify-otp", async (req, res) => {
  try {
    const consumerId = req.body.consumerId;
    const otp = (
      await otpCollection.where("consumerId", "==", consumerId).get()
    ).docs[0];

    if (otp.data().otp == Number(req.body.otp)) {
      await otpCollection.doc(otp.id).delete();
      return res
        .status(200)
        .json({ message: "OTP Verified successfully", success: true });
    } else {
      return res.status(401).json({
        success: false,
        message: "OTP Verification failed, invalid OTP",
      });
    }
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      message: "Internal error, failed to verify otp",
      error: err,
      success: false,
    });
  }
});

consumerRouter.get("/render-bill/:billId", async (req, res) => {
  try {
    const bill = await billingCollection.doc(req.params.billId).get();
    if (!bill.data()) {
      return res.status(404).redirect("http://localhost:3000/404");
    }

    const consumer = await consumerCollection
      .doc(bill.data().consumerDocId)
      .get();
    if (!consumer.data()) {
      return res.status(404).send("404 Bill not found");
    }

    res.render("../lib/views/pages/bill.ejs", {
      bill: bill.data(),
      consumerData: consumer.data(),
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      message: `Internal error, failed to render bill with bill id ${req.params.billId}`,
      error: err.message,
      success: false,
    });
  }
});
