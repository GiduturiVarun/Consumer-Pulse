
#include <iostream>
#include <vector>
#include <iomanip>
#include <string>
#include <exception>

#include "sales_analytics.h"
#include "top_products.h"
#include "sales_trends.h"
#include "data_validator.h"
#include "product_trie.h"
#include "csv_reader.h"

int main(int argc, char* argv[]) {

    // 1. GET CSV FILE PATH
    if (argc < 2) {
        std::cout << "Please provide a CSV file path.\n";
        std::cout << "Usage: consumerpulse_analytics <csv-file-path>\n";
        return 1;
    }

    std::string filename = argv[1];

    try {

        // 2. READ TRANSACTIONS FROM CSV
        std::vector<Transaction> transactions =
            readTransactionsFromCSV(filename);

        std::cout << std::fixed << std::setprecision(2);

        std::cout << "\nCONSUMERPULSE ANALYTICS ENGINE\n";
        std::cout << "==============================\n";

        std::cout << "CSV File: " << filename << '\n';
        std::cout << "Transactions Loaded: "
                  << transactions.size() << '\n';

        // 3. DATA VALIDATION
        ValidationReport report =
            validateTransactions(transactions);

        std::cout << "\nDATA VALIDATION\n";
        std::cout << "---------------\n";

        std::cout << "Total: "
                  << transactions.size() << '\n';

        std::cout << "Valid: "
                  << report.validTransactions.size() << '\n';

        std::cout << "Invalid: "
                  << transactions.size() -
                     report.validTransactions.size()
                  << '\n';

        for (const std::string& issue : report.issues) {
            std::cout << "Issue: " << issue << '\n';
        }

        // 4. PRODUCT SALES AGGREGATION
        auto sales =
            aggregateSales(report.validTransactions);

        std::cout << "\nPRODUCT SALES SUMMARY\n";
        std::cout << "---------------------\n";

        for (const auto& entry : sales) {
            std::cout << entry.first
                      << " | Quantity: "
                      << entry.second.totalQuantity
                      << " | Revenue: Rs. "
                      << entry.second.totalRevenue
                      << '\n';
        }

        // 5. TOP 2 PRODUCTS
        auto topProducts =
            getTopProductsByRevenue(sales, 2);

        std::cout << "\nTOP 2 PRODUCTS BY REVENUE\n";
        std::cout << "-------------------------\n";

        int rank = 1;

        for (const auto& product : topProducts) {
            std::cout << rank++ << ". "
                      << product.first
                      << " | Revenue: Rs. "
                      << product.second.totalRevenue
                      << '\n';
        }

        // 6. SEVEN-DAY SALES TREND (DEMO DATA)
        // This is temporary because the current CSV
        // does not contain transaction dates.

        std::vector<double> dailySales = {
            100, 200, 150, 300,
            250, 400, 350, 500
        };

        auto weeklyTotals =
            calculateSevenDaySales(dailySales);

        std::cout << "\n7-DAY SALES TREND (DEMO DATA)\n";
        std::cout << "-----------------------------\n";

        for (std::size_t i = 0;
             i < weeklyTotals.size(); i++) {

            std::cout << "Window " << i + 1
                      << ": Rs. "
                      << weeklyTotals[i] << '\n';
        }

        // 7. TRIE-BASED PRODUCT SEARCH
        ProductTrie productTrie;

        for (const auto& entry : sales) {
            productTrie.insert(entry.first);
        }

        std::string searchPrefix = "P10";

        auto matchingProducts =
            productTrie.searchByPrefix(searchPrefix);

        std::cout << "\nPRODUCT PREFIX SEARCH\n";
        std::cout << "---------------------\n";

        std::cout << "Search prefix: "
                  << searchPrefix << '\n';

        for (const std::string& productId :
             matchingProducts) {

            std::cout << "Found: "
                      << productId << '\n';
        }

        std::cout << "\nConsumerPulse Analytics Completed!\n";

    }
    catch (const std::exception& error) {

        std::cerr << "\nERROR: "
                  << error.what() << '\n';

        return 1;
    }

    return 0;
}
