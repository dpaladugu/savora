/**
 * Smart expense auto-categorisation
 * Maps description keywords → category names from EXPENSE_CATEGORIES
 */

const RULES: Array<{ keywords: string[]; category: string }> = [
  // Food & Dining
  { keywords: ['zomato', 'swiggy', 'dominos', 'pizza', 'burger', 'kfc', 'mcdonalds', 'restaurant', 'biryani', 'lunch', 'dinner', 'breakfast', 'canteen', 'cafe', 'coffee', 'tea', 'hotel food', 'food'], category: 'Food & Dining' },
  // Groceries
  { keywords: ['grocery', 'groceries', 'vegetables', 'fruits', 'milk', 'bigbasket', 'blinkit', 'zepto', 'dmart', 'reliance fresh', 'more supermarket', 'kirana', 'rice', 'dal', 'ration'], category: 'Groceries' },
  // Transport
  { keywords: ['uber', 'ola', 'rapido', 'auto', 'taxi', 'cab', 'bus', 'train', 'metro', 'petrol', 'fuel', 'diesel', 'toll', 'parking', 'flight', 'irctc', 'transport'], category: 'Transport' },
  // Utilities
  { keywords: ['electricity', 'power', 'bescom', 'tsspdcl', 'apspdcl', 'water bill', 'gas bill', 'lpg', 'piped gas', 'utility', 'broadband', 'wifi', 'internet', 'bsnl', 'airtel fiber'], category: 'Utilities' },
  // Mobile & Internet
  { keywords: ['mobile recharge', 'recharge', 'airtel', 'jio', 'vi ', 'vodafone', 'postpaid', 'phone bill'], category: 'Mobile & Internet' },
  // Health & Medical
  { keywords: ['doctor', 'hospital', 'clinic', 'pharmacy', 'medicine', 'medical', 'health', 'apollo', 'lab test', 'blood test', 'diagnostic', 'dental', 'chemist', 'medi'], category: 'Health & Medical' },
  // Shopping
  { keywords: ['amazon', 'flipkart', 'myntra', 'meesho', 'nykaa', 'ajio', 'clothes', 'shirt', 'shoes', 'shopping', 'purchase', 'buy', 'online order'], category: 'Shopping' },
  // Entertainment
  { keywords: ['netflix', 'prime', 'hotstar', 'disney', 'spotify', 'youtube premium', 'movie', 'cinema', 'pvr', 'inox', 'gaming', 'subscription', 'entertainment'], category: 'Entertainment' },
  // Education
  { keywords: ['school', 'college', 'tuition', 'fees', 'udemy', 'coursera', 'books', 'stationery', 'course', 'exam', 'education'], category: 'Education' },
  // EMI & Loans
  { keywords: ['emi', 'loan', 'incred', 'icici loan', 'hdfc loan', 'equated', 'repayment'], category: 'EMI & Loans' },
  // Insurance
  { keywords: ['insurance', 'premium', 'lic', 'star health', 'hdfc ergo', 'tata aig', 'bajaj allianz', 'policy', 'renew'], category: 'Insurance' },
  // Investments
  { keywords: ['sip', 'mutual fund', 'mf invest', 'ppf', 'nps', 'epf', 'investment', 'stock', 'zerodha', 'groww', 'kuvera', 'coin'], category: 'Investments' },
  // Rent
  { keywords: ['rent', 'house rent', 'flat rent', 'pg rent', 'landlord'], category: 'Rent' },
  // Salary / Income (skip — this is an expense form)
  // Personal Care
  { keywords: ['salon', 'haircut', 'spa', 'barber', 'beauty', 'parlour', 'cosmetics', 'grooming'], category: 'Personal Care' },
  // Gifts & Donations
  { keywords: ['gift', 'donation', 'charity', 'present', 'wedding gift', 'birthday gift'], category: 'Gifts & Donations' },
  // Travel
  { keywords: ['hotel', 'resort', 'holiday', 'vacation', 'travel', 'trip', 'tour', 'airbnb', 'oyo', 'makemytrip'], category: 'Travel' },
  // Household
  { keywords: ['plumber', 'electrician', 'repair', 'maintenance', 'furniture', 'appliance', 'home', 'household', 'cleaning'], category: 'Household' },
];

/**
 * Returns the best-matching category for a description string, or '' if no match.
 */
export function suggestCategory(description: string): string {
  if (!description || description.length < 3) return '';
  const lower = description.toLowerCase();
  for (const rule of RULES) {
    if (rule.keywords.some(k => lower.includes(k))) {
      return rule.category;
    }
  }
  return '';
}
