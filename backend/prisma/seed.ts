import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const adapter = new PrismaMariaDb(connectionString);
const prisma = new PrismaClient({ adapter });

async function main() {
  const user = await prisma.user.upsert({
    where: { email: "demo@etf.local" },
    update: {},
    create: { email: "demo@etf.local" },
  });

  const portfolios = await Promise.all([
    prisma.portfolio.upsert({
      where: { id: BigInt(1) },
      update: {},
      create: {
        userId: user.id,
        name: "Demo Portfolio 1",
        baseCurrency: "JPY",
      },
    }),
    prisma.portfolio.upsert({
      where: { id: BigInt(2) },
      update: {},
      create: {
        userId: user.id,
        name: "Demo Portfolio 2",
        baseCurrency: "JPY",
      },
    }),
    prisma.portfolio.upsert({
      where: { id: BigInt(3) },
      update: {},
      create: {
        userId: user.id,
        name: "Demo Portfolio 3",
        baseCurrency: "JPY",
      },
    }),
    prisma.portfolio.upsert({
      where: { id: BigInt(4) },
      update: {},
      create: {
        userId: user.id,
        name: "Demo Portfolio 4",
        baseCurrency: "JPY",
      },
    }),
  ]);

  await prisma.asset.createMany({
    data: [
      { name: "Vanguard S&P 500 ETF", ticker: "VOO" },
      { name: "Vanguard Total World Stock ETF", ticker: "VT" },
      { name: "Vanguard Total Bond Market ETF", ticker: "BND" },
      { name: "SPDR S&P 500 ETF Trust", ticker: "SPY" },
      { name: "Invesco QQQ Trust", ticker: "QQQ" },
      { name: "Vanguard Total Stock Market ETF", ticker: "VTI" },
      { name: "iShares Core S&P 500 ETF", ticker: "IVV" },
      { name: "Schwab U.S. Broad Market ETF", ticker: "SCHB" },
      { name: "SPDR Portfolio S&P 500 ETF", ticker: "SPLG" },
      { name: "iShares Russell 1000 ETF", ticker: "IWB" },
      { name: "iShares Core MSCI EAFE ETF", ticker: "IEFA" },
      { name: "Vanguard FTSE Developed Markets ETF", ticker: "VEA" },
      { name: "iShares MSCI ACWI ETF", ticker: "ACWI" },
      { name: "Vanguard FTSE Emerging Markets ETF", ticker: "VWO" },
      { name: "iShares Core MSCI Emerging Markets ETF", ticker: "IEMG" },
      { name: "SPDR Portfolio Emerging Markets ETF", ticker: "SPEM" },
      { name: "Vanguard Real Estate ETF", ticker: "VNQ" },
      { name: "Schwab U.S. REIT ETF", ticker: "SCHH" },
      { name: "Utilities Select Sector SPDR Fund", ticker: "XLU" },
      { name: "Financial Select Sector SPDR Fund", ticker: "XLF" },
      { name: "Technology Select Sector SPDR Fund", ticker: "XLK" },
      { name: "Consumer Staples Select Sector SPDR Fund", ticker: "XLP" },
      { name: "Health Care Select Sector SPDR Fund", ticker: "XLV" },
      { name: "Energy Select Sector SPDR Fund", ticker: "XLE" },
      { name: "iShares Core U.S. Aggregate Bond ETF", ticker: "AGG" },
      { name: "iShares 20+ Year Treasury Bond ETF", ticker: "TLT" },
      { name: "Vanguard Intermediate-Term Treasury ETF", ticker: "VGIT" },
      { name: "SPDR Portfolio Long Term Treasury ETF", ticker: "SPTL" },
      { name: "iShares iBoxx $ Investment Grade Corporate Bond ETF", ticker: "LQD" },
      { name: "SPDR Bloomberg 1-3 Month T-Bill ETF", ticker: "BIL" },
      { name: "iShares 0-3 Month Treasury Bond ETF", ticker: "SGOV" },
      { name: "Vanguard Dividend Appreciation ETF", ticker: "VIG" },
      { name: "Schwab U.S. Dividend Equity ETF", ticker: "SCHD" },
      { name: "iShares Core Dividend Growth ETF", ticker: "DGRO" },
      { name: "iShares Gold Trust", ticker: "IAU" },
    ],
    skipDuplicates: true,
  });

  const demoPortfolioId = portfolios[0].id;
  const existingTxCount = await prisma.transaction.count({
    where: { portfolioId: demoPortfolioId },
  });

  if (existingTxCount === 0) {
    const assetList = await prisma.asset.findMany({
      select: { id: true, ticker: true },
      orderBy: { id: "asc" },
    });
    const pickTickers = [
      "VOO",
      "VT",
      "BND",
      "QQQ",
      "VTI",
      "SCHD",
      "XLF",
      "XLK",
      "AGG",
      "TLT",
    ];
    const pickAssets = assetList.filter((asset) =>
      pickTickers.includes(asset.ticker),
    );

    const txRows: Array<{
      portfolioId: bigint;
      assetId: bigint;
      type: string;
      quantity: number;
      price: number;
      fee: number;
      transactionDate: Date;
    }> = [];

    const now = new Date();
    for (let i = 0; i < 52; i += 1) {
      const txDate = new Date(now);
      txDate.setDate(txDate.getDate() - (51 - i) * 7);

      const asset = pickAssets[Math.floor(Math.random() * pickAssets.length)];
      if (!asset) continue;

      const quantity = Number((5 + Math.random() * 25).toFixed(4));
      const price = Number((80 + Math.random() * 620).toFixed(4));
      const fee = Number((Math.random() * 2).toFixed(4));

      txRows.push({
        portfolioId: demoPortfolioId,
        assetId: asset.id,
        type: "BUY",
        quantity,
        price,
        fee,
        transactionDate: txDate,
      });
    }

    if (txRows.length > 0) {
      await prisma.transaction.createMany({ data: txRows });
      console.log(`Seed transactions added: ${txRows.length} rows`);
    }
  }

  const bulkPortfolioId = portfolios[3].id;
  const bulkTxCount = await prisma.transaction.count({
    where: { portfolioId: bulkPortfolioId },
  });

  if (bulkTxCount === 0) {
    const assetList = await prisma.asset.findMany({
      select: { id: true, ticker: true },
      orderBy: { id: "asc" },
    });
    const bulkTickers = [
      "VOO",
      "VT",
      "BND",
      "SPY",
      "QQQ",
      "VTI",
      "SCHD",
      "XLF",
      "XLK",
      "AGG",
      "TLT",
      "SGOV",
      "IAU",
    ];
    const bulkAssets = assetList.filter((asset) =>
      bulkTickers.includes(asset.ticker),
    );

    const bulkRows: Array<{
      portfolioId: bigint;
      assetId: bigint;
      type: string;
      quantity: number;
      price: number;
      fee: number;
      transactionDate: Date;
    }> = [];

    const now = new Date();
    for (let i = 0; i < 365; i += 1) {
      const txDate = new Date(now);
      txDate.setDate(txDate.getDate() - (364 - i));
      txDate.setHours(10, 0, 0, 0);

      const txPerDay = 1 + Math.floor(Math.random() * 2); // 1~2건/일
      for (let k = 0; k < txPerDay; k += 1) {
        const asset = bulkAssets[Math.floor(Math.random() * bulkAssets.length)];
        if (!asset) continue;

        const quantity = Number((2 + Math.random() * 18).toFixed(4));
        const price = Number((60 + Math.random() * 700).toFixed(4));
        const fee = Number((Math.random() * 3).toFixed(4));

        const txAt = new Date(txDate);
        txAt.setMinutes(5 + k * 15);

        bulkRows.push({
          portfolioId: bulkPortfolioId,
          assetId: asset.id,
          type: "BUY",
          quantity,
          price,
          fee,
          transactionDate: txAt,
        });
      }
    }

    if (bulkRows.length > 0) {
      await prisma.transaction.createMany({ data: bulkRows });
      console.log(
        `Seed bulk transactions added (portfolio 4): ${bulkRows.length} rows`,
      );
    }
  }

  console.log(
    `Seed userId=${user.id.toString()} portfolios=${portfolios
      .map((p) => p.id.toString())
      .join(",")}`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log("✅ Seed completed");
  });
