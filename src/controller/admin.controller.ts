import { Router } from "express";
import {ConsumerFetchDetails, fetchConsumer} from "../services/admin.service";
import { User } from "../models";
import { consumerCollection } from "../services/initDb";

export const adminRouter = Router();

adminRouter.get("/fetchConsumers", async (req, res) => {
    try {
        const fetchedConsumers: Array<ConsumerFetchDetails> = await fetchConsumer();
        fetchedConsumers ? res.status(200).json({ success: true, message: "fetched consumer successfully", fetchedConsumerIds: fetchedConsumers })
            : res.status(500).json({ success: false, message: "consumer fetching failed" })

    } catch (err){
        console.log(err)
        res.status(500).json({success:false,message:"internal server error"})
    }

})

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
