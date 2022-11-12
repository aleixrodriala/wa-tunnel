
# wa-tunnel - HTTP Tunneling through Whatsapp
 
 This is a [Baileys](https://github.com/adiwajshing/Baileys) based piece of code that lets you tunnel TCP data through two Whatsapp accounts. This can be usable in different situations, for example network carriers that give unlimited whatsapp data or airplanes where you also get unlimited social network data.

 It's using Baileys since it's a WS based multi-device whatsapp library and therefore could be used in android in the future, using Termux for example.

 The idea is to use it with a proxy setup on the server like this: [Client (restricted access) -> Whatsapp -> Server (proxy) -> Internet]

 Apologizes in advance since Javascript it's not one of my primary coding languages :/

 Use only for educational purpose.

# Why?
 While travelling through South America network data on carriers is usually restricted to not many GBs but WhatsApp is usually unlimited, I tried to create this library since I didn't find any usable at the date.
# Setup
 You must have access to two Whatsapp accounts, one for the server and one for the client.

 You can forward a local port or use an external proxy.
## Server side
 Clone the repository on your server and install node dependencies.
1. ``` cd path/to/wa-tunnel ```
2. ``` npm install ```

 Then you can start the server with the following command where **port** is the proxy port and **host** is the proxy host you want to forward. And **number** is the client WhatsApp number with the country code alltogether and without +.

    node server.js host port number

You can use a local proxy server like follows:

    node server.js localhost 3128 12345678901

Or you can use a normal proxy server like follows:

    node server.js 192.168.0.1 3128 12345678901

## Client Side
 Clone the repository on your server and install node dependencies.
1. ``` cd path/to/wa-tunnel ```
2. ``` npm install ```

 Then you can start the server with the following command where **port** is the local port where you will connect and **number** is the server WhatsApp number with the country code alltogether and without +.
 
    node client.js port number
For example

    node client.js 8080 1234567890

## Usage
The first time you open the script Baileys will ask you to scan the QR code with the whatsapp app, after that the session is saved for later usage.

It may crash, that's normal after that just restart the script and you will have your client/server ready!

It splits network packages to not get timed out by WhatsApp, at the moment it's hardcoded in **wasocket.js**, by default it's limited at 20k characters per message, I have done multiple tests and anything below that may get you banned for sending too many messages and any above 80k may timeout. 

Once you have both client and server ready you can test using curl and see the magic happen.

    curl -v -x proxyHost:proxyPort https://httpbin.org/ip

With the example commands would be:

    curl -v -x localhost:8080 https://httpbin.org/ip
It has been tested also with a normal browser like Firefox, it's slow but can be used.


## Disclaimer
Using this library may get your WhatsApp account banned, use with a temporal number or at your own risk.

## TO-DO
- Make an Android script to install node dependencies on termux
- Documentation

## License

[MIT](https://github.com/aleixrodriala/wa-tunnel/blob/master/LICENSE)
