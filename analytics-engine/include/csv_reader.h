#ifndef CSV_READER_H
#define CSV_READER_H

#include <string>
#include <vector>

#include "sales_analytics.h"

std::vector<Transaction> readTransactionsFromCSV(
    const std::string& filename
);

#endif