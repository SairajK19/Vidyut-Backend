import { Router } from "express";
import { consumerCollection } from "../services/initDb";

export const adminRouter = Router();

adminRouter.get("/consumerApplicationDetails/:consumerId", async (req, res) => {
    try {
        const consumerId: string = req.params.consumerId;
        const consumerApplication = (await consumerCollection.doc(consumerId).get()).data()

        consumerApplication
            ? res.status(200).json({ success: true, message: "Consumer application found", consumerApplication: consumerApplication })
            : res.status(500).json({ success: false, message: `Failed to get application details of consumer ${consumerId}` })
    } catch (err) {
        console.log(err);
        return res.status(500).json({
            message: "Failed to get consumer application details",
            error: err,
            success: false
        })
    }
})