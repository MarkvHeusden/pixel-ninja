const usernameInput = document.querySelector('#username-input')
const roomInput = document.querySelector('#room-id')

// View username if in localstorage
if (localStorage.getItem('username')) {
    usernameInput.value = localStorage.getItem('username')
}

// Save username
usernameInput.addEventListener('blur', (e) => {
    const name = e.target.name
    const value = e.target.value
    if (value) {
        localStorage.setItem(name, value)
    }
})

// Limit room input length to 5 numbers
roomInput.oninput = function () {
    if (this.value.length > 5) {
        this.value = this.value.slice(0, 5)
    }
}
