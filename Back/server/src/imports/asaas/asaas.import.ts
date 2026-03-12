import fs from "fs";
import csv from "csv-parser";
import { prisma } from "../../lib/prisma";

export async function importAsaasCSV(filePath: string, companyId: string) {

  const rows: any[] = [];

  return new Promise((resolve, reject) => {

    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (data) => {
        rows.push(data);
      })
      .on("end", async () => {

        try {

          for (const row of rows) {

            await prisma.financialTransaction.create({
              data: {
                description: row.description,
                type: row.type,
                amount: parseFloat(row.amount),
                date: new Date(row.date),
                clientName: row.client || null,
                companyId: companyId
              }
            });

          }

          resolve(true);

        } catch (error) {

          reject(error);

        }

      })
      .on("error", reject);

  });

}