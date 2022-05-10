const socket = io('/')

// Username & roomId
const roomId = window.location.pathname.replace('/room/', '')
const username = localStorage.getItem('username') || 'Anoniem'

// Chat elements
const chatForm = document.querySelector('#chat-form')
const chatList = document.querySelector('.chat-list')
const chatInput = document.querySelector('#message')

// Game elements
let pixelSize = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--pixel-size'))
const character = document.querySelector('#my-character')
const map = document.querySelector('.map')
let otherPlayers = []

// // Walls
const leftLimit = 10
const rightLimit = 385
const topLimit = 70
const bottomLimit = 240

// // Starting postion
let x = Math.floor(Math.random() * (rightLimit - leftLimit) + leftLimit)
let y = Math.floor(Math.random() * (bottomLimit - topLimit) + topLimit)
let heldDirections = [] // State of which arrow keys we are holding down
const speed = 1

/* Direction key state */
const directions = {
    up: 'up',
    down: 'down',
    left: 'left',
    right: 'right',
}

const keys = {
    ArrowUp: directions.up,
    w: directions.up,
    ArrowLeft: directions.left,
    a: directions.left,
    ArrowRight: directions.right,
    d: directions.right,
    ArrowDown: directions.down,
    s: directions.down,
}

// Join room
socket.emit('join-room', username, roomId, x, y)

// Get unique character
socket.on('show-character', (characterName) => {
    const mySprite = character.querySelector('.character_spritesheet')
    mySprite.style.backgroundImage = `url(/img/characters/${characterName}/SpriteSheet.png`
})

// Display current users
socket.on('current-users', (users) => {
    outputUserList(users)
    outputPlayers(users)
})

// Message event
socket.on('new-message', (message) => {
    createMessage(message)
    chatList.scrollTop = chatList.scrollHeight
})

// Update player positions
socket.on('update-players', (players) => {
    otherPlayers = players.filter((user) => user.id !== socket.id)
})

// Send chat input
function sendMessage(e) {
    e.preventDefault()

    const message = e.target.elements.message.value
    if (message.length > 0) {
        socket.emit('send-message', message)
        e.target.elements.message.value = ''
        e.target.elements.message.focus()
    }
}

// Create chat message
function createMessage(message) {
    const chatTemplate = document.querySelector('.chat-template')
    const chatClone = chatTemplate.content.cloneNode(true)
    const sender = chatClone.querySelector('.chat-sender')
    const content = chatClone.querySelector('.chat-content')
    sender.textContent = `${message.username}: `
    content.textContent = message.content
    chatList.appendChild(chatClone)
}

// Add active users
function outputUserList(users) {
    const userList = document.querySelector('.user-list')
    const userLenght = document.querySelector('#user-count')
    const userTemplate = document.querySelector('.user-template')
    userLenght.textContent = `(${users.length})`
    userList.innerHTML = ''
    users.forEach((user) => {
        const userClone = userTemplate.content.cloneNode(true)
        const img = userClone.querySelector('img')
        const name = userClone.querySelector('span')
        img.src = `/img/characters/${user.character}/Faceset.png`
        name.textContent = user.username
        userList.appendChild(userClone)
    })
}

function outputPlayers(users) {
    const playerElements = document.querySelectorAll('.players')
    playerElements.forEach((player) => player.remove())
    const otherPlayers = users.filter((user) => user.id !== socket.id)
    otherPlayers.forEach((user) => {
        const characterTemplate = document.querySelector('.character-template')
        const characterClone = characterTemplate.content.cloneNode(true)
        const characterContainer = characterClone.querySelector('.character')
        const spritesheet = characterClone.querySelector('.character_spritesheet')
        spritesheet.style.backgroundImage = `url(/img/characters/${user.character}/SpriteSheet.png`
        characterContainer.style.transform = `translate3d( ${user.x * pixelSize}px, ${user.y * pixelSize}px, 0 )`
        characterContainer.id = user.id
        map.appendChild(characterClone)
    })
}

function placeCharacter() {
    const heldDirection = heldDirections[0]
    if (heldDirection) {
        if (heldDirection === directions.right) {
            x += speed
        }
        if (heldDirection === directions.left) {
            x -= speed
        }
        if (heldDirection === directions.down) {
            y += speed
        }
        if (heldDirection === directions.up) {
            y -= speed
        }
        character.setAttribute('facing', heldDirection)
    }
    character.setAttribute('walking', heldDirection ? 'true' : 'false')

    if (x < leftLimit) {
        x = leftLimit
    }
    if (x > rightLimit) {
        x = rightLimit
    }
    if (y < topLimit) {
        y = topLimit
    }
    if (y > bottomLimit) {
        y = bottomLimit
    }

    // work in progress, kijken naar map grootte ipv window??
    const camera_left = pixelSize * (window.innerWidth / 13) + 110
    const camera_top = pixelSize * 65

    map.style.transform = `translate3d( ${-x * pixelSize + camera_left}px, ${-y * pixelSize + camera_top}px, 0 )`
    character.style.transform = `translate3d( ${x * pixelSize}px, ${y * pixelSize}px, 0 )`

    placeOtherCharacters()
}

function placeOtherCharacters() {
    otherPlayers.forEach((player) => {
        const playerElement = document.getElementById(player.id)
        if (player.direction) {
            playerElement.setAttribute('facing', player.direction)
        }
        playerElement.setAttribute('walking', player.direction ? 'true' : 'false')
        playerElement.style.transform = `translate3d( ${player.x * pixelSize}px, ${player.y * pixelSize}px, 0 )`
    })
}

//Set up the game loop
function game() {
    placeCharacter()
    window.requestAnimationFrame(() => {
        game()
    })
}
game()

// Listen to chat messages
chatForm.addEventListener('submit', sendMessage)

document.addEventListener('keydown', (e) => {
    const direction = keys[e.key]
    if (direction && heldDirections.indexOf(direction) === -1 && e.target !== chatInput) {
        heldDirections.unshift(direction)
        socket.emit('player-moves', heldDirections[0])
    }
})

document.addEventListener('keyup', (e) => {
    const direction = keys[e.key]
    const index = heldDirections.indexOf(direction)
    if (index > -1) {
        heldDirections.splice(index, 1)
        socket.emit('player-moves', heldDirections[0])
    }
})

/* Dpad functionality for mouse and touch */
let isPressed = false
const removePressedAll = () => {
    document.querySelectorAll('.dpad-button').forEach((d) => {
        d.classList.remove('pressed')
    })
}

document.body.addEventListener('mousedown', () => {
    isPressed = true
})

document.body.addEventListener('mouseup', () => {
    isPressed = false
    heldDirections = []
    removePressedAll()
})

const handleDpadPress = (direction, click) => {
    if (click) {
        isPressed = true
    }
    heldDirections = isPressed ? [direction] : []

    if (isPressed) {
        removePressedAll()
        document.querySelector('.dpad-' + direction).classList.add('pressed')
    }
}

window.addEventListener('resize', () => {
    pixelSize = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--pixel-size'))
})

// Arrow button events
document.querySelector('.dpad-left').addEventListener('touchstart', () => handleDpadPress(directions.left, true))
document.querySelector('.dpad-up').addEventListener('touchstart', () => handleDpadPress(directions.up, true))
document.querySelector('.dpad-right').addEventListener('touchstart', () => handleDpadPress(directions.right, true))
document.querySelector('.dpad-down').addEventListener('touchstart', () => handleDpadPress(directions.down, true))

document.querySelector('.dpad-left').addEventListener('mousedown', () => handleDpadPress(directions.left, true))
document.querySelector('.dpad-up').addEventListener('mousedown', () => handleDpadPress(directions.up, true))
document.querySelector('.dpad-right').addEventListener('mousedown', () => handleDpadPress(directions.right, true))
document.querySelector('.dpad-down').addEventListener('mousedown', () => handleDpadPress(directions.down, true))