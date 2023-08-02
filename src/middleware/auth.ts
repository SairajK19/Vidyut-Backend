import { Request, Response, NextFunction } from "express";
import { adminCollection } from "../services/initDb";
import { AdminCollectionName } from "../lib/commons";
import { Admin } from "../models";

export const auth = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const adminDoc = (await adminCollection.where('userName', "==", req.body.userName).get()).docs[0].data();
        if (adminDoc.password === req.body.password) {
            req.session.userData = {
                loggedIn: true,
                userDocId: null,
            };

            next();
        } else {
            throw Error("Invalid user credentials")
        }
    } catch (error) {
        console.log(error);
        return res.status(400).json({ message: "Error while loggin in user" });
    }
};

export const verifyAdmin = (req: Request, res: Response, next: NextFunction) => {
    try {
        if (req.session.userData?.loggedIn) {
            next()
        } else {
            throw new Error("User session expired, please login again")
        }
    } catch (error) {
        console.log(error)
        return res.status(400).json({ message: "Error while verifying admin" });
    }
}