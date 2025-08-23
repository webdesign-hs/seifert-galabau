<?php
/**
 * Kontaktformular-Handler
 * DSGVO-konform: Keine Speicherung personenbezogener Daten
 */

// === KONFIGURATION ===
define('MAIL_TO', 'kontakt@seifert-galabau.de'); // Empfänger-E-Mail
define('MAIL_FROM', 'noreply@seifert-galabau.de'); // Absender (domainkonform für SPF/DMARC)
define('MAIL_SUBJECT_PREFIX', '[Website-Kontakt]'); // Betreff-Präfix

// === INITIALISIERUNG ===
session_start();
header('Content-Type: application/json; charset=utf-8');
header('Referrer-Policy: no-referrer');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');

// Nur POST erlauben
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit(json_encode(['ok' => false, 'error' => 'Methode nicht erlaubt.']));
}

// === RATE LIMITING (Session-basiert) ===
$now = time();
if (!isset($_SESSION['form_submissions'])) {
    $_SESSION['form_submissions'] = [];
}

// Alte Einträge entfernen (älter als 10 Minuten)
$_SESSION['form_submissions'] = array_filter($_SESSION['form_submissions'], function($ts) use ($now) {
    return ($now - $ts) < 600;
});

// Prüfung: Max. 3 Anfragen in 10 Minuten
if (count($_SESSION['form_submissions']) >= 3) {
    http_response_code(429);
    exit(json_encode(['ok' => false, 'error' => 'Zu viele Anfragen. Bitte später erneut versuchen.']));
}

// === EINGABEN SAMMELN ===
$kundentyp = $_POST['customer-type'] ?? '';
$companyName = $_POST['company-name'] ?? '';
$name = $_POST['name'] ?? '';
$email = $_POST['email'] ?? '';
$telefon = $_POST['phone'] ?? '';
$nachricht = $_POST['message'] ?? '';
$privacy = $_POST['privacy'] ?? '';
$company = $_POST['company'] ?? ''; // Honeypot
$ts = $_POST['ts'] ?? 0;

// === HONEYPOT-CHECK ===
if (!empty($company)) {
    // Bot erkannt - still mit Erfolg antworten
    http_response_code(200);
    exit(json_encode(['ok' => true]));
}

// === ZEITPRÜFUNG (Anti-Bot) ===
if (!is_numeric($ts) || ($now * 1000 - intval($ts)) < 3000) {
    http_response_code(400);
    exit(json_encode(['ok' => false, 'error' => 'Bitte Eingaben prüfen.']));
}

// === VALIDIERUNG ===
$errors = [];

// Kundentyp
if (!in_array($kundentyp, ['privat', 'gewerbe'])) {
    $errors['customer-type'] = 'Bitte Kundentyp auswählen.';
}

// Firmenname (nur bei Gewerbekunden erforderlich)
if ($kundentyp === 'gewerbe') {
    $companyName = trim($companyName);
    $companyName = preg_replace('/\s+/', ' ', $companyName);
    if (strlen($companyName) < 2 || strlen($companyName) > 100) {
        $errors['company-name'] = 'Firmenname muss zwischen 2 und 100 Zeichen lang sein.';
    }
}

// Name
$name = trim($name);
$name = preg_replace('/\s+/', ' ', $name); // Mehrfach-Whitespace zu einem Space
if (strlen($name) < 2 || strlen($name) > 100) {
    $errors['name'] = 'Name muss zwischen 2 und 100 Zeichen lang sein.';
}

// E-Mail
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors['email'] = 'Bitte gültige E-Mail-Adresse eingeben.';
}

// Telefon (optional)
if (!empty($telefon)) {
    $telefon = trim($telefon);
    if (strlen($telefon) > 30 || !preg_match('/^[\d\s\+\(\)\-\.\/]*$/', $telefon)) {
        $errors['phone'] = 'Ungültige Telefonnummer.';
    }
}

// Nachricht
$nachricht = trim($nachricht);
$nachricht = strip_tags($nachricht);
$nachricht = preg_replace("/\r\n|\r|\n/", "\n", $nachricht); // Zeilenumbrüche normalisieren
if (strlen($nachricht) < 10 || strlen($nachricht) > 5000) {
    $errors['message'] = 'Nachricht muss zwischen 10 und 5000 Zeichen lang sein.';
}

// Datenschutz-Checkbox
if (!in_array($privacy, ['on', 'true', '1'], true)) {
    $errors['privacy'] = 'Bitte Datenschutzerklärung akzeptieren.';
}

// Bei Validierungsfehlern
if (!empty($errors)) {
    http_response_code(400);
    exit(json_encode([
        'ok' => false,
        'error' => 'Bitte Eingaben prüfen.',
        'fields' => $errors
    ]));
}

// === E-MAIL VORBEREITEN ===

// Header-Injection verhindern
$safe_email = str_replace(["\r", "\n"], '', $email);
$safe_name = str_replace(["\r", "\n"], '', $name);

// E-Mail-Header
$headers = [
    'From: ' . MAIL_FROM,
    'Reply-To: ' . $safe_email,
    'Content-Type: text/plain; charset=UTF-8',
    'X-Mailer: PHP/' . phpversion()
];

// Betreff
$subject = MAIL_SUBJECT_PREFIX . ' ' . ($kundentyp === 'gewerbe' ? 'Gewerbekunde' : 'Privatkunde') . ' - ' . $safe_name;

// E-Mail-Body (nur Plaintext)
$body = "Neue Kontaktanfrage über die Website\n";
$body .= "=====================================\n\n";
$body .= "Kundentyp: " . ($kundentyp === 'gewerbe' ? 'Gewerbekunde' : 'Privatkunde') . "\n";
if ($kundentyp === 'gewerbe' && !empty($companyName)) {
    $body .= "Firma: " . $companyName . "\n";
}
$body .= "Name: " . $name . "\n";
$body .= "E-Mail: " . $email . "\n";
if (!empty($telefon)) {
    $body .= "Telefon: " . $telefon . "\n";
}
$body .= "\nNachricht:\n";
$body .= "----------\n";
$body .= $nachricht . "\n";
$body .= "\n=====================================\n";
$body .= "Diese E-Mail wurde automatisch über das Kontaktformular der Website versendet.";

// === E-MAIL VERSENDEN ===
$mailSent = mail(
    MAIL_TO,
    $subject,
    $body,
    implode("\r\n", $headers)
);

// === ANTWORT ===
if ($mailSent) {
    // Erfolg - zur Rate-Limit-Liste hinzufügen
    $_SESSION['form_submissions'][] = $now;
    
    http_response_code(200);
    echo json_encode(['ok' => true]);
} else {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Versand nicht möglich. Bitte später erneut versuchen.']);
}