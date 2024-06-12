import { createTRPCRouter, publicProcedure } from '../trpc';
import { z } from 'zod';
import { db } from '~/server/db';

// Define Zod schema for the parameters
const ParamsSchema = z.object({
  fromDate: z.string({
    required_error: 'fromDate is required',
  }),
  toDate: z.string({
    required_error: 'toDate is required',
  }),
  email: z.string({
    required_error: 'Email is required',
  }).email('Invalid email'), // Validate email format using Zod
  entryType: z.enum(['FNO_INTRADAY', 'FNO_EQUITY', 'EQUITY', 'MCX', 'DIVIDEND', 'MF', 'FNO_EQUITY_ADJUSTMENT']), // Adjust this enum according to your entry types
});

export const realisedPnlRouter = createTRPCRouter({
  doJob: publicProcedure
    .input(ParamsSchema) // Validate input parameters using Zod schema
    .query(async ({ input }) => {
      console.log(input);
      const { fromDate, toDate, email, entryType } = input;

      try {

        const allRealisedPnl = await db.realisedPnl.findMany({
          where: {
            fromDate: {
              gte: fromDate,
              lte: toDate,
            },
            entryType: entryType,
            crm: {
              email: email,
            }
          },
          select: {
            fromDate: true,
            pnl: true,
          },
        });

        const realisedPnlData = allRealisedPnl.map((item) => {
          return {
            date: item.fromDate.toISOString().slice(0, 10),
            pnl: item.pnl,
          };
        });

        return realisedPnlData;
      } catch (error) {
        console.error('Error fetching data:', error);
        throw new Error('Internal Service Error');
      }
    }),
});