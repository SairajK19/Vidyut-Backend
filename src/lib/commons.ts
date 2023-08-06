import * as nodemailer from "nodemailer";

export const AdminCollectionName = "Admin";
export const ConsumerCollectionName = "Consumer";
export const BillingCollectionName = "Billings";
export const DomesticRateCollectionName = "DomesticRates";
export const IndustrialRateCollectionName = "IndustrialRates";
export const CommercialRateCollectionName = "CommercialRates";
export const ComplaintCollectionName = "ComplaintCollection";

export const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: "noreply.ebsos@gmail.com",
    pass: "ffzmtedfygbwbfst",
  },
});
