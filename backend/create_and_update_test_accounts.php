<?php
/**
 * Script pour créer et mettre à jour les comptes de test avec les vrais hash bcrypt
 * Exécutez ce script une fois: http://localhost/backend/create_and_update_test_accounts.php
 * 
 * Ce script:
 * 1. Crée les comptes s'ils n'existent pas
 * 2. Met à jour les mots de passe avec les vrais hash bcrypt
 * 3. Crée les entrées dans les tables spécifiques (administrateurs, chauffeurs, responsables_bus)
 */

require_once 'config/database.php';

header('Content-Type: application/json; charset=utf-8');

try {
    $pdo = getDBConnection();
    
    // Générer les hash bcrypt pour les mots de passe (tous utilisent test123)
    $password_hash = password_hash('test123', PASSWORD_DEFAULT);
    
    $results = [];
    
    // Fonction pour créer ou mettre à jour un compte
    function createOrUpdateAccount($pdo, $nom, $prenom, $email, $password, $telephone, $type) {
        // Vérifier si le compte existe
        $stmt = $pdo->prepare('SELECT id FROM utilisateurs WHERE email = ?');
        $stmt->execute([$email]);
        $existing = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($existing) {
            // Mettre à jour le mot de passe
            $stmt = $pdo->prepare('UPDATE utilisateurs SET mot_de_passe = ?, nom = ?, prenom = ?, telephone = ?, statut = ? WHERE id = ?');
            $stmt->execute([$password, $nom, $prenom, $telephone, 'Actif', $existing['id']]);
            $userId = $existing['id'];
        } else {
            // Créer le compte (SANS colonne role)
            $stmt = $pdo->prepare('INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, telephone, statut) VALUES (?, ?, ?, ?, ?, ?)');
            $stmt->execute([$nom, $prenom, $email, $password, $telephone, 'Actif']);
            $userId = $pdo->lastInsertId();
        }
        
        // Créer l'entrée dans la table spécifique si elle n'existe pas
        $tableName = '';
        $tableIdField = '';
        
        switch ($type) {
            case 'admin':
                $tableName = 'administrateurs';
                $tableIdField = 'admin_id';
                break;
            case 'chauffeur':
                $tableName = 'chauffeurs';
                $tableIdField = 'chauffeur_id';
                break;
            case 'responsable':
                $tableName = 'responsables_bus';
                $tableIdField = 'responsable_id';
                break;
            case 'tuteur':
                $tableName = 'tuteurs';
                $tableIdField = 'tuteur_id';
                break;
        }
        
        if ($tableName) {
            $stmt = $pdo->prepare("SELECT id FROM $tableName WHERE utilisateur_id = ?");
            $stmt->execute([$userId]);
            $typeEntry = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$typeEntry) {
                if ($type === 'chauffeur') {
                    // Pour les chauffeurs, on doit fournir un numéro de permis
                    // Calculer la date d'expiration (2 ans à partir d'aujourd'hui) en PHP
                    $dateExpiration = date('Y-m-d', strtotime('+2 years'));
                    $stmt = $pdo->prepare("INSERT INTO $tableName (utilisateur_id, numero_permis, date_expiration_permis, statut) VALUES (?, ?, ?, ?)");
                    $stmt->execute([$userId, 'CH-TEST-' . $userId, $dateExpiration, 'Actif']);
                } elseif ($type === 'responsable') {
                    // Pour les responsables, on doit fournir une zone
                    $stmt = $pdo->prepare("INSERT INTO $tableName (utilisateur_id, zone_responsabilite, statut) VALUES (?, ?, ?)");
                    $stmt->execute([$userId, 'Zone Test', 'Actif']);
                } else {
                    // Pour admin et tuteur, juste l'utilisateur_id
                    $stmt = $pdo->prepare("INSERT INTO $tableName (utilisateur_id) VALUES (?)");
                    $stmt->execute([$userId]);
                }
            }
        }
        
        return ['action' => $existing ? 'updated' : 'created', 'id' => $userId];
    }
    
    // Créer ou mettre à jour l'admin
    $adminResult = createOrUpdateAccount($pdo, 'Admin', 'Système', 'admin@transport.ma', $password_hash, '0612345678', 'admin');
    $results['admin'] = $adminResult;
    
    // Créer ou mettre à jour le responsable
    $respoResult = createOrUpdateAccount($pdo, 'Kettani', 'Nadia', 'nadia.kettani@transport.ma', $password_hash, '0612345685', 'responsable');
    $results['responsable'] = $respoResult;
    
    // Créer ou mettre à jour le chauffeur
    $chauffeurResult = createOrUpdateAccount($pdo, 'Idrissi', 'Ahmed', 'ahmed.idrissi@transport.ma', $password_hash, '0612345682', 'chauffeur');
    $results['chauffeur'] = $chauffeurResult;
    
    // Récupérer les comptes créés/mis à jour avec leur type
    $stmt = $pdo->prepare('
        SELECT 
            u.id, 
            u.nom, 
            u.prenom, 
            u.email, 
            u.statut,
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
        'message' => 'Comptes créés/mis à jour avec succès',
        'results' => $results,
        'accounts' => $accounts,
        'credentials' => [
            'admin' => [
                'email' => 'admin@transport.ma',
                'password' => 'test123'
            ],
            'responsable' => [
                'email' => 'nadia.kettani@transport.ma',
                'password' => 'test123'
            ],
            'chauffeur' => [
                'email' => 'ahmed.idrissi@transport.ma',
                'password' => 'test123'
            ]
        ]
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Erreur: ' . $e->getMessage(),
        'trace' => $e->getTraceAsString()
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
}
?>
