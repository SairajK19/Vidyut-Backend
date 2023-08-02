import express, { Request, Response } from "express";
import cors from "cors";
import * as bodyParser from "body-parser";
import * as http from "http";
import { FirestoreStore } from "@google-cloud/connect-firestore";
import session from "express-session";
import { db } from "./services/initDb";
import { auth, verifyAdmin } from "./middleware/auth";
import { adminRouter } from "./controller/admin.controller";
import { consumerRouter } from "./controller/consumer.controller";
import { authRouter } from "./controller/auth.controller";

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

server.listen(port, async () => {
    app.use("/api/admin", verifyAdmin, adminRouter);
    app.use("/api/user", consumerRouter);
    app.use("/api/auth", auth, authRouter);

    app.get("/", (_req: Request, res: Response) => {
        res.send("I am alive, connected successfully");
    });

    console.log(`Started server on port ${port}`);
});