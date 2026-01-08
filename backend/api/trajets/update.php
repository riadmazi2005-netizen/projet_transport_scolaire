<?php
require_once '../../config/headers.php';
require_once '../../config/database.php';
if ($_SERVER['REQUEST_METHOD'] !== 'PUT') { http_response_code(405); echo json_encode(['success' => false, 'message' => 'Méthode non autorisée']); exit; }
$data = json_decode(file_get_contents('php://input'), true);
if (!isset($data['id'])) { http_response_code(400); echo json_encode(['success' => false, 'message' => 'ID requis']); exit; }
try {
    $pdo = getDBConnection();
    $id = $data['id'];
    unset($data['id']);
    // Gérer les zones : si c'est un tableau, le convertir en JSON
    if (isset($data['zones']) && is_array($data['zones'])) { 
        $data['zones'] = json_encode($data['zones']); 
    }
    $fields = []; $values = [];
    foreach ($data as $key => $value) { $fields[] = "$key = ?"; $values[] = $value; }
    $values[] = $id;
    $stmt = $pdo->prepare("UPDATE trajets SET " . implode(', ', $fields) . " WHERE id = ?");
    $stmt->execute($values);
    $stmt = $pdo->prepare('SELECT * FROM trajets WHERE id = ?');
    $stmt->execute([$id]);
    $trajet = $stmt->fetch(PDO::FETCH_ASSOC);
    echo json_encode(['success' => true, 'data' => $trajet]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur lors de la mise à jour']);
}









