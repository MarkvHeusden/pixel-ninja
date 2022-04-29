import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import formatMessage from './utils/messages.js'
import { userJoin, getCurrentUser, userLeave, getRoomUsers } from './utils/users.js'

const app = express()
const server = createServer(app)
const io = new Server(server)
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

app.get('/game', (req, res) => {
    res.render('game')
})

app.post('/join-room', (req, res) => {
    res.redirect(`/room/${req.body.roomId}`)
})

io.on('connection', (socket) => {
    socket.on('join-room', (username, roomId) => {
        const user = userJoin(socket.id, username, roomId)
        socket.join(user.roomId)
        socket.emit('new-message', formatMessage(botName, `Welkom ${user.username}`))
        socket.broadcast.to(user.roomId).emit('new-message', formatMessage(botName, `${user.username} joined`))
        io.to(user.roomId).emit('current-users', getRoomUsers(user.roomId))
    })

    socket.on('send-message', (message) => {
        const user = getCurrentUser(socket.id)
        io.to(user.roomId).emit('new-message', formatMessage(user.username, message))
    })

    socket.on('disconnect', () => {
        const user = userLeave(socket.id)
        if (user) {
            io.to(user.roomId).emit('new-message', formatMessage(botName, `${user.username} is weg`))
            io.to(user.roomId).emit('current-users', getRoomUsers(user.roomId))
        }
    })
})

server.listen(port, () => {
    console.log(`http://localhost:${port}`)
})
