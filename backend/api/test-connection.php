<?php
/**
 * Fichier de test pour vérifier la connexion API
 * Accès: http://localhost/backend/api/test-connection.php
 */

require_once '../config/headers.php';

echo json_encode([
    'success' => true,
    'message' => 'API backend accessible',
    'timestamp' => date('Y-m-d H:i:s'),
    'server' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown',
    'method' => $_SERVER['REQUEST_METHOD'] ?? 'Unknown',
    'headers_received' => getallheaders()
], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
?>

