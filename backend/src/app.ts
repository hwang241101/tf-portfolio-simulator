import express from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("ETF Simulator API");
});

// Avoid loading prisma until DATABASE_URL exists (otherwise process exits on import).
if (process.env.DATABASE_URL) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const transactionRoutes = require("./routes/transaction.route").default;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const portfolioRoutes = require("./routes/portfolio.route").default;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const assetRoutes = require("./routes/asset.route").default;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const allocationRoutes = require("./routes/allocation.route").default;

  app.use("/transactions", transactionRoutes);
  app.use("/portfolios", portfolioRoutes);
  app.use("/assets", assetRoutes);
  app.use("/allocations", allocationRoutes);
} else {
  console.warn(
    "DATABASE_URL unset — only GET /. Set DATABASE_URL for full API.",
  );
}

const port = Number(process.env.PORT) || 4000;
app.listen(port, "0.0.0.0", () => {
  console.log(`Server running on port ${port}`);
});
