<?php
// Headers pour les requêtes CORS
// IMPORTANT: Ces headers doivent être envoyés AVANT toute sortie (echo, print, etc.)

// Gérer les requêtes OPTIONS (preflight CORS) EN PREMIER
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    // Headers pour la requête preflight
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
    header('Access-Control-Max-Age: 86400'); // Cache preflight pour 24 heures
    http_response_code(200);
    exit;
}

// Headers pour les requêtes normales (après preflight)
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Content-Type: application/json; charset=UTF-8');



