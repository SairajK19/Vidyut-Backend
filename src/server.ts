import express, { Request, Response } from "express";
import cors from "cors";
import * as bodyParser from "body-parser";
import * as http from "http";
import { FirestoreStore } from "@google-cloud/connect-firestore";
import session from "express-session";
import { db } from "./services/initDb";
import { verifyAdmin } from "./middleware/auth";
import { adminRouter } from "./controller/admin.controller";
import { consumerRouter } from "./controller/consumer.controller";
import { authRouter } from "./controller/auth.controller";
import { billingRouter } from "./controller/billing.controller";
import path from "path";
import { CronJob } from "cron";
import { sendMailIfBillOverDue } from "./services/billing.service";

const port = 8080;
const app = express();
var server = http.createServer(app);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["POST", "PUT", "GET", "OPTIONS", "HEAD"],
    credentials: true,
  })
);
app.use(
  session({
    store: new FirestoreStore({
      dataset: db,
      kind: "Sessions",
    }),
    secret: "oneshield",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24, httpOnly: true },
  })
);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(__dirname + "/public"));

server.listen(port, async () => {
  app.use("/api/admin", verifyAdmin, adminRouter);
  app.use("/api/billing", verifyAdmin, billingRouter);
  app.use("/api/consumer", consumerRouter);
  app.use("/api/auth", authRouter);

  app.get("/", (_req: Request, res: Response) => {
    res.send("I am alive, connected successfully");
  });

  // * * * * * *
  // Seconds, Minutes, Hours, Day of month, Months, Day of weeks
  var job = new CronJob('* */60 * * * *', function() {
    console.log("Sending Message");
    sendMailIfBillOverDue();
  }, null, true, "Asia/Kolkata")
  console.log(`Started server on port ${port}`);
});
