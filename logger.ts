import winston from "winston";
import path from "path";

const filename = path.basename(__filename);

const { combine, colorize, simple } = winston.format;

//   error: 0
//   warn: 1
//   info: 2
//   http: 3
//   verbose: 4
//   debug: 5
//   silly: 6

const loggerLevel = "debug";

export const logger = winston.createLogger({
  level: loggerLevel, //	Log only if log level is less than or equal to this level
  format: combine(colorize(), simple()),
  transports: [new winston.transports.Console()],
});

logger.info(`${filename} - Logger started at level: ${loggerLevel}`);
