<?php
require_once '../../config/headers.php';
require_once '../../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['nom']) || empty($data['nom']) || 
    !isset($data['email']) || empty($data['email']) || 
    !isset($data['message']) || empty($data['message'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Tous les champs sont requis']);
    exit;
}

try {
    $pdo = getDBConnection();
    
    // Récupérer l'ID utilisateur du premier admin trouvé
    $stmt = $pdo->query('SELECT a.utilisateur_id FROM administrateurs a 
                         INNER JOIN utilisateurs u ON a.utilisateur_id = u.id 
                         LIMIT 1');
    $admin = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$admin || !isset($admin['utilisateur_id'])) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Aucun administrateur trouvé']);
        exit;
    }
    
    $adminUserId = $admin['utilisateur_id'];
    
    // Créer une notification pour l'admin
    $titre = "Nouveau message de contact";
    $message = "Message de : " . htmlspecialchars($data['nom']) . " (" . htmlspecialchars($data['email']) . ")\n\n" . htmlspecialchars($data['message']);
    
    $stmt = $pdo->prepare('INSERT INTO notifications (destinataire_id, destinataire_type, titre, message, type, lue) 
                           VALUES (?, ?, ?, ?, ?, ?)');
    $stmt->execute([
        $adminUserId,
        'admin',
        $titre,
        $message,
        'info',
        false
    ]);
    
    echo json_encode([
        'success' => true,
        'message' => 'Message envoyé avec succès. Nous vous répondrons dans les plus brefs délais.'
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur lors de l\'envoi du message: ' . $e->getMessage()]);
}


