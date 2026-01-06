<?php
// Configuration de la base de données pour XAMPP
// Par défaut, XAMPP utilise root sans mot de passe
define('DB_HOST', 'localhost');
define('DB_PORT', '3307'); // Port MySQL (3306 par défaut, 3307 si changé dans XAMPP)
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
            $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=utf8mb4";
            $pdo = new PDO($dsn, DB_USER, DB_PASS, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
                PDO::ATTR_TIMEOUT => 5
            ]);
        } catch(PDOException $e) {
            error_log('Erreur de connexion à la base de données: ' . $e->getMessage());
            // Si headers déjà envoyés, on ne peut pas envoyer de réponse HTTP
            if (!headers_sent()) {
                http_response_code(500);
                header('Content-Type: application/json');
                echo json_encode([
                    'success' => false,
                    'message' => 'Erreur de connexion à la base de données. Vérifiez que la base de données existe et que XAMPP est démarré.'
                ]);
            }
            throw $e; // Relancer l'exception pour que les fichiers avec try-catch puissent la gérer
        }
    }
    
    return $pdo;
}
?>

