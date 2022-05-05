const socket = io('/')

// Username & roomId
const roomId = window.location.pathname.replace('/room/', '')
const username = localStorage.getItem('username') || 'Anoniem'

// Chat elements
const chatForm = document.querySelector('#chat-form')
const chatList = document.querySelector('.chat-list')
const chatInput = document.querySelector('#message')

// Game elements
const character = document.querySelector('#my-character')
const map = document.querySelector('.map')

// Starting postion
let x = 90
let y = 34
let held_directions = [] // State of which arrow keys we are holding down
const speed = 1 // How fast the character moves in pixels per frame

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

// Create Character
// function createCharacter(username, avatar) {
//     const map = document.querySelector('.map')
//     const characterTemplate = document.querySelector('.character-template')
//     const characterClone = characterTemplate.content.cloneNode(true)
//     // const name = characterClone.querySelector('p')
//     // name.textContent = username
//     map.appendChild(characterClone)
// }

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
    // map.removeChild(players);

    const otherUsers = users.filter((user) => user.id !== socket.id)
    otherUsers.forEach((user) => {
        const characterTemplate = document.querySelector('.character-template')
        const characterClone = characterTemplate.content.cloneNode(true)
        const spritesheet = characterClone.querySelector('.character_spritesheet')
        console.log(spritesheet)
        spritesheet.style.backgroundImage = `url(/img/characters/${user.character}/SpriteSheet.png`
        map.appendChild(characterClone)
    })
}

function placeCharacter() {
    const pixelSize = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--pixel-size'))

    const held_direction = held_directions[0]
    if (held_direction) {
        if (held_direction === directions.right) {
            x += speed
        }
        if (held_direction === directions.left) {
            x -= speed
        }
        if (held_direction === directions.down) {
            y += speed
        }
        if (held_direction === directions.up) {
            y -= speed
        }
        character.setAttribute('facing', held_direction)
    }
    character.setAttribute('walking', held_direction ? 'true' : 'false')

    // Limits (gives the illusion of walls)
    // const leftLimit = 1
    // const rightLimit = 16 * 11 + 15
    // const topLimit = 32
    // const bottomLimit = 16 * 7 + 4
    // if (x < leftLimit) {
    //     x = leftLimit
    // }
    // if (x > rightLimit) {
    //     x = rightLimit
    // }
    // if (y < topLimit) {
    //     y = topLimit
    // }
    // if (y > bottomLimit) {
    //     y = bottomLimit
    // }

    const camera_left = pixelSize * 98
    const camera_top = pixelSize * 65

    map.style.transform = `translate3d( ${-x * pixelSize + camera_left}px, ${-y * pixelSize + camera_top}px, 0 )`
    character.style.transform = `translate3d( ${x * pixelSize}px, ${y * pixelSize}px, 0 )`

    // socket.emit('update-position', { x: x * pixelSize, y: y * pixelSize })
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
    if (direction && held_directions.indexOf(direction) === -1 && e.target !== chatInput) {
        held_directions.unshift(direction)
    }
})

document.addEventListener('keyup', (e) => {
    const direction = keys[e.key]
    const index = held_directions.indexOf(direction)
    if (index > -1) {
        held_directions.splice(index, 1)
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
    // console.log('mouse is down')
    isPressed = true
})
document.body.addEventListener('mouseup', () => {
    // console.log('mouse is up')
    isPressed = false
    held_directions = []
    removePressedAll()
})
const handleDpadPress = (direction, click) => {
    if (click) {
        isPressed = true
    }
    held_directions = isPressed ? [direction] : []

    if (isPressed) {
        removePressedAll()
        document.querySelector('.dpad-' + direction).classList.add('pressed')
    }
}
//Bind a ton of events for the dpad
// document.querySelector('.dpad-left').addEventListener('touchstart', () => handleDpadPress(directions.left, { passive: true }))
// document.querySelector('.dpad-up').addEventListener('touchstart', () => handleDpadPress(directions.up, { passive: true }))
// document.querySelector('.dpad-right').addEventListener('touchstart', () => handleDpadPress(directions.right, { passive: true }))
// document.querySelector('.dpad-down').addEventListener('touchstart', () => handleDpadPress(directions.down, { passive: true }))

// document.querySelector('.dpad-left').addEventListener('mousedown', () => handleDpadPress(directions.left, { passive: true }))
// document.querySelector('.dpad-up').addEventListener('mousedown', () => handleDpadPress(directions.up, { passive: true }))
// document.querySelector('.dpad-right').addEventListener('mousedown', () => handleDpadPress(directions.right, { passive: true }))
// document.querySelector('.dpad-down').addEventListener('mousedown', () => handleDpadPress(directions.down, { passive: true }))

// document.querySelector('.dpad-left').addEventListener('touchstart', () => handleDpadPress(directions.left, true))
// document.querySelector('.dpad-up').addEventListener('touchstart', () => handleDpadPress(directions.up, true))
// document.querySelector('.dpad-right').addEventListener('touchstart', () => handleDpadPress(directions.right, true))
// document.querySelector('.dpad-down').addEventListener('touchstart', () => handleDpadPress(directions.down, true))

document.querySelector('.dpad-left').addEventListener('mousedown', () => handleDpadPress(directions.left, true))
document.querySelector('.dpad-up').addEventListener('mousedown', () => handleDpadPress(directions.up, true))
document.querySelector('.dpad-right').addEventListener('mousedown', () => handleDpadPress(directions.right, true))
document.querySelector('.dpad-down').addEventListener('mousedown', () => handleDpadPress(directions.down, true))

// document.querySelector('.dpad-left').addEventListener('mouseover', () => handleDpadPress(directions.left))
// document.querySelector('.dpad-up').addEventListener('mouseover', () => handleDpadPress(directions.up))
// document.querySelector('.dpad-right').addEventListener('mouseover', () => handleDpadPress(directions.right))
// document.querySelector('.dpad-down').addEventListener('mouseover', () => handleDpadPress(directions.down))
