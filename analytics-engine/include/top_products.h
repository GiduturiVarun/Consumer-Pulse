#ifndef TOP_PRODUCTS_H
#define TOP_PRODUCTS_H

#include <vector>
#include <string>
#include "sales_analytics.h"

using namespace std;

// Returns the top K products based on revenue
vector<pair<string, ProductSales>> getTopProductsByRevenue(
    const unordered_map<string, ProductSales>& salesMap,
    int k
);

#endif