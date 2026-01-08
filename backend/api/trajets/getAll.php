<?php
require_once '../../config/headers.php';
require_once '../../config/database.php';
$pdo = getDBConnection();
$stmt = $pdo->query('SELECT * FROM trajets ORDER BY date_creation DESC');
$trajets = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Décoder le JSON des zones pour chaque trajet
foreach ($trajets as &$trajet) {
    if (isset($trajet['zones']) && is_string($trajet['zones'])) {
        // Essayer de décoder le JSON
        $decoded = json_decode($trajet['zones'], true);
        if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
            $trajet['zones'] = $decoded;
        } else {
            // Si ce n'est pas du JSON valide, traiter comme une liste séparée par des virgules
            $trajet['zones'] = array_map('trim', explode(',', $trajet['zones']));
        }
    }
}

echo json_encode(['success' => true, 'data' => $trajets]);








