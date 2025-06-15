
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug'
}

export class Logger {
  private static isDevelopment = import.meta.env.DEV;

  static log(level: LogLevel, message: string, data?: any) {
    if (!this.isDevelopment && level === LogLevel.DEBUG) {
      return;
    }

    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
    
    switch (level) {
      case LogLevel.ERROR:
        console.error(logMessage, data);
        break;
      case LogLevel.WARN:
        console.warn(logMessage, data);
        break;
      case LogLevel.INFO:
        console.info(logMessage, data);
        break;
      case LogLevel.DEBUG:
        console.log(logMessage, data);
        break;
    }
  }

  static error(message: string, error?: any) {
    this.log(LogLevel.ERROR, message, error);
  }

  static warn(message: string, data?: any) {
    this.log(LogLevel.WARN, message, data);
  }

  static info(message: string, data?: any) {
    this.log(LogLevel.INFO, message, data);
  }

  static debug(message: string, data?: any) {
    this.log(LogLevel.DEBUG, message, data);
  }
}
