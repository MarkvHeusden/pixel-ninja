const usernameInput = document.querySelector('#usernameInput')

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
