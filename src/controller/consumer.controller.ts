import { Router, response } from "express";
import { User } from "../models";
import { createConsumer, getCurrentUserCount, userAlreadyExist } from "../services/consumer.service";
import { log } from "firebase-functions/logger";

export const consumerRouter = Router();

consumerRouter.post("/createConsumer", async(req, res) => {
    try {
        if (userAlreadyExist(req.body.fullName,Number(req.body.phoneNumber))){
            return res.status(403).json({success:false,message:"user already exists"});
        }
        const user: User = {
            fullName: req.body.fullName,
            phoneNumber: Number(req.body.phoneNumber),
            address: req.body.address,
            meterNumber: await getCurrentUserCount(),
            sanctionedLoad: Number(req.body.sanctionedLoad),
            consumerType: req.body.consumerType,
            subsidyRate: 0,
            phase: req.body.phase,
            approved: false,
            supportingDocs: req.body.supportingDocs
        };

        const createdConsumer:string = await createConsumer(user)
        createdConsumer ? res.status(200).json({ success: true, message: "created consumer successfully", addedConsumerId: createdConsumer })
            : res.status(500).json({ success: false, message: "consumer creation failed" })

    } catch (err){
        console.log(err)
        res.status(500).json({success:false,message:"internal server error"})
    }
    
})