#include "data_validator.h"

#include <unordered_set>
#include <cmath>

ValidationReport validateTransactions(
    const vector<Transaction>& transactions
) {

    ValidationReport report;
    unordered_set<string> transactionIds;

    for (const Transaction& transaction : transactions) {

        vector<string> errors;

        if (transaction.transactionId.empty()) {
            errors.push_back("Missing transaction ID");
        }
        else if (transactionIds.count(transaction.transactionId)) {
            errors.push_back("Duplicate transaction ID");
        }
        else {
            transactionIds.insert(transaction.transactionId);
        }

        if (transaction.productId.empty()) {
            errors.push_back("Missing product ID");
        }

        if (transaction.quantity <= 0) {
            errors.push_back("Quantity must be positive");
        }

        if (!isfinite(transaction.price) || transaction.price < 0) {
            errors.push_back("Invalid price");
        }

        if (errors.empty()) {
            report.validTransactions.push_back(transaction);
        }
        else {
            for (const string& error : errors) {
                report.issues.push_back(
                    "Transaction " +
                    (transaction.transactionId.empty()
                        ? string("[UNKNOWN]")
                        : transaction.transactionId)
                    + ": " + error
                );
            }
        }
    }

    return report;
}