
import { spawn } from "child_process";
import {
    mkdtemp,
    writeFile,
    rm
} from "fs/promises";

import { tmpdir } from "os";
import { join } from "path";
import { fileURLToPath } from "url";

// Resolve project root independently of the terminal's directory
const projectRoot = fileURLToPath(
    new URL("../../../", import.meta.url)
);

// Location of the compiled C++ executable
const executablePath = join(
    projectRoot,
    "analytics-engine",
    "build",
    "consumerpulse_analytics.exe"
);

// Escape text values for safe CSV formatting
function escapeCsv(value) {
    return `"${String(value).replace(/"/g, '""')}"`;
}

// Convert backend records into the four-column CSV
function createAnalyticsCSV(records) {

    const header =
        "transaction_id,product_id,quantity,price";

    const rows = records.map(record => [
        escapeCsv(record.transaction_id),
        escapeCsv(record.product_id),
        record.quantity,
        record.price
    ].join(","));

    return [header, ...rows].join("\n");
}

// Execute the C++ analytics engine
function executeCpp(csvPath) {

    return new Promise((resolve, reject) => {

        const process = spawn(
            executablePath,
            [csvPath],
            {
                cwd: projectRoot,
                windowsHide: true
            }
        );

        let stdout = "";
        let stderr = "";

        process.stdout.setEncoding("utf8");
        process.stderr.setEncoding("utf8");

        process.stdout.on("data", data => {
            stdout += data;
        });

        process.stderr.on("data", data => {
            stderr += data;
        });

        process.on("error", error => {
            reject(error);
        });

        process.on("close", code => {

            if (code !== 0) {
                reject(
                    new Error(
                        stderr.trim() ||
                        `C++ process exited with code ${code}`
                    )
                );

                return;
            }

            resolve({
                output: stdout.trim(),
                warnings: stderr.trim()
            });
        });
    });
}

// Public function called by the upload route
export async function runCppAnalytics(records) {

    let temporaryDirectory;

    try {

        if (!Array.isArray(records) || records.length === 0) {
            throw new Error(
                "No valid records available for C++ analytics"
            );
        }

        temporaryDirectory = await mkdtemp(
            join(tmpdir(), "consumerpulse-")
        );

        const csvPath = join(
            temporaryDirectory,
            "analytics_input.csv"
        );

        const csvContent = createAnalyticsCSV(records);

        await writeFile(
            csvPath,
            csvContent,
            "utf8"
        );

        const result = await executeCpp(csvPath);

        return result;

    } finally {

        if (temporaryDirectory) {
            await rm(temporaryDirectory, {
                recursive: true,
                force: true
            });
        }
    }
}
