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
    
    if (!isset($data['chauffeur_id']) || !isset($data['bus_id']) || !isset($data['type_probleme']) || !isset($data['description'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Données incomplètes']);
        exit;
    }
    
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
            $stmtNotif->execute([
                $admin['id'],
                'admin',
                'Problème signalé - ' . $urgenceText,
                "Le chauffeur {$chauffeur['prenom']} {$chauffeur['nom']} a signalé un problème sur le bus {$bus['numero']}.\n\nType: " . ucfirst($data['type_probleme']) . "\nUrgence: {$urgenceText}\nDescription: {$data['description']}",
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
?>

