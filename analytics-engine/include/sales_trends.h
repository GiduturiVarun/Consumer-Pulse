#ifndef SALES_TRENDS_H
#define SALES_TRENDS_H

#include <vector>

using namespace std;

// Calculates the sum of sales for every 7-day window
vector<double> calculateSevenDaySales(
    const vector<double>& dailySales
);

#endif