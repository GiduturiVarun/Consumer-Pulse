
cmake_minimum_required(VERSION 3.16)

project(ConsumerPulseAnalytics)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

add_executable(consumerpulse_analytics
    src/main.cpp
    src/sales_analytics.cpp
    src/top_products.cpp
    src/sales_trends.cpp
    src/data_validator.cpp
    src/product_trie.cpp
    src/csv_reader.cpp
)

target_include_directories(consumerpulse_analytics PRIVATE include)
