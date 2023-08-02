import { Router } from "express";

export const authRouter = Router();

authRouter.post("/login", (req, res) => {
    res.send("Auth Working")
})