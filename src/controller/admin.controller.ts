import { Router } from "express";
import {ConsumerFetchDetails, fetchConsumer} from "../services/admin.service";
import { User } from "../models";

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



