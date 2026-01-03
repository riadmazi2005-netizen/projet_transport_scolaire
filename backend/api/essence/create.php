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
        INSERT INTO prise_essence (chauffeur_id, bus_id, date, heure, quantite_litres, prix_total, station_service)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ');
    
    $stmt->execute([
        $data['chauffeur_id'],
        $data['bus_id'],
        $data['date'],
        $data['heure'],
        $data['quantite_litres'],
        $data['prix_total'],
        $data['station_service'] ?? null
    ]);
    
    $id = $pdo->lastInsertId();
    
    // Récupérer les informations du bus et du chauffeur
    $stmtBus = $pdo->prepare('SELECT numero, responsable_id FROM bus WHERE id = ?');
    $stmtBus->execute([$data['bus_id']]);
    $bus = $stmtBus->fetch(PDO::FETCH_ASSOC);
    
    $stmtChauffeur = $pdo->prepare('SELECT u.prenom, u.nom FROM chauffeurs c JOIN utilisateurs u ON c.utilisateur_id = u.id WHERE c.id = ?');
    $stmtChauffeur->execute([$data['chauffeur_id']]);
    $chauffeur = $stmtChauffeur->fetch(PDO::FETCH_ASSOC);
    
    // Envoyer notification au responsable si existe
    if ($bus && $bus['responsable_id']) {
        $stmtNotif = $pdo->prepare('
            INSERT INTO notifications (destinataire_id, destinataire_type, titre, message, type)
            VALUES (?, ?, ?, ?, ?)
        ');
        $stmtNotif->execute([
            $bus['responsable_id'],
            'responsable',
            'Prise d\'essence',
            "Le chauffeur {$chauffeur['prenom']} {$chauffeur['nom']} (Bus {$bus['numero']}) a effectué une prise d'essence de {$data['quantite_litres']}L pour {$data['prix_total']}DH.",
            'info'
        ]);
    }
    
    // Envoyer notification à tous les administrateurs
    $stmtAdmins = $pdo->query('
        SELECT a.utilisateur_id 
        FROM administrateurs a
    ');
    $admins = $stmtAdmins->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($admins as $admin) {
        $stmtNotif = $pdo->prepare('
            INSERT INTO notifications (destinataire_id, destinataire_type, titre, message, type)
            VALUES (?, ?, ?, ?, ?)
        ');
        $stmtNotif->execute([
            $admin['utilisateur_id'],
            'admin',
            'Rapport de prise d\'essence',
            "Le chauffeur {$chauffeur['prenom']} {$chauffeur['nom']} (Bus {$bus['numero']}) a effectué une prise d'essence.\n\n" .
            "Quantité: {$data['quantite_litres']} L\n" .
            "Prix total: {$data['prix_total']} DH\n" .
            "Date: {$data['date']} à {$data['heure']}" .
            ($data['station_service'] ? "\nStation: {$data['station_service']}" : ''),
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

