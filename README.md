# 🚌 Système de Transport Scolaire

## 🔗 Liens à vérifier avant le lancement

### 1. Vérifier que XAMPP est démarré
- **Apache** : doit être VERT (démarré)
- **MySQL** : doit être VERT (démarré)

### 2. Vérifier que le backend est accessible
Ouvrir dans le navigateur :
```
http://localhost/backend/test.php
```

**Résultat attendu :**
```json
{
    "success": true,
    "message": "Backend accessible et base de données connectée"
}
```

### 3. Vérifier que l'API fonctionne
Ouvrir dans le navigateur :
```
http://localhost/backend/api/test-connection.php
```

**Résultat attendu :**
```json
{
    "success": true,
    "message": "API backend accessible"
}
```

---

## 🔐 Comptes de test

**IMPORTANT :** Tous les comptes utilisent le même mot de passe : **`test123`**

| Rôle | Email | Mot de passe | Description |
|------|-------|--------------|-------------|
| **Admin** | `admin@transport.ma` | `test123` | Administrateur système |
| **Responsable** | `nadia.kettani@transport.ma` | `test123` | Responsable Zone Centre |
| **Responsable** | `omar.benjelloun@transport.ma` | `test123` | Responsable Zone Nord |
| **Chauffeur** | `ahmed.idrissi@transport.ma` | `test123` | Chauffeur BUS-001 |
| **Chauffeur** | `youssef.tazi@transport.ma` | `test123` | Chauffeur BUS-002 |
| **Chauffeur** | `karim.elfassi@transport.ma` | `test123` | Chauffeur BUS-003 |
| **Tuteur** | `mohammed.alami@email.ma` | `test123` | Tuteur avec 2 élèves |
| **Tuteur** | `fatima.benjelloun@email.ma` | `test123` | Tuteur avec 2 élèves |

---

## 🔍 Codes de vérification

### Vérification de la connexion à la base de données

```sql
-- Vérifier les tables existantes
SHOW TABLES;

-- Vérifier les utilisateurs créés
SELECT id, email, nom, prenom FROM utilisateurs LIMIT 5;

-- Vérifier les inscriptions en attente
SELECT d.*, e.nom, e.prenom 
FROM demandes d 
INNER JOIN eleves e ON d.eleve_id = e.id 
WHERE d.type_demande = 'inscription' AND d.statut = 'En attente';
```

### Vérification des endpoints API

**Test de login admin :**
```bash
curl -X POST http://localhost/backend/api/auth/login.php \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@transport.ma\",\"mot_de_passe\":\"test123\",\"role\":\"admin\"}"
```

**Test de récupération des bus :**
```bash
curl http://localhost/backend/api/bus/getAll.php
```

### Vérification des erreurs courantes

**Erreur : "Failed to fetch"**
- Vérifier que XAMPP Apache est démarré
- Vérifier que le dossier `backend` est dans `C:\xampp\htdocs\backend`

**Erreur : "Email ou mot de passe incorrect"**
- Vérifier que vous utilisez le mot de passe : **`test123`**
- Vérifier que la base de données `transport_scolaire` existe

**Erreur : "500 Internal Server Error"**
- Ouvrir : `C:\xampp\apache\logs\error.log`
- Chercher la dernière erreur dans les logs

---

## 📝 Exemple de code de vérification

### Exemple 1: Vérifier qu'un chauffeur peut se connecter

```sql
-- Vérifier les informations d'un chauffeur
SELECT c.id, c.numero_permis, u.email, u.mot_de_passe
FROM chauffeurs c
INNER JOIN utilisateurs u ON c.utilisateur_id = u.id
WHERE u.email = 'ahmed.idrissi@transport.ma';
```

**Résultat attendu :** Une ligne avec les informations du chauffeur, le mot de passe doit être hashé (commence par `$2y$10$`).

### Exemple 2: Vérifier les accidents déclarés par un chauffeur

```sql
-- Vérifier les accidents d'un chauffeur
SELECT a.*, b.numero as bus_numero
FROM accidents a
LEFT JOIN bus b ON a.bus_id = b.id
WHERE a.chauffeur_id = 1
ORDER BY a.date DESC;
```

**Résultat attendu :** Liste des accidents déclarés par le chauffeur avec ID 1, triés par date décroissante.

### Exemple 3: Vérifier les inscriptions en attente de paiement

```sql
-- Vérifier les inscriptions en attente de paiement
SELECT d.id, d.code_verification, d.montant_facture, 
       e.nom, e.prenom, e.classe,
       u.email as tuteur_email
FROM demandes d
INNER JOIN eleves e ON d.eleve_id = e.id
INNER JOIN tuteurs t ON e.tuteur_id = t.id
INNER JOIN utilisateurs u ON t.utilisateur_id = u.id
WHERE d.type_demande = 'inscription' 
  AND d.statut = 'En attente de paiement';
```

**Résultat attendu :** Liste des inscriptions validées en attente de paiement, avec le code de vérification et le montant de la facture.

### Exemple 4: Vérifier les bus et leurs affectations

```sql
-- Vérifier les bus et leurs affectations
SELECT b.numero, b.capacite,
       CONCAT(c.prenom, ' ', c.nom) as chauffeur,
       CONCAT(r.prenom, ' ', r.nom) as responsable
FROM bus b
LEFT JOIN chauffeurs c ON b.chauffeur_id = c.id
LEFT JOIN responsables_bus r ON b.responsable_id = r.id
WHERE b.statut = 'Actif';
```

**Résultat attendu :** Liste des bus actifs avec leurs chauffeurs et responsables assignés.

---

**Dernière mise à jour :** Documentation simplifiée - Liens de vérification, comptes de test, codes de vérification et exemples SQL
