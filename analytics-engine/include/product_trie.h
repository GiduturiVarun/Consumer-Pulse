#ifndef PRODUCT_TRIE_H
#define PRODUCT_TRIE_H

#include <string>
#include <vector>
#include <unordered_map>

class TrieNode {
public:
    std::unordered_map<char, TrieNode*> children;
    bool isEndOfWord = false;
};

class ProductTrie {
private:
    TrieNode* root;

    void collectProducts(
        TrieNode* node,
        const std::string& prefix,
        std::vector<std::string>& results
    );

public:
    ProductTrie();
    ~ProductTrie();

    void insert(const std::string& productId);

    std::vector<std::string> searchByPrefix(
        const std::string& prefix
    );
};

#endif