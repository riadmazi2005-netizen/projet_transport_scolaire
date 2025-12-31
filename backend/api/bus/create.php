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
    $stmt = $pdo->prepare('
        INSERT INTO bus (numero, marque, modele, annee_fabrication, capacite, chauffeur_id, responsable_id, trajet_id, statut)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ');
    
    $stmt->execute([
        $data['numero'],
        $data['marque'] ?? null,
        $data['modele'] ?? null,
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
    $bus = $stmt->fetch();
    
    echo json_encode([
        'success' => true,
        'data' => $bus
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur lors de la création']);
}
?>







