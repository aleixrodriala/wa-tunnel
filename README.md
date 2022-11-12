
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

 Then you can start the server with the following command where **port** is the proxy port and **host** is the proxy host you want to forward. And **number** is the client WhatsApp number.

    node server.js host port number

## Client Side
 Clone the repository on your server and install node dependencies.
1. ``` cd path/to/wa-tunnel ```
2. ``` npm install ```

 Then you can start the server with the following command where **port** is the local port where you will connect and **number** is the server WhatsApp number.
 
    node client.js port number
    
## Usage
The first time you open the script Baileys will ask you to scan the QR code with the whatsapp app, after that the session is saved for later usage.

It may crash, that's normal after that just restart the script and you will have your client/server ready!

Once you have both client and server ready you can test using curl and see the magic happen.

    curl -v -x proxyHost:proxyPort https://httpbin.org/ip

It has been tested also with a normal browser, it's slow but can be used.

## TO-DO
-Make an Android script to install node dependencies on termux
-Documentation

## License

[MIT](https://github.com/aleixrodriala/wa-tunnel/blob/master/LICENSE)
