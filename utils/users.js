import { io } from '../server.js'

const users = []
const characters = [
    'DarkNinja',
    'GreenNinja',
    'RedSamurai',
    'BlueSamurai',
    'Caveman',
    'Eskimo',
    'Noble',
    'Cavegirl',
    'GrayNinja',
    'Princess',
    'Skeleton',
    'OldMan',
]

// Limits
const leftLimit = 10
const rightLimit = 385
const topLimit = 70
const bottomLimit = 240

const speed = 2
const directions = {
    up: 'up',
    down: 'down',
    left: 'left',
    right: 'right',
}

export function gameInterval(roomId) {
    const interval = setInterval(() => {
        const roomUsers = getRoomUsers(roomId)
        placeCharacters(roomUsers)

        // Clear interval if no players left
        if (roomUsers.length < 1) clearInterval(interval)

        io.to(roomId).emit('update-players', roomUsers)
    }, 1000 / 30)
}

function placeCharacters(roomUsers) {
    roomUsers.forEach((user) => {
        if (user.direction) {
            if (user.direction === directions.right) user.x += speed
            if (user.direction === directions.left) user.x -= speed
            if (user.direction === directions.down) user.y += speed
            if (user.direction === directions.up) user.y -= speed
        }

        if (user.x < leftLimit) user.x = leftLimit
        if (user.x > rightLimit) user.x = rightLimit
        if (user.y < topLimit) user.y = topLimit
        if (user.y > bottomLimit) user.y = bottomLimit
    })
}

// Get characters from API
function fetchCharacters() {
    return fetch('http://localhost:5500/')
        .then((response) => response.json())
        .then((data) => {
            return data
        })
        .catch((err) => {
            console.log(err)
        })
}

// Join user to chat
export function createUser(id, username, roomId, x, y) {
    // const characters = fetchCharacters()
    // Get an unused character. If every character is used get random character
    const usedCharacters = getRoomUsers(roomId).map((user) => user.character)
    const unusedCharacters = characters.filter((character) => !usedCharacters.includes(character))
    const character = unusedCharacters[0] ? unusedCharacters[0] : characters[Math.floor(Math.random() * characters.length)]
    const user = { id, username, roomId, character, x, y }
    users.push(user)
    return user
}

// Get current user
export function getCurrentUser(id) {
    return users.find((user) => user.id === id)
}

// User leaves chat
export function userLeave(id) {
    const index = users.findIndex((user) => user.id === id)

    if (index !== -1) {
        return users.splice(index, 1)[0]
    }
}

// Get room users
export function getRoomUsers(roomId) {
    return users.filter((user) => user.roomId === roomId)
}
