import winston from "winston";

const { combine, colorize, simple } = winston.format;

//   error: 0
//   warn: 1
//   info: 2
//   http: 3
//   verbose: 4
//   debug: 5
//   silly: 6

export const logger = winston.createLogger({
  level: "debug", //	Log only if log level is less than or equal to this level
  format: combine(colorize(), simple()),
  transports: [new winston.transports.Console()],
});

logger.info("Logger started");
