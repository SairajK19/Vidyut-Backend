import * as admin from "firebase-admin";
import { AdminCollectionName, BillingCollectionName, CommercialRateCollectionName, ComplaintCollectionName, DomesticRateCollectionName, IndustrialRateCollectionName, UserCollectionName } from "../lib/commons";
const credentials = require("../../credentials.json");

admin.initializeApp({
    credential: admin.credential.cert(credentials)
});

export const db = admin.firestore();
export const adminCollection = db.collection(AdminCollectionName);
export const userCollection = db.collection(UserCollectionName);
export const billingCollection = db.collection(BillingCollectionName);
export const domesticRateCollection = db.collection(DomesticRateCollectionName);
export const industrialRateCollection = db.collection(IndustrialRateCollectionName);
export const commercialCollection = db.collection(CommercialRateCollectionName);
export const complaintCollection = db.collection(ComplaintCollectionName);
