#include "sales_trends.h"

vector<double> calculateSevenDaySales(
    const vector<double>& dailySales
) {

    vector<double> weeklyTotals;

    // We need at least 7 days of data
    if (dailySales.size() < 7) {
        return weeklyTotals;
    }

    double windowSum = 0.0;

    // Calculate the first 7-day total
    for (int i = 0; i < 7; i++) {
        windowSum += dailySales[i];
    }

    weeklyTotals.push_back(windowSum);

    // Slide the window one day at a time
    for (int i = 7; i < dailySales.size(); i++) {

        windowSum -= dailySales[i - 7];
        windowSum += dailySales[i];

        weeklyTotals.push_back(windowSum);
    }

    return weeklyTotals;
}