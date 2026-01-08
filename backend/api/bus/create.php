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
    // Vérifier si le chauffeur est déjà affecté
    if (!empty($data['chauffeur_id'])) {
        $stmt = $pdo->prepare('SELECT id FROM bus WHERE chauffeur_id = ?');
        $stmt->execute([$data['chauffeur_id']]);
        if ($stmt->fetch()) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Ce chauffeur est déjà affecté à un autre bus']);
            exit;
        }
    }
    
    // Vérifier si le responsable est déjà affecté
    if (!empty($data['responsable_id'])) {
        $stmt = $pdo->prepare('SELECT id FROM bus WHERE responsable_id = ?');
        $stmt->execute([$data['responsable_id']]);
        if ($stmt->fetch()) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Ce responsable est déjà affecté à un autre bus']);
            exit;
        }
    }
    
    $stmt = $pdo->prepare('
        INSERT INTO bus (numero, annee_fabrication, capacite, chauffeur_id, responsable_id, trajet_id, statut)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ');
    
    $stmt->execute([
        $data['numero'],
        $data['annee_fabrication'] ?? null,
        $data['capacite'],
        $data['chauffeur_id'] ?? null,
        $data['responsable_id'] ?? null,
        $data['trajet_id'] ?? null,
        $data['statut'] ?? 'Actif'
    ]);
    
    $id = $pdo->lastInsertId();
    $stmt = $pdo->prepare('SELECT * FROM bus WHERE id = ?');
    $stmt->execute([$id]);
    $bus = $stmt->fetch(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'data' => $bus
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur lors de la création']);
}









