import { createAvatar } from '@dicebear/avatars'
import * as style from '@dicebear/avatars-human-sprites'

const users = []

function getAvatar(username) {
    return createAvatar(style, {
        seed: username,
    })
}

// Join user to chat
export function userJoin(id, username, roomId) {
    const avatar = getAvatar(id)
    // const avatar = getAvatar(username)
    const user = { id, username, roomId, avatar }
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
