module.exports = Object.freeze({
  LOGGER_TYPES: {
    INFO: 'INFO',
    ERROR: 'ERROR'
  },
  STATUS_CODES: {
    END: 'e',
    FULL: 'f',
    CACHE: 'c'
  },
  CHUNKSIZE: 20000,
  DELIMITER: new Uint8Array([255, 255, 255, 255, 255])
});
