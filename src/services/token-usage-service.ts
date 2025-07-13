interface DailyUsage {
  [date: string]: { // YYYY-MM-DD
    total_tokens: number;
  };
}

interface MonthlyUsage {
  [month: string]: { // YYYY-MM
    total_tokens: number;
  };
}

interface StoredTokenUsage {
  daily: DailyUsage;
  monthly: MonthlyUsage;
  // lastReset?: string; // Could be added if Deepseek has a known daily/monthly reset time/day
}

const STORAGE_KEY = 'savoraAiTokenUsage';
const MAX_DAILY_RECORDS = 60; // Keep last 60 days of daily records

export class TokenUsageService {
  private static getStoredUsage(): StoredTokenUsage {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as StoredTokenUsage;
        // Basic validation
        if (parsed.daily && parsed.monthly) {
          return parsed;
        }
      }
    } catch (error) {
      console.error("Error reading token usage from localStorage:", error);
    }
    return { daily: {}, monthly: {} };
  }

  private static saveStoredUsage(usage: StoredTokenUsage): void {
    try {
      // Prune old daily records
      const dailyKeys = Object.keys(usage.daily).sort().reverse(); // Sort descending, newest first
      if (dailyKeys.length > MAX_DAILY_RECORDS) {
        for (let i = MAX_DAILY_RECORDS; i < dailyKeys.length; i++) {
          delete usage.daily[dailyKeys[i]];
        }
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(usage));
    } catch (error) {
      console.error("Error saving token usage to localStorage:", error);
    }
  }

  public static addUsage(tokensUsed: number): void {
    if (typeof tokensUsed !== 'number' || tokensUsed <= 0) {
      return;
    }

    const now = new Date();
    const todayDateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const currentMonthStr = todayDateStr.substring(0, 7); // YYYY-MM

    const usage = this.getStoredUsage();

    // Update daily
    usage.daily[todayDateStr] = {
      total_tokens: (usage.daily[todayDateStr]?.total_tokens || 0) + tokensUsed,
    };

    // Update monthly
    usage.monthly[currentMonthStr] = {
      total_tokens: (usage.monthly[currentMonthStr]?.total_tokens || 0) + tokensUsed,
    };

    this.saveStoredUsage(usage);
    console.log(`Logged ${tokensUsed} tokens. Today: ${usage.daily[todayDateStr].total_tokens}, This Month: ${usage.monthly[currentMonthStr].total_tokens}`);
  }

  public static getCurrentDailyUsage(): number {
    const todayDateStr = new Date().toISOString().split('T')[0];
    const usage = this.getStoredUsage();
    return usage.daily[todayDateStr]?.total_tokens || 0;
  }

  public static getCurrentMonthlyUsage(): number {
    const currentMonthStr = new Date().toISOString().split('T')[0].substring(0, 7);
    const usage = this.getStoredUsage();
    return usage.monthly[currentMonthStr]?.total_tokens || 0;
  }

  public static getUsageForDay(dateStr: string): number { // YYYY-MM-DD
    const usage = this.getStoredUsage();
    return usage.daily[dateStr]?.total_tokens || 0;
  }

  public static getUsageForMonth(monthStr: string): number { // YYYY-MM
    const usage = this.getStoredUsage();
    return usage.monthly[monthStr]?.total_tokens || 0;
  }

  // For testing or manual reset by user
  public static resetAllUsage(): void {
    localStorage.removeItem(STORAGE_KEY);
  }
}
