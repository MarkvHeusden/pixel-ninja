import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { gameInterval, createUser, getCurrentUser, userLeave, getRoomUsers } from './utils/users.js'

const app = express()
const server = createServer(app)
export const io = new Server(server)
const port = process.env.PORT || 3002

app.set('view engine', 'ejs')
app.use(express.static('public'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const botName = 'INFO'

app.get('/', (req, res) => {
    res.render('index')
})

app.get('/room/:id', (req, res) => {
    res.render('room', { roomId: req.params.id })
})

app.post('/join-room', (req, res) => {
    res.redirect(`/room/${req.body.roomId}`)
})

io.on('connection', (socket) => {
    socket.on('join-room', (username, roomId, x, y) => {
        const user = createUser(socket.id, username, roomId, x, y)
        const clientsInRoom = io.sockets.adapter.rooms.get(user.roomId)
        const numOfClients = clientsInRoom ? clientsInRoom.size : 0

        // If the room is new, create an game interval to track player positions
        if (numOfClients < 1) {
            gameInterval(roomId)
        }
        socket.join(user.roomId)
        socket.emit('new-message', { username: botName, content: `Welkom ${user.username}` })
        socket.emit('show-character', user.character)
        socket.broadcast.to(user.roomId).emit('new-message', { username: botName, content: `${user.username} joined` })
        io.to(user.roomId).emit('current-users', getRoomUsers(user.roomId))
        // console.log(io.sockets.adapter.rooms.get(user.roomId))
    })

    socket.on('player-moves', (direction) => {
        const movingPlayer = getCurrentUser(socket.id)
        movingPlayer.direction = direction
    })

    socket.on('send-message', (message) => {
        const user = getCurrentUser(socket.id)
        io.to(user.roomId).emit('new-message', { username: user.username, content: message })
    })

    socket.on('disconnect', () => {
        const user = userLeave(socket.id)
        if (user) {
            io.to(user.roomId).emit('new-message', { username: botName, content: `${user.username} is weg` })
            io.to(user.roomId).emit('current-users', getRoomUsers(user.roomId))
        }
    })
})

server.listen(port, () => {
    console.log(`http://localhost:${port}`)
})
