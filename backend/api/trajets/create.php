<?php
require_once '../../config/headers.php';
require_once '../../config/database.php';
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo json_encode(['success' => false, 'message' => 'Méthode non autorisée']); exit; }
$data = json_decode(file_get_contents('php://input'), true);
try {
    $pdo = getDBConnection();
    $zones = is_array($data['zones'] ?? null) ? implode(',', $data['zones']) : ($data['zones'] ?? null);
    $stmt = $pdo->prepare('INSERT INTO trajets (nom, zones, heure_depart_matin_a, heure_arrivee_matin_a, heure_depart_soir_a, heure_arrivee_soir_a, heure_depart_matin_b, heure_arrivee_matin_b, heure_depart_soir_b, heure_arrivee_soir_b) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    $stmt->execute([$data['nom'], $zones, $data['heure_depart_matin_a'] ?? null, $data['heure_arrivee_matin_a'] ?? null, $data['heure_depart_soir_a'] ?? null, $data['heure_arrivee_soir_a'] ?? null, $data['heure_depart_matin_b'] ?? null, $data['heure_arrivee_matin_b'] ?? null, $data['heure_depart_soir_b'] ?? null, $data['heure_arrivee_soir_b'] ?? null]);
    $id = $pdo->lastInsertId();
    $stmt = $pdo->prepare('SELECT * FROM trajets WHERE id = ?');
    $stmt->execute([$id]);
    echo json_encode(['success' => true, 'data' => $stmt->fetch()]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur lors de la création']);
}
?>







