import { Router } from "express";

export const authRouter = Router();

authRouter.post("/login", (req, res) => {
    res.send(`Logged In as ${req.body.userName}`)
})