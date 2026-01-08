<?php
require_once '../../config/headers.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée']);
    exit;
}

echo json_encode([
    'success' => true,
    'message' => 'Déconnexion réussie'
]);









