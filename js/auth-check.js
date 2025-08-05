// Passwort-Schutz für alle Seiten außer Login
(function() {
    // Nur ausführen wenn nicht auf der Login-Seite
    if (!window.location.pathname.includes('login.html')) {
        const sessionKey = 'seifert_auth';
        
        // Prüfen ob bereits authentifiziert
        if (!sessionStorage.getItem(sessionKey)) {
            // Zur Login-Seite weiterleiten
            window.location.href = 'login.html';
            return;
        }
    }
})();