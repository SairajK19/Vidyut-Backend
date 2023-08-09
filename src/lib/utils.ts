import HTMLToPDF from "convert-html-to-pdf";
import ejs from "ejs";
import path from "path";
import { User } from "../models";
import { Billing } from "../models";
import { transporter } from "./commons";
import { logger } from "../services/initDb";

export const enum DomesticRangeRates {
  ZeroToHundred = "0-100",
  HundredOneToTwoHundred = "101-200",
  TwoHundredOneToThreeHundred = "201-300",
  ThreeHundredOneToFourHundred = "301-400",
  AboveFourHundred = ">400",
}

export const enum CommercialRangeRate {
  ZeroToHundred = "0-100",
  HundredOneToTwoHundred = "101-200",
  TwoHundredOneToThreeHundred = "201-300",
  ThreeHundredOneToFourHundred = "301-400",
  AboveFourHundred = ">400",
}

export const enum IndustrialRangeRate {
  ZeroToFiveHundred = "0-500",
  AboveFiveHundred = ">500",
}

export const createPDFAndMail = (
  bill: Billing & { subsidyDiscount: number },
  consumer: User,
  billId: string,
  updateBill: boolean,
  overDue: boolean
) => {
  // console.log(path.join(__dirname, "views/pages/bill.ejs"));
  console.log(
    overDue,
    "OVERDUE",
    `views/pages/${
      overDue ? "overdue.ejs" : updateBill ? "bill_update_mail.ejs" : "mail.ejs"
    }`
  );
  ejs.renderFile(
    path.join(__dirname, "views/pages/bill.ejs"),
    { bill: bill, consumerData: consumer, billId: billId },
    async (err, billData) => {
      ejs.renderFile(
        path.join(
          __dirname,
          `views/pages/${
            overDue
              ? "overdue.ejs"
              : updateBill
              ? "bill_update_mail.ejs"
              : "mail.ejs"
          }`
        ),
        { bill: bill, consumerData: consumer, billId },
        async (err, mail) => {
          const htmlToPdf = new HTMLToPDF(billData);
          const billPdf = await htmlToPdf.convert();

          var mainOptions = {
            from: '"EBS" noreply.ebsos@gmail.com',
            to: consumer.email,
            subject: "Vidyut: Electricity Bill",
            html: mail,
            attachments: [
              {
                filename: "bill.pdf",
                content: billPdf,
              },
            ],
          };

          if (err) {
            console.log(err, "ERR");
          }

          transporter.sendMail(mainOptions, function (err, info) {
            if (err) {
              console.log(err);
            } else {
              console.log("Message sent: " + info.response);
              logger.info(
                `Mail sent to ${consumer.email} due to ${
                  overDue
                    ? "bill overdue"
                    : updateBill
                    ? "bill update after complaint"
                    : "new bill"
                }`
              );
            }
          });
        }
      );
    }
  );
};
