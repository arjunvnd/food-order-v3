import { createLogger, format, transports } from 'winston';

const { combine, timestamp, colorize, printf, errors } = format;

const devFormat = printf(({ level, message, timestamp, stack }) => {
  return stack
    ? `${timestamp} [${level}]: ${message}\n${stack}`
    : `${timestamp} [${level}]: ${message}`;
});

const logger = createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'HH:mm:ss' }),
    colorize(),
    devFormat,
  ),
  transports: [new transports.Console()],
});

export default logger;
