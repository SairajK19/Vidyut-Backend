import { adminRouter } from "./controller/admin.controller";
import { authRouter } from "./controller/auth.controller";
import { consumerRouter } from "./controller/consumer.controller";

const express = require("express");
const app = express();

app.listen(8080, () => {
    console.log("Started server on http://localhost:8080");

    app.use("/auth", authRouter)
    app.use("/admin", adminRouter)
    app.use("/consumer", consumerRouter);

    app.get("/", (req, res) => res.send("Working"))
})