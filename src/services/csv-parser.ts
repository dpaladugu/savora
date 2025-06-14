
export interface ParsedExpense {
  date: string;
  amount: number;
  category: string;
  paymentMode: string;
  description: string;
  tags: string;
  account: string;
}

export interface ParsedInvestment {
  date: string;
  fundName: string;
  folio: string;
  units: number;
  nav: number;
  amount: number;
  type: string;
}

export interface ParsedCreditCard {
  date: string;
  description: string;
  amount: number;
  type: 'debit' | 'credit';
  merchant: string;
  category: string;
  cardLastFour: string;
}

export class CSVParser {
  static parseAxioExpenses(csvText: string): ParsedExpense[] {
    const lines = csvText.split('\n').filter(line => line.trim());
    
    // Skip header and footer lines
    const dataLines = lines.slice(1, -2).filter(line => 
      !line.includes('Date,Amount,Category') && 
      !line.includes('Total:') &&
      line.includes(',')
    );
    
    const expenses: ParsedExpense[] = [];
    
    for (const line of dataLines) {
      const columns = line.split(',').map(col => col.trim().replace(/"/g, ''));
      
      if (columns.length >= 6) {
        const [date, amount, category, paymentMode, description, tags, account] = columns;
        
        // Skip credit card bill payments and transfers
        if (description.toLowerCase().includes('bill payment') || 
            description.toLowerCase().includes('transfer')) {
          continue;
        }
        
        const parsedAmount = Math.abs(parseFloat(amount.replace(/[^\d.-]/g, '')));
        
        if (!isNaN(parsedAmount) && parsedAmount > 0) {
          expenses.push({
            date: this.parseDate(date),
            amount: parsedAmount,
            category: category || 'Other',
            paymentMode: paymentMode || 'Unknown',
            description: description || '',
            tags: tags || '',
            account: account || 'Unknown'
          });
        }
      }
    }
    
    return expenses;
  }

  static parseCreditCardStatement(csvText: string): ParsedCreditCard[] {
    const lines = csvText.split('\n').filter(line => line.trim());
    const dataLines = lines.slice(1); // Skip header
    
    const transactions: ParsedCreditCard[] = [];
    
    for (const line of dataLines) {
      const columns = line.split(',').map(col => col.trim().replace(/"/g, ''));
      
      if (columns.length >= 4) {
        // Assuming format: Date, Description, Amount, Type
        const [date, description, amount, type] = columns;
        
        const parsedAmount = Math.abs(parseFloat(amount.replace(/[^\d.-]/g, '')));
        
        if (!isNaN(parsedAmount) && parsedAmount > 0) {
          transactions.push({
            date: this.parseDate(date),
            description: description || 'Unknown Transaction',
            amount: parsedAmount,
            type: type?.toLowerCase().includes('credit') ? 'credit' : 'debit',
            merchant: this.extractMerchant(description),
            category: this.categorizeTransaction(description),
            cardLastFour: '****' // Will be enhanced with actual card detection
          });
        }
      }
    }
    
    return transactions;
  }
  
  static parseKuveraInvestments(csvText: string): ParsedInvestment[] {
    const lines = csvText.split('\n').filter(line => line.trim());
    const dataLines = lines.slice(1); // Skip header
    
    const investments: ParsedInvestment[] = [];
    
    for (const line of dataLines) {
      const columns = line.split(',').map(col => col.trim().replace(/"/g, ''));
      
      if (columns.length >= 7) {
        const [date, fundName, folio, units, nav, amount, type] = columns;
        
        const parsedUnits = parseFloat(units.replace(/[^\d.-]/g, ''));
        const parsedNav = parseFloat(nav.replace(/[^\d.-]/g, ''));
        const parsedAmount = parseFloat(amount.replace(/[^\d.-]/g, ''));
        
        if (!isNaN(parsedAmount) && parsedAmount > 0) {
          investments.push({
            date: this.parseDate(date),
            fundName: fundName || '',
            folio: folio || '',
            units: parsedUnits || 0,
            nav: parsedNav || 0,
            amount: parsedAmount,
            type: type || 'Buy'
          });
        }
      }
    }
    
    return investments;
  }

  private static extractMerchant(description: string): string {
    // Extract merchant name from transaction description
    const cleaned = description.replace(/[0-9]{4,}/g, '').trim();
    return cleaned.split(' ')[0] || 'Unknown Merchant';
  }

  private static categorizeTransaction(description: string): string {
    const desc = description.toLowerCase();
    
    if (desc.includes('fuel') || desc.includes('petrol') || desc.includes('diesel')) return 'Fuel';
    if (desc.includes('food') || desc.includes('restaurant') || desc.includes('dining')) return 'Food';
    if (desc.includes('amazon') || desc.includes('flipkart') || desc.includes('shopping')) return 'Shopping';
    if (desc.includes('uber') || desc.includes('ola') || desc.includes('travel')) return 'Travel';
    if (desc.includes('medical') || desc.includes('pharmacy') || desc.includes('hospital')) return 'Health';
    if (desc.includes('electricity') || desc.includes('water') || desc.includes('gas')) return 'Bills';
    
    return 'Other';
  }
  
  private static parseDate(dateStr: string): string {
    // Handle various date formats
    const cleanDate = dateStr.replace(/[^\d\/\-\.]/g, '');
    const date = new Date(cleanDate);
    
    if (isNaN(date.getTime())) {
      return new Date().toISOString().split('T')[0];
    }
    
    return date.toISOString().split('T')[0];
  }
}
