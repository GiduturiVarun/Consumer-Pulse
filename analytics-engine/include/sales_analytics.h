
#ifndef SALES_ANALYTICS_H
#define SALES_ANALYTICS_H

#include <string>
#include <vector>
#include <unordered_map>

using namespace std;

// Represents one retail transaction
struct Transaction {
    string transactionId;
    string productId;
    int quantity;
    double price;
};

// Stores aggregated sales information for a product
struct ProductSales {
    int totalQuantity = 0;
    double totalRevenue = 0.0;
};

// Processes transactions and aggregates sales by product
unordered_map<string, ProductSales> aggregateSales(
    const vector<Transaction>& transactions
);

#endif
