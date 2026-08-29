/**
 * CategorySuggester — Swappable suggestion interface.
 *
 * DESIGN: Strategy Pattern / Dependency Inversion for future ML swap
 * ─────────────────────────────────────────────────────────────────────
 * This module exports a single `CategorySuggester` interface. The app uses
 * `keywordMatcher` (a rules-based implementation) by default, but the interface
 * can be satisfied by any alternative classifier — including an ML model.
 *
 * TO SWAP TO AN ML CLASSIFIER (e.g., Gemini or TensorFlow.js):
 *   1. Create a new file: `src/utils/mlCategorySuggester.ts`
 *   2. Implement the `CategorySuggester` interface:
 *        export const mlMatcher: CategorySuggester = {
 *          suggest: async (description, categories) => { ... }
 *        };
 *   3. In `ExpenseModal.tsx`, replace:
 *        import { keywordMatcher as categorySuggester } from '../utils/categorySuggester';
 *      with:
 *        import { mlMatcher as categorySuggester } from '../utils/mlCategorySuggester';
 *
 * The rest of the app (UI, context, tests) remains completely unchanged.
 * The interface contract guarantees both implementations behave identically.
 */

export interface CategorySuggestion {
  /** Matched category name (lowercased, normalized from shared default categories) */
  categoryName: string;
  /** 0.0–1.0 confidence score. Rules-based matcher uses 1.0 for a keyword hit. */
  confidence: number;
}

export interface CategorySuggester {
  /**
   * Suggest a category name for a given expense description.
   * Returns null when no confident match is found.
   */
  suggest(description: string): CategorySuggestion | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Keyword Rules Map
// Keys are lowercased category names (must match the `name` field from the
// backend's default category seeding). Values are arrays of keyword fragments
// matched case-insensitively against the expense description.
//
// ORDERING MATTERS: Rules are evaluated top-to-bottom; the first match wins.
// More specific / longer-keyword categories should appear before generic ones
// (e.g., travel before education before shopping) to avoid false positives
// from short substring tokens like "book" matching inside "booking".
// ─────────────────────────────────────────────────────────────────────────────
const KEYWORD_RULES: Record<string, string[]> = {
  travel: [
    'hotel', 'resort', 'hostel', 'airbnb', 'booking.com', 'agoda', 'makemytrip',
    'yatra', 'goibibo', 'vacation', 'travel', 'trip', 'tour', 'cruise', 'visa',
  ],
  'food & dining': [
    'starbucks', 'coffee', 'cafe', 'restaurant', 'mcdonald', 'burger', 'pizza',
    'subway', 'kfc', 'chipotle', 'dominos', 'sushi', 'lunch', 'dinner', 'breakfast',
    'food', 'dining', 'eat', 'meal', 'snack', 'grocery', 'supermarket', 'bakery',
    'taco', 'noodle', 'diner', 'bistro', 'grill', 'swiggy', 'zomato', 'doordash',
    'ubereats', 'grubhub',
  ],
  transportation: [
    'uber', 'lyft', 'ola', 'taxi', 'cab', 'metro', 'bus', 'train', 'subway',
    'fuel', 'petrol', 'gas station', 'parking', 'toll', 'auto', 'rickshaw',
    'flight', 'airline', 'airport', 'rapido', 'carpool',
  ],
  entertainment: [
    'netflix', 'spotify', 'youtube', 'prime', 'disney', 'hotstar', 'hulu',
    'apple tv', 'movie', 'cinema', 'theater', 'concert', 'ticket', 'game', 'steam',
    'playstation', 'xbox', 'nintendo', 'event', 'festival', 'bookmyshow',
  ],
  health: [
    'pharmacy', 'medicine', 'doctor', 'hospital', 'clinic', 'medical', 'health',
    'gym', 'fitness', 'yoga', 'physiotherapy', 'dentist', 'prescription',
    'diagnostic', 'test kit', 'insurance',
  ],
  utilities: [
    'electricity', 'water bill', 'internet', 'broadband', 'wifi', 'gas bill',
    'electricity bill', 'utility', 'phone bill', 'mobile bill', 'recharge', 'airtel',
    'jio', 'bsnl', 'maintenance', 'rent',
  ],
  education: [
    'udemy', 'coursera', 'pluralsight', 'skillshare', 'textbook', 'tuition',
    'college', 'school', 'university', 'exam', 'coaching', 'class', 'lecture',
    'workshop', 'study', 'learning', 'duolingo', 'course',
    // NOTE: bare "book" intentionally omitted here — matched via word-boundary
    // regex below to avoid false-positives inside "booking", "Facebook", etc.
  ],
  shopping: [
    'amazon', 'flipkart', 'walmart', 'target', 'ebay', 'meesho', 'myntra',
    'ajio', 'shop', 'store', 'mall', 'clothing', 'apparel', 'fashion',
    'order', 'delivery', 'zara', 'h&m', 'ikea', 'decathlon',
  ],
};

// Word-boundary keywords: matched with \b regex to avoid substring collisions.
// e.g. "book" should NOT match "booking" or "Facebook".
const WORD_BOUNDARY_RULES: Record<string, string[]> = {
  education: ['book'],
};

/**
 * Rules-based keyword matcher implementation of `CategorySuggester`.
 *
 * Matching strategy:
 *   1. Lowercases the input description.
 *   2. Checks word-boundary rules first (regex \b) for each category.
 *   3. Falls through to substring rules (String.includes) in order.
 *   4. Returns the first matching category with confidence = 1.0.
 *
 * To adjust priority order, reorder keys in KEYWORD_RULES above.
 */
export const keywordMatcher: CategorySuggester = {
  suggest(description: string): CategorySuggestion | null {
    if (!description || description.trim().length < 2) return null;

    const lower = description.toLowerCase().trim();

    // Phase 1: Word-boundary regex matching (higher precision for short tokens)
    for (const [categoryName, keywords] of Object.entries(WORD_BOUNDARY_RULES)) {
      const matched = keywords.some((kw) => new RegExp(`\\b${kw}\\b`, 'i').test(lower));
      if (matched) {
        return { categoryName, confidence: 1.0 };
      }
    }

    // Phase 2: Substring matching in defined priority order
    for (const [categoryName, keywords] of Object.entries(KEYWORD_RULES)) {
      const matched = keywords.some((kw) => lower.includes(kw.toLowerCase()));
      if (matched) {
        return { categoryName, confidence: 1.0 };
      }
    }

    return null;
  },
};
