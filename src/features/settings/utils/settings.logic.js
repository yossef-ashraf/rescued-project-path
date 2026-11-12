export function validateEmail(email = '') {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function validateUsername(username = '') {
    return /^[a-zA-Z0-9_-]{3,30}$/.test(username.trim());
}
