import * as admin from "firebase-admin";
import { AdminCollectionName, BillingCollectionName, CommercialRateCollectionName, ComplaintCollectionName, DomesticRateCollectionName, IndustrialRateCollectionName, ConsumerCollectionName } from "../lib/commons";
import { User } from "../models";
const credentials = require("../../credentials.json");

admin.initializeApp({
    credential: admin.credential.cert(credentials)
});

export const db = admin.firestore();
export const adminCollection = db.collection(AdminCollectionName);
export const consumerCollection = db.collection(ConsumerCollectionName);
export const billingCollection = db.collection(BillingCollectionName);
export const domesticRateCollection = db.collection(DomesticRateCollectionName);
export const industrialRateCollection = db.collection(IndustrialRateCollectionName);
export const commercialRateCollection = db.collection(CommercialRateCollectionName);
export const complaintCollection = db.collection(ComplaintCollectionName);
