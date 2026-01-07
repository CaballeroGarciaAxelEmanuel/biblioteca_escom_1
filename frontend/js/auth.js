// frontend/js/auth.js
class AuthService {
    static isAuthenticated() {
        return localStorage.getItem('user') !== null;
    }
    
    static getUser() {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    }
    
    static isAdmin() {
        const user = this.getUser();
        return user && user.rol === 'ADMIN';
    }
    
    static isBibliotecario() {
        const user = this.getUser();
        return user && user.rol === 'BIBLIOTECARIO';
    }
    
    static logout() {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        window.location.href = 'index.html';
    }
    
    static requireAuth() {
        if (!this.isAuthenticated()) {
            window.location.href = 'index.html';
            return false;
        }
        return true;
    }
    
    static requireAdmin() {
        if (!this.isAuthenticated() || !this.isAdmin()) {
            window.location.href = 'index.html';
            return false;
        }
        return true;
    }
}