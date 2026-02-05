# Composants d'Authentification Pino

## 📝 Pages créées

### 1. Page de Connexion - `/login`
**Fichier**: [app/login/page.tsx](app/login/page.tsx)

**Fonctionnalités**:
- Champ "Identifiant ou e-mail"
- Champ "Mot de passe"
- Case à cocher "Se souvenir de moi"
- Bouton "SE CONNECTER"
- Lien "Mot de passe perdu ?"
- Section d'inscription à droite avec fond bleu Pino et motif de t-shirts

**Design**:
- Mise en page en deux colonnes (desktop)
- Formulaire à gauche sur fond blanc
- Section promotionnelle à droite sur fond bleu
- Responsive avec collapse en mobile

---

### 2. Page d'Inscription - `/signup`
**Fichier**: [app/signup/page.tsx](app/signup/page.tsx)

**Fonctionnalités**:
- Champ "Prénom"
- Champ "Nom"
- Champ "Adresse e-mail"
- Champ "Mot de passe"
- Champ "Confirmer le mot de passe"
- Case à cocher pour accepter les CGU
- Bouton "CRÉER MON COMPTE"
- Section de connexion à droite avec fond bleu

**Validation**:
- Tous les champs sont requis
- Validation d'email
- Mot de passe minimum 6 caractères
- Acceptation des conditions obligatoire

---

### 3. Page Mot de Passe Oublié - `/forgot-password`
**Fichier**: [app/forgot-password/page.tsx](app/forgot-password/page.tsx)

**Fonctionnalités**:
- Formulaire simple avec champ email
- Message de confirmation après soumission
- Bouton retour vers login
- Design centré et épuré

---

## 🎨 Caractéristiques de Design

### Mise en Page Split-Screen
```
┌────────────────────────────────────────────┐
│         │                                  │
│  Form   │    Blue Promotional Section      │
│  White  │    with T-shirt Pattern          │
│  BG     │    Pino Blue BG                  │
│         │                                  │
└────────────────────────────────────────────┘
```

### Couleurs Utilisées
- **Formulaire**: Fond blanc (#FFFFFF)
- **Section promotionnelle**: Pino Blue (#4AC4E5)
- **Boutons**: Pino Blue avec hover sur Dark variant
- **Texte**: Gray-900 (#111827) pour les labels
- **Bordures**: Gray-300 (#D1D5DB)

### Éléments de Design
✓ Ombres douces sur le conteneur principal  
✓ Bordures arrondies (12px)  
✓ Motif décoratif de t-shirts en arrière-plan  
✓ Transitions fluides sur hover  
✓ Focus states accessibles  
✓ Validation visuelle des champs  

---

## 📱 Responsive Design

### Desktop (>768px)
- Layout côte à côte (2 colonnes)
- Formulaire à gauche (50%)
- Section promotionnelle à droite (50%)

### Mobile (<768px)
- Layout empilé verticalement
- Formulaire en haut
- Section promotionnelle en bas
- Padding réduit

---

## 🔒 Sécurité & Validation

### Champs de formulaire
- `type="email"` pour validation automatique
- `type="password"` pour masquer le texte
- `required` pour champs obligatoires
- `minLength={6}` pour mot de passe

### Indicateurs visuels
- Astérisque rouge (*) pour champs requis
- Focus ring bleu Pino sur focus
- Messages d'erreur (à implémenter côté serveur)

---

## 🎯 Navigation

### Flux utilisateur

**Nouveau visiteur**:
```
Homepage → Header "S'inscrire" → /signup → Création compte
```

**Utilisateur existant**:
```
Homepage → Header "Se connecter" → /login → Connexion
```

**Mot de passe oublié**:
```
/login → "Mot de passe perdu ?" → /forgot-password → Reset
```

**Entre login et signup**:
```
/login ⟷ Section droite "CRÉER UN COMPTE" ⟷ /signup
/signup ⟷ Section droite "SE CONNECTER" ⟷ /login
```

---

## 💻 Utilisation du Code

### Exemple d'intégration backend

```typescript
// Dans login/page.tsx
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, rememberMe }),
    });
    
    if (response.ok) {
      // Rediriger vers dashboard
      router.push('/dashboard');
    } else {
      // Afficher erreur
      setError('Identifiants incorrects');
    }
  } catch (error) {
    console.error('Login error:', error);
  }
};
```

### Exemple de validation

```typescript
// Dans signup/page.tsx
const validateForm = () => {
  if (formData.password !== formData.confirmPassword) {
    setError('Les mots de passe ne correspondent pas');
    return false;
  }
  
  if (formData.password.length < 6) {
    setError('Le mot de passe doit contenir au moins 6 caractères');
    return false;
  }
  
  if (!formData.acceptTerms) {
    setError('Vous devez accepter les conditions');
    return false;
  }
  
  return true;
};
```

---

## 🎨 Personnalisation

### Modifier les couleurs
Éditez les classes Tailwind:
```tsx
// Bouton principal
className="bg-pino-blue hover:bg-pino-blue-dark"

// Section promotionnelle
className="bg-pino-blue"
```

### Ajouter des champs
```tsx
<div>
  <label htmlFor="phone" className="block text-sm font-semibold text-gray-900 mb-2">
    Téléphone
  </label>
  <input
    type="tel"
    id="phone"
    name="phone"
    className="w-full px-4 py-3 border border-gray-300 rounded-lg..."
  />
</div>
```

### Modifier le motif de fond
Le motif de t-shirts peut être remplacé par n'importe quel SVG:
```tsx
<div className="absolute inset-0 opacity-10">
  {/* Votre pattern ici */}
</div>
```

---

## 🔗 Routes disponibles

| Route | Composant | Description |
|-------|-----------|-------------|
| `/login` | LoginPage | Page de connexion |
| `/signup` | SignUpPage | Page d'inscription |
| `/forgot-password` | ForgotPasswordPage | Réinitialisation MDP |

---

## ✅ Checklist de fonctionnalités

### Page Login
- [x] Formulaire de connexion
- [x] Validation des champs
- [x] Option "Se souvenir de moi"
- [x] Lien mot de passe oublié
- [x] Section signup à droite
- [x] Design responsive
- [ ] Messages d'erreur (backend requis)
- [ ] Authentification réelle (backend requis)

### Page Signup
- [x] Formulaire d'inscription complet
- [x] Validation email
- [x] Confirmation mot de passe
- [x] Acceptation CGU
- [x] Section login à droite
- [x] Design responsive
- [ ] Vérification email unique (backend requis)
- [ ] Création compte (backend requis)

### Page Forgot Password
- [x] Formulaire simple
- [x] Message de confirmation
- [x] Lien retour
- [x] Design centré
- [ ] Envoi email (backend requis)

---

## 🚀 Prochaines étapes

1. **Backend Integration**
   - Créer API routes pour auth
   - Implémenter JWT tokens
   - Session management

2. **Améliorations UX**
   - Messages d'erreur en temps réel
   - Validation progressive
   - Loading states
   - Toast notifications

3. **Sécurité**
   - CSRF protection
   - Rate limiting
   - Password strength meter
   - Captcha (optionnel)

4. **Features additionnelles**
   - Login social (Google, Facebook)
   - Two-factor authentication
   - Email verification
   - Account recovery

---

## 📸 Captures d'écran attendues

### Page Login (Desktop)
```
┌──────────────────────────────────────────────────────┐
│  SE CONNECTER          │  S'INSCRIRE                 │
│  ┌─────────────────┐   │  [Pattern t-shirts]         │
│  │ Email         │   │  Créez un compte !          │
│  ├─────────────────┤   │  [CRÉER UN COMPTE]          │
│  │ Password      │   │                             │
│  ├─────────────────┤   │                             │
│  │ □ Remember me │   │                             │
│  ├─────────────────┤   │                             │
│  │ SE CONNECTER  │   │                             │
│  └─────────────────┘   │                             │
│  Mot de passe perdu?   │                             │
└──────────────────────────────────────────────────────┘
```

---

**Design inspiré de l'image fournie et adapté aux standards Pino**
