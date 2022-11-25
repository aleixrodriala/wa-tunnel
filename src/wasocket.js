/* eslint-disable prefer-destructuring */
const P = require('pino');
const {
  delay,
  DisconnectReason,
  downloadMediaMessage,
  useSingleFileAuthState
} = require('@adiwajshing/baileys');
const zlib = require('node:zlib');
const { encode, decode } = require('uint8-to-base64');
const makeWASocket = require('@adiwajshing/baileys').default;

const { logger } = require('./utils/logger');
const { splitBuffer, chunkString } = require('./utils/string-utils');
const { STATUS_CODES, LOGGER_TYPES, CHUNKSIZE, DELIMITER } = require('./constants');

const buffer = {};
const socksNumber = {};
const lastBufferNum = {};
const messagesBuffer = {};

// Tested different chunk sizes, over 80k crashes and under 20k it goes faster but you could risk your WA account being banned for sending too many messages.
class Message {
  constructor(statusCode, socksMessageNumber, socketNumber, dataPayload) {
    this.statusCode = statusCode;
    this.dataPayload = dataPayload;
    this.socketNumber = socketNumber;
    this.socksMessageNumber = socksMessageNumber;
  }
}

const sendData = async (waSock, data, socketNumber, remoteNum, filesDisabled) => {
  if (!socksNumber[socketNumber]) {
    socksNumber[socketNumber] = 0;
  }

  const compressedData = encode(data);

  await waSock.presenceSubscribe(remoteNum); // Subscribing in order to send the messages faster

  if (compressedData.length > CHUNKSIZE && !filesDisabled) {
    // If data requires sending more than 1 message, send file if enabled.
    logger(
      `SENDING FILE [${socksNumber[socketNumber]}][${compressedData.length}] -> ${socketNumber}`
    );

    socksNumber[socketNumber] += 1;

    await waSock.sendMessage(remoteNum, {
      document: zlib.brotliCompressSync(data),
      mimetype: 'application/octet-stream',
      fileName: `f-${socksNumber[socketNumber]}-${socketNumber}`
    });
  } else {
    let statusCode;
    const chunks = chunkString(compressedData, CHUNKSIZE); // Splitting string to not get timeout or connection close from Whatsapp.

    for (const [index, chunk] of chunks.entries()) {
      logger(
        `SENDING [${socksNumber[socketNumber]}][${index + 1}/${chunks.length}][${
          chunk.length
        }] -> ${socketNumber}`
      );

      if (chunks.length > 1 && index < chunks.length - 1) {
        statusCode = STATUS_CODES.CACHE;
      } else if (chunks.length > 1) {
        statusCode = STATUS_CODES.END;
      } else {
        statusCode = STATUS_CODES.FULL;
      }
      socksNumber[socketNumber] += 1;

      // Should await sendMessage but gets too slow because syncs messages on both clients

      // eslint-disable-next-line no-await-in-loop
      await waSock.sendMessage(remoteNum, {
        text: `${statusCode}-${socksNumber[socketNumber]}-${socketNumber}-${chunk}`
      });
    }
  }
  await delay(200);
};

// BUFFERING MECHANISM
const processMessage = (message, callback) => {
  const { socketNumber } = message;
  const { statusCode } = message;
  const { dataPayload } = message;
  const { socksMessageNumber } = message;

  logger(`PROCESSING [${socksMessageNumber}] -> ${socketNumber}`);

  if (statusCode === STATUS_CODES.CACHE) {
    logger(`BUFFERING [${socksMessageNumber}] -> ${socketNumber}`);
    if (buffer[socketNumber]) {
      buffer[socketNumber] += dataPayload;
    }
    buffer[socketNumber] = dataPayload;
  } else {
    let multi;
    let decryptedText;

    if (statusCode === STATUS_CODES.END) {
      logger(`CLEARING BUFFER [${socksMessageNumber}] -> ${socketNumber}`);
      decryptedText = decode(buffer[socketNumber] + dataPayload);
      delete buffer[socketNumber];
      multi = true; // use indexOfmulti to split buffer when --disable-files enabled
    }
    if (statusCode === STATUS_CODES.FULL) {
      if (Buffer.isBuffer(dataPayload)) {
        // coming from file
        decryptedText = zlib.brotliDecompressSync(dataPayload);
        multi = false; // use indexOf to split buffer
      } else {
        decryptedText = decode(dataPayload);
        multi = true; // use indexOfmulti to split buffer
      }
    }

    const messages = splitBuffer(decryptedText, DELIMITER, multi);

    logger(`RECIEVING [${messages.length}] MESSAGES -> ${socketNumber}`);

    for (const messageItem of messages) {
      callback(socketNumber, messageItem);
    }
  }

  lastBufferNum[socketNumber] = socksMessageNumber;
  const sockBuffer = messagesBuffer[socketNumber];

  logger(`CHECKING BUFFER [${socksMessageNumber}] -> ${socketNumber}`);

  if (sockBuffer && sockBuffer.length > 0) {
    logger(
      `MESSAGES IN BUFFER [${sockBuffer.length}][${socksMessageNumber}] -> ${socketNumber}`
    );
    if (sockBuffer.length > 1) {
      sockBuffer.sort((a, b) => a.socksMessageNumber - b.socksMessageNumber); // check if sorted is also changed and saved to messagesbuffer or not
    }
    if (sockBuffer[0].socksMessageNumber === lastBufferNum[socketNumber] + 1) {
      const messageBuffed = sockBuffer.shift();
      processMessage(messageBuffed, callback);
    }
  }
};

const startSock = (remoteNum, callback, client) => {
  const { state, saveState } = useSingleFileAuthState(`${client}auth.json`);

  const waSock = makeWASocket({
    logger: P({ level: 'silent' }),
    printQRInTerminal: true,
    auth: state
  });

  waSock.ev.on('messages.upsert', async (m) => {
    const msg = m.messages[0];
    if (!msg.key.fromMe && m.type === 'notify') {
      if (msg.key.remoteJid === remoteNum) {
        if (msg.message) {
          await waSock.readMessages([msg.key]);

          let textThings;
          let statusCode;
          let dataPayload;
          let socketNumber;
          let socksMessageNumber;

          if (msg.message.documentMessage) {
            dataPayload = await downloadMediaMessage(msg, 'buffer');
            textThings = msg.message.documentMessage.fileName.split('-');
            statusCode = textThings[0];
            socketNumber = textThings[2];
            socksMessageNumber = parseInt(textThings[1]);
          } else {
            if (msg.message.extendedTextMessage) {
              const text = msg.message.extendedTextMessage.text;
              textThings = text.split('-');
            } else {
              const text = msg.message.conversation;
              textThings = text.split('-');
            }
            statusCode = textThings[0];
            socksMessageNumber = parseInt(textThings[1]);
            socketNumber = textThings[2];
            dataPayload = textThings[3];
          }

          const message = new Message(
            statusCode,
            socksMessageNumber,
            socketNumber,
            dataPayload
          );

          logger(`RECIEVING [${socksMessageNumber}] -> ${socketNumber}`);

          // Buffering mechanism added in case messages not recieved in the correct order.
          const lastSockMessageNumber = lastBufferNum[socketNumber];
          if (
            (lastSockMessageNumber && socksMessageNumber > lastSockMessageNumber + 1) ||
            (!lastSockMessageNumber && socksMessageNumber !== 1)
          ) {
            logger(`BUFFERING MESSAGE [${socksMessageNumber}] -> ${socketNumber}`);

            if (!messagesBuffer[socketNumber]) {
              messagesBuffer[socketNumber] = [];
            }
            messagesBuffer[socketNumber].push(message);
          } else {
            processMessage(message, callback);
          }
        }
      }
    }
  });

  waSock.ev.on('creds.update', saveState);

  waSock.ev.on('connection.update', (update) => {
    let A;
    let B;
    const { connection } = update;
    const { lastDisconnect } = update;
    if (connection === 'close') {
      if (
        ((B = (A = lastDisconnect.error) === null || A === void 0 ? void 0 : A.output) ===
          null || B === void 0
          ? void 0
          : B.statusCode) !== DisconnectReason.loggedOut
      ) {
        startSock(remoteNum, callback);
      } else {
        logger('connection closed', LOGGER_TYPES.ERROR);
      }
    }
    logger(`connection update ${JSON.stringify(update)}`);
  });
  return waSock;
};

exports.startSock = startSock;
exports.sendData = sendData;
