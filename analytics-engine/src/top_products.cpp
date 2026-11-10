#include "top_products.h"
#include <queue>

// Compare products based on revenue
struct RevenueComparator {

    bool operator()(
        const pair<string, ProductSales>& a,
        const pair<string, ProductSales>& b
    ) const {

        return a.second.totalRevenue < b.second.totalRevenue;
    }
};

vector<pair<string, ProductSales>> getTopProductsByRevenue(
    const unordered_map<string, ProductSales>& salesMap,
    int k
) {

    priority_queue<
        pair<string, ProductSales>,
        vector<pair<string, ProductSales>>,
        RevenueComparator
    > maxHeap;

    // Insert all products into the heap
    for (const auto& entry : salesMap) {
        maxHeap.push(entry);
    }

    vector<pair<string, ProductSales>> topProducts;

    // Extract the top K products
    while (!maxHeap.empty() && k > 0) {

        topProducts.push_back(maxHeap.top());

        maxHeap.pop();

        k--;
    }

    return topProducts;
}