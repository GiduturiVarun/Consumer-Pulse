#include "product_trie.h"

ProductTrie::ProductTrie() {
    root = new TrieNode();
}

ProductTrie::~ProductTrie() {
    // Delete all allocated nodes
    std::vector<TrieNode*> nodes;
    nodes.push_back(root);

    for (std::size_t i = 0; i < nodes.size(); i++) {
        for (const auto& child : nodes[i]->children) {
            nodes.push_back(child.second);
        }
    }

    for (TrieNode* node : nodes) {
        delete node;
    }
}

void ProductTrie::insert(const std::string& productId) {

    TrieNode* current = root;

    for (char ch : productId) {

        if (current->children.find(ch) == current->children.end()) {
            current->children[ch] = new TrieNode();
        }

        current = current->children[ch];
    }

    current->isEndOfWord = true;
}

void ProductTrie::collectProducts(
    TrieNode* node,
    const std::string& prefix,
    std::vector<std::string>& results
) {

    if (node->isEndOfWord) {
        results.push_back(prefix);
    }

    for (const auto& child : node->children) {
        collectProducts(
            child.second,
            prefix + child.first,
            results
        );
    }
}

std::vector<std::string> ProductTrie::searchByPrefix(
    const std::string& prefix
) {

    TrieNode* current = root;

    for (char ch : prefix) {

        auto it = current->children.find(ch);

        if (it == current->children.end()) {
            return {};
        }

        current = it->second;
    }

    std::vector<std::string> results;

    collectProducts(current, prefix, results);

    return results;
}