import * as fs from 'fs';
import * as Papa from 'papaparse';
import * as dotenv from 'dotenv';
import { db } from '~/server/db';
import { createTRPCRouter, publicProcedure } from '../trpc';

dotenv.config(); // Load env variables from .env

// Function for parsing CSV
function parseCsvFile(filePath: string): any[] {
    try {
        // Read the CSV file and parse its contents
        const fileContents = fs.readFileSync(filePath, 'utf8');
        const results = Papa.parse(fileContents, {
            header: true,
            skipEmptyLines: true,
            dynamicTyping: (field) => field === 'ifinId'
        });
        return results.data;
    } catch (error) {
        // Handle errors that occur during CSV parsing
        console.error("Error parsing CSV file:", error);
        throw error; // Re-throw to propagate the error
    }
}

// Define the seedRouter for handling seed-related operations
export const seedRouter = createTRPCRouter({
    doJob: publicProcedure
        .mutation(async () => {
            // Parse the CSV files
            let seedData: any[];
            try {
                // Call the parseCsvFile function to parse the CSV file
                seedData = parseCsvFile(process.env.REALISED_PNL_CSV_FILE_PATH!);

                // Convert string representation of accountType to array of strings
                // seedData = seedData.map((row: any) => ({  // Explicitly specify the type of 'row'
                //     ...row,
                //     accountType: row.accountType
                //         .replace(/\[|\]|'/g, '') // Remove square brackets and single quotes
                //         .split(',') // Split by comma
                //         .map((s: string) => s.trim()), // Trim each value
                // }));
            } catch (error) {
                // Handle errors that occur during CSV parsing
                console.error("Error parsing CSV files:", error);
                throw error; // Re-throw to propagate the error
            }

            // Insert the parsed data into the database
            console.log('Start seeding...');
            try {
                // Use Prisma to insert data into the database
                await Promise.all([
                    db.realisedPnl.createMany({ data: seedData }),
                ]);
            } catch (error) {
                // Handle errors that occur during database insertion
                console.error('Error creating data:', error);
                throw error; // Re-throw to propagate the error
            }
            // Log a success message when seeding is complete
            console.log('Seeding finished.');
            console.log('Data created successfully!');
        }),
});