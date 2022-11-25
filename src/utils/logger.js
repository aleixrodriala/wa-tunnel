const pino = require('pino');
const pretty = require('pino-pretty');

const { LOGGER_TYPES } = require('../constants');

function logger(message, type = LOGGER_TYPES.INFO, options = {}, args) {
  const stream = pretty({
    colorize: true,
    ...options
  });
  const PinoLogger = pino(stream);

  if (type === LOGGER_TYPES.ERROR) {
    PinoLogger.error(message, args);
    return;
  }

  PinoLogger.info(message, args);
}

exports.logger = logger;
