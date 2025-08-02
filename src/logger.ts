import { createLogger, format, transports, Logger } from 'winston';
import type { TransformableInfo } from 'logform';

const SENSITIVE_FIELDS = ['password', 'token', 'secret', 'creditCard'];

const redactSensitive = format((info: TransformableInfo) => {
  for (const key of SENSITIVE_FIELDS) {
    if (info[key]) {
      info[key] = '[REDACTED]';
    }
  }
  return info;
});

const jsonFormat = format.combine(
  format.timestamp(),
  format.errors({ stack: true }),
  redactSensitive(),
  format.json()
);

const devFormat = format.combine(
  format.colorize(),
  format.timestamp(),
  format.printf((info: TransformableInfo) => {
    const { timestamp, level, message, ...meta } = info as Record<string, any>;
    const rest = Object.keys(meta).length ? ` ${JSON.stringify(meta, null, 2)}` : '';
    return `${timestamp} ${level}: ${message}${rest}`;
  })
);

export const logger: Logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  defaultMeta: { service: process.env.SERVICE_NAME || 'joker-service' },
  format: jsonFormat,
  transports: [
    new transports.Console({
      format: process.env.NODE_ENV === 'production' ? jsonFormat : devFormat,
      silent: process.env.NODE_ENV === 'test',
    }),
  ],
});

export type LoggerContext = {
  traceId?: string;
  requestId?: string;
  userId?: string;
  spanId?: string;
  [key: string]: unknown;
};

export const withContext = (context: LoggerContext): Logger => logger.child(context);

