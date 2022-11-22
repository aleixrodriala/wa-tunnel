const pino = require('pino');
const pretty = require('pino-pretty');

const { LOGGER_TYPES } = require('../constants/logger-types');

function logger(message, type = LOGGER_TYPES.INFO, options = {}) {
  const stream = pretty({
    colorize: true,
    ...options
  });
  const PinoLogger = pino(stream);

  if (type === LOGGER_TYPES.ERROR) {
    PinoLogger.error(message);
    return;
  }

  PinoLogger.info(message);
}

exports.logger = logger;
