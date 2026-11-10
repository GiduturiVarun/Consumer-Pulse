#ifndef DATA_VALIDATOR_H
#define DATA_VALIDATOR_H

#include <vector>
#include <string>
#include "sales_analytics.h"

using namespace std;

struct ValidationReport {
    vector<Transaction> validTransactions;
    vector<string> issues;
};

ValidationReport validateTransactions(
    const vector<Transaction>& transactions
);

#endif