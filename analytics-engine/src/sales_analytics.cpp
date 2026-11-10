
#include "sales_analytics.h"

unordered_map<string, ProductSales> aggregateSales(
    const vector<Transaction>& transactions
) {

    unordered_map<string, ProductSales> salesMap;

    for (const Transaction& transaction : transactions) {

        salesMap[transaction.productId].totalQuantity
            += transaction.quantity;

        salesMap[transaction.productId].totalRevenue
            += transaction.quantity * transaction.price;
    }

    return salesMap;
}
