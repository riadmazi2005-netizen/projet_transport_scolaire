<?php
require_once '../../config/headers.php';
require_once '../../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

try {
    $pdo = getDBConnection();
    
    if (!isset($data['chauffeur_id']) || !isset($data['bus_id']) || !isset($data['date']) || !isset($data['periode'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Données incomplètes']);
        exit;
    }
    
    $stmt = $pdo->prepare('
        INSERT INTO rapports_trajet (chauffeur_id, bus_id, date, periode, heure_depart_reelle, heure_arrivee_reelle, nombre_eleves, kilometres_parcourus, problemes, observations, statut)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ');
    
    $stmt->execute([
        $data['chauffeur_id'],
        $data['bus_id'],
        $data['date'],
        $data['periode'],
        $data['heure_depart_reelle'] ?? null,
        $data['heure_arrivee_reelle'] ?? null,
        $data['nombre_eleves'] ?? 0,
        $data['kilometres_parcourus'] ?? null,
        $data['problemes'] ?? null,
        $data['observations'] ?? null,
        'termine'
    ]);
    
    $id = $pdo->lastInsertId();
    $stmt = $pdo->prepare('SELECT * FROM rapports_trajet WHERE id = ?');
    $stmt->execute([$id]);
    $rapport = $stmt->fetch(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'data' => $rapport
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur: ' . $e->getMessage()]);
}



