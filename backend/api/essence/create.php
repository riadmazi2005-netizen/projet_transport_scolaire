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
    
    // Validation
    if (!isset($data['chauffeur_id']) || !isset($data['bus_id']) || !isset($data['quantite_litres']) || !isset($data['prix_total'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Données incomplètes']);
        exit;
    }
    
    $stmt = $pdo->prepare('
        INSERT INTO prise_essence (chauffeur_id, bus_id, date, heure, quantite_litres, prix_total, kilometrage_actuel, station_service)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ');
    
    $stmt->execute([
        $data['chauffeur_id'],
        $data['bus_id'],
        $data['date'],
        $data['heure'],
        $data['quantite_litres'],
        $data['prix_total'],
        $data['kilometrage_actuel'] ?? null,
        $data['station_service'] ?? null
    ]);
    
    $id = $pdo->lastInsertId();
    
    // Envoyer notification au responsable
    $stmtBus = $pdo->prepare('SELECT responsable_id FROM bus WHERE id = ?');
    $stmtBus->execute([$data['bus_id']]);
    $bus = $stmtBus->fetch(PDO::FETCH_ASSOC);
    
    if ($bus && $bus['responsable_id']) {
        $stmtChauffeur = $pdo->prepare('SELECT u.prenom, u.nom FROM chauffeurs c JOIN utilisateurs u ON c.utilisateur_id = u.id WHERE c.id = ?');
        $stmtChauffeur->execute([$data['chauffeur_id']]);
        $chauffeur = $stmtChauffeur->fetch(PDO::FETCH_ASSOC);
        
        $stmtBusNum = $pdo->prepare('SELECT numero FROM bus WHERE id = ?');
        $stmtBusNum->execute([$data['bus_id']]);
        $busNum = $stmtBusNum->fetch(PDO::FETCH_ASSOC);
        
        $stmtNotif = $pdo->prepare('
            INSERT INTO notifications (destinataire_id, destinataire_type, titre, message, type)
            VALUES (?, ?, ?, ?, ?)
        ');
        $stmtNotif->execute([
            $bus['responsable_id'],
            'responsable',
            'Prise d\'essence',
            "Le chauffeur {$chauffeur['prenom']} {$chauffeur['nom']} (Bus {$busNum['numero']}) a effectué une prise d'essence de {$data['quantite_litres']}L pour {$data['prix_total']}DH.",
            'info'
        ]);
    }
    
    $stmt = $pdo->prepare('SELECT * FROM prise_essence WHERE id = ?');
    $stmt->execute([$id]);
    $prise = $stmt->fetch(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'data' => $prise
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur: ' . $e->getMessage()]);
}
?>

