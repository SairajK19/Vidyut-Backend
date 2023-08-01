import { Router } from "express";

export const consumerRouter = Router();

consumerRouter.get("/", (req, res) => {
    res.send("Consumer Working")
})