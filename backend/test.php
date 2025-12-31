<?php
/**
 * Fichier de test pour vérifier que le backend est accessible
 * Accès: http://localhost/backend/test.php
 */

require_once 'config/headers.php';

// Test de connexion à la base de données
try {
    require_once 'config/database.php';
    $pdo = getDBConnection();
    
    echo json_encode([
        'success' => true,
        'message' => 'Backend accessible et base de données connectée',
        'backend_path' => __DIR__,
        'php_version' => PHP_VERSION,
        'server' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown',
        'method' => $_SERVER['REQUEST_METHOD'] ?? 'Unknown'
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Erreur de connexion à la base de données',
        'error' => $e->getMessage(),
        'backend_path' => __DIR__,
        'php_version' => PHP_VERSION
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
}
?>

