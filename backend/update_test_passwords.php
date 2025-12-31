<?php
/**
 * Script pour mettre à jour les mots de passe des comptes de test
 * Exécutez ce script une fois pour mettre à jour les hash bcrypt dans la base de données
 * 
 * Accès: http://localhost/backend/update_test_passwords.php
 */

require_once 'config/database.php';

header('Content-Type: application/json; charset=utf-8');

try {
    $pdo = getDBConnection();
    
    // Générer le hash bcrypt pour test123 (tous les comptes utilisent le même mot de passe)
    $password_hash = password_hash('test123', PASSWORD_DEFAULT);
    
    $results = [];
    
    // Mettre à jour l'admin (via email uniquement, pas besoin de role)
    $stmt = $pdo->prepare('
        UPDATE utilisateurs u
        INNER JOIN administrateurs a ON a.utilisateur_id = u.id
        SET u.mot_de_passe = ?
        WHERE u.email = ?
    ');
    $stmt->execute([$password_hash, 'admin@transport.ma']);
    $results['admin'] = $stmt->rowCount() > 0 ? 'Mise à jour réussie' : 'Aucun compte trouvé';
    
    // Mettre à jour le responsable (via email uniquement)
    $stmt = $pdo->prepare('
        UPDATE utilisateurs u
        INNER JOIN responsables_bus r ON r.utilisateur_id = u.id
        SET u.mot_de_passe = ?
        WHERE u.email = ?
    ');
    $stmt->execute([$password_hash, 'nadia.kettani@transport.ma']);
    $results['responsable'] = $stmt->rowCount() > 0 ? 'Mise à jour réussie' : 'Aucun compte trouvé';
    
    // Mettre à jour le chauffeur (via email uniquement)
    $stmt = $pdo->prepare('
        UPDATE utilisateurs u
        INNER JOIN chauffeurs c ON c.utilisateur_id = u.id
        SET u.mot_de_passe = ?
        WHERE u.email = ?
    ');
    $stmt->execute([$password_hash, 'ahmed.idrissi@transport.ma']);
    $results['chauffeur'] = $stmt->rowCount() > 0 ? 'Mise à jour réussie' : 'Aucun compte trouvé';
    
    // Vérifier les comptes avec leur type déterminé automatiquement
    $stmt = $pdo->prepare('
        SELECT 
            u.email,
            CASE 
                WHEN a.id IS NOT NULL THEN "admin"
                WHEN c.id IS NOT NULL THEN "chauffeur"
                WHEN r.id IS NOT NULL THEN "responsable"
                WHEN t.id IS NOT NULL THEN "tuteur"
                ELSE "inconnu"
            END as role
        FROM utilisateurs u
        LEFT JOIN administrateurs a ON a.utilisateur_id = u.id
        LEFT JOIN chauffeurs c ON c.utilisateur_id = u.id
        LEFT JOIN responsables_bus r ON r.utilisateur_id = u.id
        LEFT JOIN tuteurs t ON t.utilisateur_id = u.id
        WHERE u.email IN (?, ?, ?)
    ');
    $stmt->execute(['admin@transport.ma', 'nadia.kettani@transport.ma', 'ahmed.idrissi@transport.ma']);
    $accounts = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'message' => 'Mots de passe mis à jour avec succès',
        'results' => $results,
        'accounts' => $accounts,
        'passwords' => [
            'admin@transport.ma' => 'test123',
            'nadia.kettani@transport.ma' => 'test123',
            'ahmed.idrissi@transport.ma' => 'test123'
        ]
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Erreur lors de la mise à jour: ' . $e->getMessage()
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
}
?>
