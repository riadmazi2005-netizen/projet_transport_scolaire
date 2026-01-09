<?php
require_once '../../config/headers.php';
require_once '../../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['id'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'ID requis']);
    exit;
}

try {
    $pdo = getDBConnection();

    // Vérifier si la prise d'essence existe
    $stmt = $pdo->prepare('SELECT * FROM prise_essence WHERE id = ?');
    $stmt->execute([$data['id']]);
    $prise = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$prise) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Prise d\'essence non trouvée']);
        exit;
    }

    // Préparer la requête de mise à jour
    $fields = [];
    $params = [];

    if (isset($data['date'])) {
        $fields[] = 'date = ?';
        $params[] = $data['date'];
    }
    if (isset($data['heure'])) {
        $fields[] = 'heure = ?';
        $params[] = $data['heure'];
    }
    if (isset($data['quantite_litres'])) {
        $fields[] = 'quantite_litres = ?';
        $params[] = $data['quantite_litres'];
    }
    if (isset($data['prix_total'])) {
        $fields[] = 'prix_total = ?';
        $params[] = $data['prix_total'];
    }
    if (isset($data['station_service'])) {
        $fields[] = 'station_service = ?';
        $params[] = $data['station_service'];
    }
    
    // Gestion de la photo
    if (array_key_exists('photo_ticket', $data)) {
        $photoTicket = $data['photo_ticket'];
        
        // Vérifier si la photo est trop longue (si la colonne est encore en VARCHAR(255))
        if ($photoTicket && strlen($photoTicket) > 255) {
            // Vérifier le type de colonne
            $stmtCheck = $pdo->query("SHOW COLUMNS FROM prise_essence WHERE Field = 'photo_ticket'");
            $columnInfo = $stmtCheck->fetch(PDO::FETCH_ASSOC);
            if ($columnInfo && strpos(strtolower($columnInfo['Type']), 'varchar') !== false) {
                error_log("ATTENTION: Photo trop longue (" . strlen($photoTicket) . " chars) pour VARCHAR(255). Exécutez la migration: migrate_photo_ticket_to_longtext.php");
                // Tronquer la photo pour éviter l'erreur SQL
                $photoTicket = substr($photoTicket, 0, 255);
            }
        }
        
        $fields[] = 'photo_ticket = ?';
        $params[] = $photoTicket;
    }

    if (empty($fields)) {
        echo json_encode(['success' => true, 'message' => 'Aucune modification']);
        exit;
    }

    $sql = 'UPDATE prise_essence SET ' . implode(', ', $fields) . ' WHERE id = ?';
    $params[] = $data['id'];

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    echo json_encode([
        'success' => true,
        'message' => 'Prise d\'essence mise à jour avec succès'
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur lors de la mise à jour: ' . $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur: ' . $e->getMessage()]);
}
