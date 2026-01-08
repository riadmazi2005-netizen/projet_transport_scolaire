<?php
require_once '../../config/headers.php';
require_once '../../config/database.php';

$responsableId = $_GET['responsable_id'] ?? null;

if (!$responsableId) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'responsable_id est requis']);
    exit;
}

try {
    $pdo = getDBConnection();
    
    // Récupérer le bus du responsable
    $stmt = $pdo->prepare('SELECT id FROM bus WHERE responsable_id = ? LIMIT 1');
    $stmt->execute([$responsableId]);
    $bus = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$bus) {
        echo json_encode([
            'success' => true,
            'data' => []
        ]);
        exit;
    }
    
    // Récupérer tous les élèves du bus avec leur tuteur_id
    $stmt = $pdo->prepare('
        SELECT DISTINCT e.id as eleve_id, e.tuteur_id 
        FROM eleves e
        INNER JOIN inscriptions i ON i.eleve_id = e.id
        WHERE i.bus_id = ? AND i.statut = "Active"
    ');
    $stmt->execute([$bus['id']]);
    $eleves = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (empty($eleves)) {
        echo json_encode([
            'success' => true,
            'data' => []
        ]);
        exit;
    }
    
    // Récupérer les IDs des tuteurs
    $tuteurIds = array_filter(array_column($eleves, 'tuteur_id'));
    
    if (empty($tuteurIds)) {
        echo json_encode([
            'success' => true,
            'data' => []
        ]);
        exit;
    }
    
    // Récupérer toutes les notifications envoyées à ces tuteurs avec les informations du tuteur
    $placeholders = implode(',', array_fill(0, count($tuteurIds), '?'));
    $stmt = $pdo->prepare("
        SELECT 
            n.*,
            t.id as tuteur_id,
            u.nom as tuteur_nom,
            u.prenom as tuteur_prenom,
            u.telephone as tuteur_telephone,
            u.email as tuteur_email
        FROM notifications n
        LEFT JOIN tuteurs t ON n.destinataire_id = t.id
        LEFT JOIN utilisateurs u ON t.utilisateur_id = u.id
        WHERE n.destinataire_type = 'tuteur' 
        AND n.destinataire_id IN ($placeholders)
        ORDER BY n.date DESC
    ");
    $stmt->execute($tuteurIds);
    $notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Si les informations du tuteur ne sont pas trouvées via le JOIN, les récupérer séparément
    foreach ($notifications as &$notif) {
        if (empty($notif['tuteur_nom']) && !empty($notif['destinataire_id'])) {
            // Récupérer les informations du tuteur directement
            $stmtTuteur = $pdo->prepare('
                SELECT 
                    t.id as tuteur_id,
                    u.nom as tuteur_nom,
                    u.prenom as tuteur_prenom,
                    u.telephone as tuteur_telephone,
                    u.email as tuteur_email
                FROM tuteurs t
                LEFT JOIN utilisateurs u ON t.utilisateur_id = u.id
                WHERE t.id = ?
            ');
            $stmtTuteur->execute([$notif['destinataire_id']]);
            $tuteurInfo = $stmtTuteur->fetch(PDO::FETCH_ASSOC);
            
            if ($tuteurInfo) {
                $notif['tuteur_id'] = $tuteurInfo['tuteur_id'];
                $notif['tuteur_nom'] = $tuteurInfo['tuteur_nom'];
                $notif['tuteur_prenom'] = $tuteurInfo['tuteur_prenom'];
                $notif['tuteur_telephone'] = $tuteurInfo['tuteur_telephone'];
                $notif['tuteur_email'] = $tuteurInfo['tuteur_email'];
            }
        }
    }
    unset($notif);
    
    echo json_encode([
        'success' => true,
        'data' => $notifications
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur lors de la récupération des notifications: ' . $e->getMessage()]);
}



