import express from "express";
import cors from "cors";
import transactionRoutes from "./routes/transaction.route";
import portfolioRoutes from "./routes/portfolio.route";
import assetRoutes from "./routes/asset.route";
import allocationRoutes from "./routes/allocation.route";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("ETF Simulator API");
});

app.use("/transactions", transactionRoutes);
app.use("/portfolios", portfolioRoutes);
app.use("/assets", assetRoutes);
app.use("/allocations", allocationRoutes);

app.listen(4000, () => {
  console.log("Server running on port 4000");
});
