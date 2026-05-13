import chalk from 'chalk';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

class Logger {
  private level: LogLevel;

  constructor(level: LogLevel = 'info') {
    this.level = level;
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.level];
  }

  private getTimestamp(): string {
    return new Date().toISOString();
  }

  debug(message: string, ...args: any[]): void {
    if (this.shouldLog('debug')) {
      console.log(
        `${chalk.gray(this.getTimestamp())} ${chalk.blue('[DEBUG]')} ${message}`,
        ...args
      );
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.shouldLog('info')) {
      console.log(
        `${chalk.gray(this.getTimestamp())} ${chalk.green('[INFO]')}  ${message}`,
        ...args
      );
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.shouldLog('warn')) {
      console.warn(
        `${chalk.gray(this.getTimestamp())} ${chalk.yellow('[WARN]')}  ${message}`,
        ...args
      );
    }
  }

  error(message: string, ...args: any[]): void {
    if (this.shouldLog('error')) {
      console.error(
        `${chalk.gray(this.getTimestamp())} ${chalk.red('[ERROR]')} ${message}`,
        ...args
      );
    }
  }

  pipeline(stage: string, status: string, message: string): void {
    const stageLabel = chalk.cyan(`[${stage}]`);
    const statusLabel =
      status === 'completed'
        ? chalk.green(`✓ ${status}`)
        : status === 'failed'
        ? chalk.red(`✗ ${status}`)
        : status === 'skipped'
        ? chalk.yellow(`⊘ ${status}`)
        : chalk.blue(`▶ ${status}`);

    console.log(
      `${chalk.gray(this.getTimestamp())} ${stageLabel} ${statusLabel} - ${message}`
    );
  }
}

export const logger = new Logger(
  (process.env.LOG_LEVEL as LogLevel) || 'info'
);
