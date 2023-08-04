import { Request, Response, NextFunction } from "express";
import { adminCollection } from "../services/initDb";
import { AdminCollectionName } from "../lib/commons";
import { Admin } from "../models";

export const verifyAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (req.session.userData?.loggedIn) {
      next();
    } else {
      throw new Error("User session expired, please login again");
    }
  } catch (error) {
    console.log(error);
    return res.status(400).json({ message: "Error while verifying admin" });
  }
};
