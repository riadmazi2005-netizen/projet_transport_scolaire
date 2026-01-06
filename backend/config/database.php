<?php
// Configuration de la base de données pour XAMPP
// Par défaut, XAMPP utilise root sans mot de passe
define('DB_HOST', 'localhost');

define('DB_NAME', 'transport_scolaire');
define('DB_USER', 'root');
define('DB_PASS', ''); // Modifiez si vous avez un mot de passe MySQL

/**
 * Connexion à la base de données MySQL
 */
function getDBConnection() {
    static $pdo = null;
    
    if ($pdo === null) {
        try {
            $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4";
            $pdo = new PDO($dsn, DB_USER, DB_PASS, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
                PDO::ATTR_TIMEOUT => 5
            ]);
        } catch(PDOException $e) {
            error_log('Erreur de connexion à la base de données: ' . $e->getMessage());
            // Ne pas envoyer de réponse ici, laisser les fichiers API gérer l'erreur
            // pour éviter les réponses JSON multiples
            throw $e; // Relancer l'exception pour que les fichiers avec try-catch puissent la gérer
        }
    }
    
    return $pdo;
}
?>

