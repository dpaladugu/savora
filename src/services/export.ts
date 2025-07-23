
import { exportData, importData } from '@/lib/export';

export class ExportService {
  static async exportToJson(): Promise<string> {
    return await exportData();
  }

  static async importFromJson(jsonData: string): Promise<{ success: boolean; message: string }> {
    return await importData(jsonData);
  }

  static async exportToCsv(): Promise<string> {
    // TODO: Implement CSV export
    throw new Error('CSV export not implemented yet');
  }

  static async exportToPdf(): Promise<Blob> {
    // TODO: Implement PDF export
    throw new Error('PDF export not implemented yet');
  }
}
