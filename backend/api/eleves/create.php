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
        INSERT INTO eleves (nom, prenom, date_naissance, adresse, telephone_parent, email_parent, classe, tuteur_id, statut)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ');
    
    $stmt->execute([
        $data['nom'],
        $data['prenom'],
        $data['date_naissance'] ?? null,
        $data['adresse'] ?? null,
        $data['telephone_parent'] ?? null,
        $data['email_parent'] ?? null,
        $data['classe'] ?? null,
        $data['tuteur_id'] ?? null,
        $data['statut'] ?? 'Actif'
    ]);
    
    $id = $pdo->lastInsertId();
    $stmt = $pdo->prepare('SELECT * FROM eleves WHERE id = ?');
    $stmt->execute([$id]);
    $eleve = $stmt->fetch();
    
    echo json_encode([
        'success' => true,
        'data' => $eleve
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur lors de la création']);
}
?>







