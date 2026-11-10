
#include "csv_reader.h"

#include <fstream>
#include <sstream>
#include <stdexcept>
#include <string>
#include <vector>
#include <cctype>

// Parse one CSV line, supporting quoted fields,
// escaped quotes and commas inside quoted fields.
static std::vector<std::string> parseCSVLine(
    const std::string& line
) {
    std::vector<std::string> fields;
    std::string field;

    bool insideQuotes = false;

    for (size_t i = 0; i < line.size(); i++) {

        char ch = line[i];

        if (ch == '"') {

            // Two consecutive quotes represent one literal quote.
            if (insideQuotes &&
                i + 1 < line.size() &&
                line[i + 1] == '"') {

                field += '"';
                i++;
            }
            else {
                insideQuotes = !insideQuotes;
            }
        }
        else if (ch == ',' && !insideQuotes) {

            fields.push_back(field);
            field.clear();
        }
        else {
            field += ch;
        }
    }

    if (insideQuotes) {
        throw std::runtime_error(
            "Malformed CSV: unclosed quoted field"
        );
    }

    fields.push_back(field);

    return fields;
}

// Remove leading and trailing whitespace.
static std::string trim(const std::string& value) {

    size_t start = 0;
    size_t end = value.size();

    while (start < end &&
           std::isspace(static_cast<unsigned char>(value[start]))) {
        start++;
    }

    while (end > start &&
           std::isspace(static_cast<unsigned char>(value[end - 1]))) {
        end--;
    }

    return value.substr(start, end - start);
}

// Read transaction records from CSV.
std::vector<Transaction> readTransactionsFromCSV(
    const std::string& filename
) {

    std::vector<Transaction> transactions;

    std::ifstream file(filename);

    if (!file.is_open()) {
        throw std::runtime_error(
            "Unable to open CSV file: " + filename
        );
    }

    std::string line;

    // Read and ignore the header.
    if (!std::getline(file, line)) {
        return transactions;
    }

    while (std::getline(file, line)) {

        if (line.empty()) {
            continue;
        }

        // Support Windows CRLF files.
        if (!line.empty() && line.back() == '\r') {
            line.pop_back();
        }

        try {

            std::vector<std::string> fields =
                parseCSVLine(line);

            if (fields.size() != 4) {
                continue;
            }

            std::string transactionId = trim(fields[0]);
            std::string productId = trim(fields[1]);
            std::string quantityString = trim(fields[2]);
            std::string priceString = trim(fields[3]);

            if (transactionId.empty() ||
                productId.empty() ||
                quantityString.empty() ||
                priceString.empty()) {
                continue;
            }

            size_t quantityPos = 0;
            size_t pricePos = 0;

            int quantity = std::stoi(
                quantityString,
                &quantityPos
            );

            double price = std::stod(
                priceString,
                &pricePos
            );

            // Reject partially parsed numeric values.
            if (quantityPos != quantityString.size() ||
                pricePos != priceString.size()) {
                continue;
            }

            transactions.push_back({
                transactionId,
                productId,
                quantity,
                price
            });

        }
        catch (const std::exception&) {
            // Skip malformed rows.
            continue;
        }
    }

    return transactions;
}
