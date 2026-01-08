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
    
    // Vérifier que tous les éléments sont cochés
    if (!($data['essence_verifiee'] && $data['pneus_ok'] && $data['portes_ok'] && $data['eclairage_ok'] && $data['nettoyage_fait'] && $data['trousse_secours'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Tous les éléments de la checklist doivent être validés']);
        exit;
    }
    
    $stmt = $pdo->prepare('
        INSERT INTO checklist_depart (chauffeur_id, bus_id, date, periode, essence_verifiee, pneus_ok, portes_ok, eclairage_ok, nettoyage_fait, trousse_secours, autres_verifications, validee)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ');
    
    $stmt->execute([
        $data['chauffeur_id'],
        $data['bus_id'],
        $data['date'],
        $data['periode'],
        $data['essence_verifiee'] ? 1 : 0,
        $data['pneus_ok'] ? 1 : 0,
        $data['portes_ok'] ? 1 : 0,
        $data['eclairage_ok'] ? 1 : 0,
        $data['nettoyage_fait'] ? 1 : 0,
        $data['trousse_secours'] ? 1 : 0,
        $data['autres_verifications'] ?? null,
        1
    ]);
    
    $id = $pdo->lastInsertId();
    $stmt = $pdo->prepare('SELECT * FROM checklist_depart WHERE id = ?');
    $stmt->execute([$id]);
    $checklist = $stmt->fetch(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'data' => $checklist
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur: ' . $e->getMessage()]);
}



