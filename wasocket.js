const P = require('pino')
const { delay, DisconnectReason, useSingleFileAuthState, MessageType, downloadMediaMessage } = require('@adiwajshing/baileys')
const makeWASocket = require('@adiwajshing/baileys').default
const {encode, decode} = require('uint8-to-base64');
const {chunkString, splitBuffer} = require('./utils.js')
const zlib = require('node:zlib');

const buffer = {}
const lastBufferNum = {}
const messagesBuffer = {}
const socksNumber = {}

//Tested different chunk sizes, over 80k crashes and under 20k it goes faster but you could risk your WA account being banned for sending too many messages.
const CHUNKSIZE = 20000;
const DELIMITER = new Uint8Array([255,255,255,255,255]);


class Message {
  constructor(statusCode, socksMessageNumber, socketNumber, dataPayload) {
    this.statusCode = statusCode;
    this.socksMessageNumber = socksMessageNumber;
    this.socketNumber = socketNumber;
    this.dataPayload = dataPayload;
  }
}

const sendData = async(waSock, data, socketNumber, remoteNum, filesDisabled) => {
    if (!socksNumber[socketNumber]) socksNumber[socketNumber] = 0;

    var compressed_s = encode(data);

    await waSock.presenceSubscribe(remoteNum) //Subscribing in order to send the messages faster

    if((compressed_s.length > CHUNKSIZE) && !filesDisabled){ // If data requires sending more than 1 message, send file if enabled.
        console.log(`SENDING FILE [${socksNumber[socketNumber]}][${compressed_s.length}] -> ${socketNumber}`);
        
        socksNumber[socketNumber] += 1;
        
        await waSock.sendMessage(
            remoteNum,
            {
                document: zlib.brotliCompressSync(data),
                mimetype: "application/octet-stream",
                fileName: `f-${socksNumber[socketNumber]}-${socketNumber}`
            }
        )
    }
    else{
        var chunks = chunkString(compressed_s, CHUNKSIZE); // Splitting string to not get timeout or connection close from Whatsapp.

        var statusCode;

        for (const [index, chunk] of chunks.entries()) {
            console.log(`SENDING [${socksNumber[socketNumber]}][${(index+1)}/${chunks.length}][${chunk.length}] -> ${socketNumber}`);

            if (chunks.length > 1 && index < (chunks.length-1)){
                statusCode = "c" //Cache (chunk)
            }
            else if (chunks.length > 1){
                statusCode = "e" //End (last chunk)
            }
            else{
                statusCode = "f" //Full (no chunks)
            }
            socksNumber[socketNumber] += 1;

            // Should await sendMessage but gets too slow because syncs messages on both clients

            await waSock.sendMessage(remoteNum, { text: `${statusCode}-${socksNumber[socketNumber]}-${socketNumber}-${chunk}`})
        }
    }
    await delay(200)
}

//BUFFERING MECHANISM
const processMessage = (message, callback) => {
    var socketNumber = message.socketNumber;
    var statusCode = message.statusCode;
    var dataPayload = message.dataPayload;
    var socksMessageNumber = message.socksMessageNumber;

    console.log(`PROCESSING [${socksMessageNumber}] -> ${socketNumber}`);

    if (statusCode == "c"){
        console.log(`BUFFERING [${socksMessageNumber}] -> ${socketNumber}`);
        if (buffer[socketNumber]) buffer[socketNumber] += dataPayload
        else buffer[socketNumber] = dataPayload
        
    }
    else{
        if (statusCode == "e"){
            console.log(`CLEARING BUFFER [${socksMessageNumber}] -> ${socketNumber}`);
            var decryptedText = decode(buffer[socketNumber] + dataPayload);
            delete buffer[socketNumber];
            multi = true; //use indexOfmulti to split buffer when --disable-files enabled
        }
        else if (statusCode == "f"){
            if (Buffer.isBuffer(dataPayload)) { //coming from file
                var decryptedText = zlib.brotliDecompressSync(dataPayload);
                var multi = false; //use indexOf to split buffer
            }
            else {
                var decryptedText = decode(dataPayload);
                var multi = true; //use indexOfmulti to split buffer
            } 
        }

        var messages = splitBuffer(decryptedText, DELIMITER, multi);

        console.log(`RECIEVING [${messages.length}] MESSAGES -> ${socketNumber}`)

        for (const message of messages){
            callback(socketNumber, message);
        }
    }

    lastBufferNum[socketNumber] = socksMessageNumber;
    var sockBuffer = messagesBuffer[socketNumber];

    console.log(`CHECKING BUFFER [${socksMessageNumber}] -> ${socketNumber}`)

    if (sockBuffer && sockBuffer.length > 0){
        console.log(`MESSAGES IN BUFFER [${sockBuffer.length}][${socksMessageNumber}] -> ${socketNumber}`)
        if (sockBuffer.length > 1){
            sockBuffer.sort((a, b) => a.socksMessageNumber - b.socksMessageNumber); //check if sorted is also changed and saved to messagesbuffer or not
        }
        if (sockBuffer[0].socksMessageNumber == (lastBufferNum[socketNumber] + 1)){
            var messageBuffed = sockBuffer.shift();
            processMessage(messageBuffed, callback);
        }
    }
} 

const startSock = (remoteNum, callback, client) => {
    const { state, saveState } = useSingleFileAuthState(`${client}auth.json`)

    const waSock = makeWASocket({
        logger: P({ level: 'silent' }),
        printQRInTerminal: true,
        auth: state,
    });

    waSock.ev.on('messages.upsert', async m => {
        const msg = m.messages[0]
        if(!msg.key.fromMe && m.type === 'notify') {
            if (msg.key.remoteJid == remoteNum){
                if (msg.message){
                    await waSock.readMessages([msg.key]);

                    if (msg.message.documentMessage){
                        var dataPayload = await downloadMediaMessage(
                            msg,
                            'buffer'
                        )
                        var text_things = msg.message.documentMessage.fileName.split('-');
                        var statusCode = text_things[0];
                        var socksMessageNumber = parseInt(text_things[1]);
                        var socketNumber = text_things[2];
                    }
                    
                    else {
                        if (msg.message.extendedTextMessage){
                            var text = msg.message.extendedTextMessage.text;
                        }
                        else{
                            var text = msg.message.conversation;
                        }

                        var text_things = text.split('-');
                        var statusCode = text_things[0];
                        var socksMessageNumber = parseInt(text_things[1]);
                        var socketNumber = text_things[2];
                        var dataPayload = text_things[3];
                    }

                    var message = new Message(statusCode, socksMessageNumber, socketNumber, dataPayload);
                    
                    console.log(`RECIEVING [${socksMessageNumber}] -> ${socketNumber}`);

                    var lastSockMessageNumber = lastBufferNum[socketNumber];

                    //Buffering mechanism added in case messages not recieved in the correct order.

                    if ((lastSockMessageNumber && (socksMessageNumber > (lastSockMessageNumber + 1))) || (!lastSockMessageNumber && socksMessageNumber != 1)){
                        console.log(`BUFFERING MESSAGE [${socksMessageNumber}] -> ${socketNumber}`);
                        if (!messagesBuffer[socketNumber]) messagesBuffer[socketNumber] = [];
                        messagesBuffer[socketNumber].push(message);
                    }
                    else{
                        processMessage(message, callback)
                    }
            
                }
            }
        }
    })

    waSock.ev.on('creds.update', saveState)

    waSock.ev.on('connection.update', function (update) {
        let _a, _b;
        let connection = update.connection, lastDisconnect = update.lastDisconnect;
        if (connection === 'close') {
            if (((_b = (_a = lastDisconnect.error) === null || _a === void 0 ? void 0 : _a.output) === null || _b === void 0 ? void 0 : _b.statusCode) !== DisconnectReason.loggedOut) {
                startSock(remoteNum, callback)
            }
            else {
                console.log('connection closed');
            }
        }
        console.log('connection update', update);
    });
    return waSock
}

exports.startSock = startSock;
exports.sendData = sendData;
