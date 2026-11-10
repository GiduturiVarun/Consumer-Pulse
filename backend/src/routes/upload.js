
import express from "express";
import multer from "multer";
import { parse } from "csv-parse/sync";
import pool from "../config/db.js";
import { runCppAnalytics } from "../services/cppAnalytics.js";

const router = express.Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024
    }
});

const requiredColumns = [
    "transaction_id",
    "customer_id",
    "product_id",
    "store_id",
    "quantity",
    "price",
    "transaction_date"
];

const BATCH_SIZE = 500;

function isValidDate(date) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return false;
    }

    const parsed = new Date(`${date}T00:00:00Z`);

    return !Number.isNaN(parsed.getTime()) &&
        parsed.toISOString().slice(0, 10) === date;
}

// Reusable chunked bulk insertion function
async function insertInChunks(client, table, columns, rows) {

    for (let start = 0; start < rows.length; start += BATCH_SIZE) {

        const chunk = rows.slice(start, start + BATCH_SIZE);

        const values = [];
        const placeholders = [];

        chunk.forEach((row, rowIndex) => {

            const rowPlaceholders = row.map((_, columnIndex) => {
                const parameterIndex =
                    rowIndex * columns.length + columnIndex + 1;

                return `$${parameterIndex}`;
            });

            placeholders.push(`(${rowPlaceholders.join(", ")})`);
            values.push(...row);
        });

        const query = `
            INSERT INTO ${table}
            (${columns.join(", ")})
            VALUES ${placeholders.join(", ")}
        `;

        await client.query(query, values);
    }
}

router.post("/", upload.single("file"), async (req, res) => {

    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: "No CSV file uploaded"
        });
    }

    let client;

    try {

        // STEP 1: Parse CSV
        const rows = parse(req.file.buffer, {
            skip_empty_lines: true,
            trim: true
        });

        if (rows.length === 0) {
            return res.status(400).json({
                success: false,
                message: "CSV file is empty"
            });
        }

        // STEP 2: Validate headers
        const headers = rows[0].map(header => header.trim());

        const missingColumns = requiredColumns.filter(
            column => !headers.includes(column)
        );

        if (missingColumns.length > 0) {
            return res.status(400).json({
                success: false,
                message: "CSV is missing required columns",
                missingColumns
            });
        }

        // STEP 2.5: Reject files without records
        if (rows.length <= 1) {
            return res.status(400).json({
                success: false,
                message: "CSV contains no transaction records"
            });
        }

        // STEP 3: Convert CSV rows into objects
        const records = rows.slice(1).map((row, index) => {

            const record = {};

            headers.forEach((header, i) => {
                record[header] = row[i] ?? "";
            });

            return {
                ...record,
                rowNumber: index + 2
            };
        });

        // STEP 4: Validate individual records
        const seenTransactionIds = new Set();

        const validRecords = [];
        const invalidRecords = [];

        records.forEach(record => {

            const issues = [];

            const {
                transaction_id,
                customer_id,
                product_id,
                store_id,
                quantity,
                price,
                transaction_date
            } = record;

            if (!transaction_id) {
                issues.push("Missing transaction ID");
            }

            if (!customer_id) {
                issues.push("Missing customer ID");
            }

            if (!product_id) {
                issues.push("Missing product ID");
            }

            if (!store_id) {
                issues.push("Missing store ID");
            }

            const numericQuantity = Number(quantity);

            if (
                quantity === "" ||
                !Number.isInteger(numericQuantity) ||
                numericQuantity <= 0
            ) {
                issues.push("Quantity must be a positive integer");
            }

            const numericPrice = Number(price);

            if (
                price === "" ||
                !Number.isFinite(numericPrice) ||
                numericPrice < 0
            ) {
                issues.push("Price must be a valid non-negative number");
            }

            if (!isValidDate(transaction_date)) {
                issues.push("Invalid transaction date");
            }

            if (transaction_id) {

                if (seenTransactionIds.has(transaction_id)) {
                    issues.push("Duplicate transaction ID");
                } else {
                    seenTransactionIds.add(transaction_id);
                }
            }

            if (issues.length > 0) {

                invalidRecords.push({
                    rowNumber: record.rowNumber,
                    transactionId: transaction_id,
                    issues
                });

            } else {

                validRecords.push({
                    ...record,
                    store_id: String(store_id).trim(),
                    quantity: numericQuantity,
                    price: numericPrice
                });
            }
        });

        // STEP 5: Connect to PostgreSQL
        client = await pool.connect();

        await client.query("BEGIN");

        // STEP 6: Create upload batch
        const batchResult = await client.query(
            `INSERT INTO upload_batches
             (filename, upload_date, status)
             VALUES ($1, NOW(), $2)
             RETURNING batch_id`,
            [req.file.originalname, "completed"]
        );

        const batchId = batchResult.rows[0].batch_id;

        // STEP 7: Check existing transaction IDs
        let finalValidRecords = [...validRecords];

        if (finalValidRecords.length > 0) {

            const ids = finalValidRecords.map(
                record => record.transaction_id
            );

            const existingResult = await client.query(
                `SELECT transaction_id
                 FROM transactions
                 WHERE transaction_id = ANY($1::varchar[])`,
                [ids]
            );

            const existingIds = new Set(
                existingResult.rows.map(row => row.transaction_id)
            );

            finalValidRecords = [];

            validRecords.forEach(record => {

                if (existingIds.has(record.transaction_id)) {

                    invalidRecords.push({
                        rowNumber: record.rowNumber,
                        transactionId: record.transaction_id,
                        issues: [
                            "Transaction ID already exists in database"
                        ]
                    });

                } else {
                    finalValidRecords.push(record);
                }
            });
        }

        // STEP 7.5: Check store IDs
        if (finalValidRecords.length > 0) {

            const storeIds = [
                ...new Set(finalValidRecords.map(record => record.store_id))
            ];

            const storesResult = await client.query(
                `SELECT store_id
                 FROM public.stores
                 WHERE store_id = ANY($1::varchar[])`,
                [storeIds]
            );

            const existingStoreIds = new Set(
                storesResult.rows.map(row => row.store_id)
            );

            finalValidRecords = finalValidRecords.filter(record => {

                if (!existingStoreIds.has(record.store_id)) {

                    invalidRecords.push({
                        rowNumber: record.rowNumber,
                        transactionId: record.transaction_id,
                        issues: [
                            `Store ID '${record.store_id}' does not exist in public.stores`
                        ]
                    });

                    return false;
                }

                return true;
            });
        }

        // STEP 8: Prepare transaction rows
        const transactionRows = finalValidRecords.map(record => [
            record.transaction_id,
            record.customer_id,
            record.product_id,
            record.store_id,
            batchId,
            record.quantity,
            record.price,
            record.transaction_date
        ]);

        // STEP 8.1: Bulk insert transactions in chunks
        if (transactionRows.length > 0) {

            await insertInChunks(
                client,
                "transactions",
                [
                    "transaction_id",
                    "customer_id",
                    "product_id",
                    "store_id",
                    "batch_id",
                    "quantity",
                    "price",
                    "transaction_date"
                ],
                transactionRows
            );
        }

        // STEP 9: Prepare data quality issue rows
        const issueRows = invalidRecords.flatMap(record =>
            record.issues.map(issue => [
                batchId,
                record.rowNumber,
                "VALIDATION_ERROR",
                issue
            ])
        );

        // STEP 9.1: Bulk insert data quality issues
        if (issueRows.length > 0) {

            await insertInChunks(
                client,
                "data_quality_issues",
                [
                    "batch_id",
                    "row_number",
                    "issue_type",
                    "description"
                ],
                issueRows
            );
        }

        // STEP 10: Run C++ analytics
        let cppAnalytics = null;

        if (finalValidRecords.length > 0) {
            cppAnalytics = await runCppAnalytics(finalValidRecords);
        }

        // STEP 11: Calculate daily revenue
        const dailyRevenueResult = await client.query(
            `SELECT
                TO_CHAR(transaction_date::date, 'YYYY-MM-DD') AS date,
                COUNT(*)::integer AS transactions,
                SUM(quantity)::integer AS units,
                SUM(quantity * price)::numeric(12, 2)::text AS revenue
             FROM transactions
             WHERE batch_id = $1
             GROUP BY transaction_date::date
             ORDER BY transaction_date::date`,
            [batchId]
        );

        const dailyRevenue = dailyRevenueResult.rows.map(row => ({
            date: row.date,
            transactions: row.transactions,
            units: row.units,
            revenue: Number(row.revenue)
        }));

        // STEP 12: Commit database operations
        await client.query("COMMIT");

        // STEP 13: Return results
        return res.json({
            success: true,
            message: "CSV processed and database updated successfully",

            batchId,
            filename: req.file.originalname,

            totalRecords: records.length,
            validRecords: finalValidRecords.length,
            invalidRecords: invalidRecords.length,

            issuesStored: invalidRecords.reduce(
                (total, record) => total + record.issues.length,
                0
            ),

            validPreview: finalValidRecords.slice(0, 3),
            invalidPreview: invalidRecords.slice(0, 5),

            dailyRevenue,

            cppAnalytics: cppAnalytics
                ? {
                    success: true,
                    output: cppAnalytics.output,
                    warnings: cppAnalytics.warnings || null
                }
                : {
                    success: false,
                    message: "No valid records available for C++ analytics"
                }
        });

    } catch (error) {

        if (client) {
            try {
                await client.query("ROLLBACK");
            } catch (rollbackError) {
                console.error("Database rollback failed:", rollbackError);
            }
        }

        console.error("CSV upload failed:", error);

        return res.status(500).json({
            success: false,
            message: "CSV processing or database insertion failed",
            error: error.message,
            databaseDetail: error.detail || null,
            constraint: error.constraint || null,
            table: error.table || null
        });

    } finally {

        if (client) {
            client.release();
        }
    }
});

export default router;
