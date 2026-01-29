// ============================================
// OpenBaccarat - 日志管理器
// 提供带级别控制的日志功能
// ============================================

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4,
}

// 从环境变量读取日志级别
function getLogLevelFromEnv(): LogLevel {
  const envLevel = process.env.NEXT_PUBLIC_LOG_LEVEL?.toUpperCase();
  
  switch (envLevel) {
    case 'DEBUG':
      return LogLevel.DEBUG;
    case 'INFO':
      return LogLevel.INFO;
    case 'WARN':
      return LogLevel.WARN;
    case 'ERROR':
      return LogLevel.ERROR;
    case 'NONE':
      return LogLevel.NONE;
    default:
      // 开发环境默认 DEBUG，生产环境默认 INFO
      return process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG;
  }
}

class Logger {
  private level: LogLevel;
  private prefix: string;

  constructor(prefix: string = 'OpenBaccarat') {
    this.level = getLogLevelFromEnv();
    this.prefix = prefix;
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  getLevel(): LogLevel {
    return this.level;
  }

  private formatMessage(level: string, message: string): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${this.prefix}] [${level}] ${message}`;
  }

  debug(message: string, ...args: unknown[]): void {
    if (this.level <= LogLevel.DEBUG) {
      console.debug(this.formatMessage('DEBUG', message), ...args);
    }
  }

  info(message: string, ...args: unknown[]): void {
    if (this.level <= LogLevel.INFO) {
      console.info(this.formatMessage('INFO', message), ...args);
    }
  }

  warn(message: string, ...args: unknown[]): void {
    if (this.level <= LogLevel.WARN) {
      console.warn(this.formatMessage('WARN', message), ...args);
    }
  }

  error(message: string, ...args: unknown[]): void {
    if (this.level <= LogLevel.ERROR) {
      console.error(this.formatMessage('ERROR', message), ...args);
    }
  }

  // 游戏专用日志方法（带 emoji 前缀）
  game(message: string, ...args: unknown[]): void {
    if (this.level <= LogLevel.INFO) {
      console.log(`🎮 ${message}`, ...args);
    }
  }

  shoe(message: string, ...args: unknown[]): void {
    if (this.level <= LogLevel.INFO) {
      console.log(`🎴 ${message}`, ...args);
    }
  }

  chain(message: string, ...args: unknown[]): void {
    if (this.level <= LogLevel.INFO) {
      console.log(`⛓️ ${message}`, ...args);
    }
  }

  db(message: string, ...args: unknown[]): void {
    if (this.level <= LogLevel.DEBUG) {
      console.log(`💾 ${message}`, ...args);
    }
  }
}

// 创建默认 logger 实例
export const logger = new Logger();

// 创建带自定义前缀的 logger
export function createLogger(prefix: string): Logger {
  return new Logger(prefix);
}

// 导出便捷方法
export const debug = logger.debug.bind(logger);
export const info = logger.info.bind(logger);
export const warn = logger.warn.bind(logger);
export const error = logger.error.bind(logger);
