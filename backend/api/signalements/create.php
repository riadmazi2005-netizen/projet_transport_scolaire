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
    
    if (!isset($data['bus_id']) || empty($data['bus_id'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => "Erreur: Vous n'êtes pas encore assigné à aucun bus"]);
        exit;
    }

    if (!isset($data['chauffeur_id']) || !isset($data['type_probleme']) || !isset($data['description'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Données incomplètes']);
        exit;
    }
    
    // Vérifier si la colonne photos existe et l'ajouter si nécessaire
    try {
        $checkColumn = $pdo->query("SHOW COLUMNS FROM signalements_maintenance LIKE 'photos'");
        $hasPhotosColumn = $checkColumn && $checkColumn->rowCount() > 0;
        
        // Si la colonne n'existe pas, l'ajouter avec LONGTEXT pour supporter les grandes images
        if (!$hasPhotosColumn) {
            $pdo->exec("ALTER TABLE signalements_maintenance ADD COLUMN photos LONGTEXT NULL COMMENT 'JSON array of base64 encoded photos'");
            $hasPhotosColumn = true;
        } else {
            // Vérifier si c'est TEXT et le modifier en LONGTEXT si nécessaire
            $checkType = $pdo->query("SELECT DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'signalements_maintenance' AND COLUMN_NAME = 'photos'");
            $typeRow = $checkType->fetch(PDO::FETCH_ASSOC);
            if ($typeRow && $typeRow['DATA_TYPE'] === 'text') {
                $pdo->exec("ALTER TABLE signalements_maintenance MODIFY COLUMN photos LONGTEXT NULL COMMENT 'JSON array of base64 encoded photos'");
            }
        }
    } catch (PDOException $e) {
        // Si erreur, on continue sans la colonne photos
        $hasPhotosColumn = false;
    }
    
    // Préparer les photos (JSON encode)
    $photos = isset($data['photos']) && is_array($data['photos']) && count($data['photos']) > 0
        ? json_encode($data['photos'])
        : null;
    
    if ($hasPhotosColumn) {
        $stmt = $pdo->prepare('
            INSERT INTO signalements_maintenance (chauffeur_id, bus_id, type_probleme, description, urgence, statut, photos)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ');
        
        $stmt->execute([
            $data['chauffeur_id'],
            $data['bus_id'],
            $data['type_probleme'],
            $data['description'],
            $data['urgence'] ?? 'moyenne',
            'en_attente',
            $photos
        ]);
    } else {
        $stmt = $pdo->prepare('
            INSERT INTO signalements_maintenance (chauffeur_id, bus_id, type_probleme, description, urgence, statut)
            VALUES (?, ?, ?, ?, ?, ?)
        ');
        
        $stmt->execute([
            $data['chauffeur_id'],
            $data['bus_id'],
            $data['type_probleme'],
            $data['description'],
            $data['urgence'] ?? 'moyenne',
            'en_attente'
        ]);
    }
    
    $id = $pdo->lastInsertId();
    
    // Envoyer notification à tous les administrateurs
    $stmtBus = $pdo->prepare('SELECT numero FROM bus WHERE id = ?');
    $stmtBus->execute([$data['bus_id']]);
    $bus = $stmtBus->fetch(PDO::FETCH_ASSOC);
    
    if ($bus) {
        $stmtChauffeur = $pdo->prepare('SELECT u.prenom, u.nom FROM chauffeurs c JOIN utilisateurs u ON c.utilisateur_id = u.id WHERE c.id = ?');
        $stmtChauffeur->execute([$data['chauffeur_id']]);
        $chauffeur = $stmtChauffeur->fetch(PDO::FETCH_ASSOC);
        
        $urgenceText = $data['urgence'] === 'haute' ? 'URGENT' : ($data['urgence'] === 'moyenne' ? 'Moyenne' : 'Faible');
        
        // Récupérer tous les administrateurs
        $stmtAdmins = $pdo->query('
            SELECT u.id 
            FROM utilisateurs u
            INNER JOIN administrateurs a ON a.utilisateur_id = u.id
        ');
        $admins = $stmtAdmins->fetchAll(PDO::FETCH_ASSOC);
        
        // Envoyer une notification à chaque administrateur
        foreach ($admins as $admin) {
            $stmtNotif = $pdo->prepare('
                INSERT INTO notifications (destinataire_id, destinataire_type, titre, message, type)
                VALUES (?, ?, ?, ?, ?)
            ');
            $message = "Le chauffeur {$chauffeur['prenom']} {$chauffeur['nom']} a signalé un problème sur le bus {$bus['numero']}.\n\n";
            $message .= "Type: " . ucfirst($data['type_probleme']) . "\n";
            $message .= "Urgence: {$urgenceText}\n";
            $message .= "Description: {$data['description']}";
            
            // Ajouter une mention si des photos sont incluses
            if (isset($data['photos']) && is_array($data['photos']) && count($data['photos']) > 0) {
                $message .= "\n\n📷 " . count($data['photos']) . " photo(s) jointe(s)";
            }
            
            $stmtNotif->execute([
                $admin['id'],
                'admin',
                'Problème signalé - ' . $urgenceText,
                $message,
                $data['urgence'] === 'haute' ? 'alerte' : 'avertissement'
            ]);
        }
    }
    
    $stmt = $pdo->prepare('SELECT * FROM signalements_maintenance WHERE id = ?');
    $stmt->execute([$id]);
    $signalement = $stmt->fetch(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'data' => $signalement
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur: ' . $e->getMessage()]);
}



