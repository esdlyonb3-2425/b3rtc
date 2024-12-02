const WebSocket = require('ws')
const wss = new WebSocket.Server({port: 8080})

wss.on('connection', (ws) => {
    ws.on('message', (message) => {
        console.log('received', message.toString())

        wss.clients.forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN ) {
                client.send(message.toString())
            }
        })
    })


})

console.log('server started port 8080')