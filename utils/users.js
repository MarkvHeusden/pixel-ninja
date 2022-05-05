// import { createAvatar } from '@dicebear/avatars'
// import * as style from '@dicebear/avatars-human-sprites'
// import * as style from '@dicebear/pixel-art-neutral'

const users = []
const characters = [
    'Noble',
    'OldMan',
    'BlueSamurai',
    'Cavegirl',
    'Caveman',
    'DarkNinja',
    'Eskimo',
    'GrayNinja',
    'GreenNinja',
    'Princess',
    'RedSamurai',
    'Skeleton',
]

// function getAvatar(username) {
//     return createAvatar(style, {
//         seed: username,
//     })
// }

// Join user to chat
export function userJoin(id, username, roomId, x, y) {
    // Get unique character. If too many users get random character
    const character =
        users.length < characters.length ? characters[users.length] : characters[Math.floor(Math.random() * characters.length)]
    const user = { id, username, roomId, character, x, y }
    console.log(user)
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
