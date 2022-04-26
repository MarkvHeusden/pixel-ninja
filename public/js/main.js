const socket = io('/')

// Username & roomId
const roomId = window.location.pathname.replace('/room/', '')
const username = localStorage.getItem('username') || 'Anoniem'

const chatForm = document.querySelector('#chat-form')
const chatList = document.querySelector('.chat-list')

// Join room
socket.emit('join-room', username, roomId)

// Current users
socket.on('current-users', (users) => {
    outputUsers(users)
})

// Message event
socket.on('new-message', (message) => {
    createMessage(message)
    chatList.scrollTop = chatList.scrollHeight
})

// Create chat message
function createMessage(message) {
    const listItem = document.createElement('li')
    const messageSender = document.createElement('span')
    const messageContent = document.createElement('span')
    messageSender.innerText = message.username + ': '
    messageContent.innerText = message.content
    listItem.appendChild(messageSender)
    listItem.appendChild(messageContent)
    // listItem.innerText = message.content
    listItem.classList.add('chat-message')
    chatList.appendChild(listItem)
}

// Add active users
function outputUsers(users) {
    const userList = document.querySelector('.user-list')
    const userLenght = document.querySelector('#user-count')
    userLenght.innerHTML = `(${users.length})`
    userList.innerHTML = ''
    users.forEach((user) => {
        const li = document.createElement('li')
        li.innerHTML = user.avatar
        li.innerHTML += user.username
        userList.appendChild(li)
    })
}

// Chat input
chatForm.addEventListener('submit', (e) => {
    e.preventDefault()

    const message = e.target.elements.message.value
    if (message.length > 0) {
        socket.emit('send-message', message)
        e.target.elements.message.value = ''
        e.target.elements.message.focus()
    }
})
