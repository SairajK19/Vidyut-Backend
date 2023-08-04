import { Router } from "express";
import { adminCollection } from "../services/initDb";

export const authRouter = Router();

authRouter.post("/login", async (req, res) => {
  try {
    const adminDoc = (
      await adminCollection.where("userName", "==", req.body.userName).get()
    ).docs[0].data();

    if (adminDoc.password === req.body.password) {
      req.session.userData = {
        loggedIn: true,
        userDocId: null,
      };

      res.json({
        success: true,
        message: `Logged in successfully as ${req.body.userName}`,
      });
    } else {
      throw new Error("Invalid user credentials");
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: "Error while logging in user",
      error: err.message,
    });
  }
});

authRouter.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.status(200).json({ success: true, message: `Logged out successfully` });
  });
});
