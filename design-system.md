# Notizz Design System - iOS Inspired UI

## 🎨 Design Philosophy

### Core Principles
- **Clarity**: Letisztult, könnyen értelmezhető felület
- **Deference**: A tartalom az elsődleges, a UI támogató szerepben
- **Depth**: Rétegzett megjelenés árnyékokkal és blur effektekkel
- **Accessibility First**: Nagy betűk, jó kontraszt, egyértelmű interakciók

---

## 🎨 Color System

### Primary Palette (Pasztell színek)
```css
:root {
  /* Panel színek */
  --color-lavender: #E6E6FA;  /* Levendula - Jegyzetek */
  --color-peach: #FFDAB9;     /* Barack - Fontos todok */
  --color-mint: #B2DFDB;      /* Menta - Befejezett feladatok */
  --color-sky: #87CEEB;       /* Égkék - Általános todok */
  --color-rose: #FFB6C1;      /* Rózsa - Sürgős jegyzetek */
  --color-lemon: #FFFACD;     /* Citrom - Ötletek */
  --color-sage: #B2D3C2;      /* Zsálya - Projektek */
  --color-coral: #FFB5A7;     /* Korall - Személyes */
}
```

### System Colors
```css
:root {
  /* Világos téma */
  --bg-primary: #FFFFFF;
  --bg-secondary: #F7F7F9;
  --bg-tertiary: #EFEFF4;
  --text-primary: #000000;
  --text-secondary: #3C3C43;
  --text-tertiary: #8E8E93;
  --text-disabled: #C7C7CC;
  --border-light: rgba(0, 0, 0, 0.08);
  --border-medium: rgba(0, 0, 0, 0.12);

  /* AMOLED Sötét téma - Premium Glow */
  --amoled-bg: #07080D;
  --amoled-bg-2: #0B1020;
  --amoled-surface-1: #111421;
  --amoled-surface-2: #151A2A;
  --amoled-surface-3: #1B2134;
  --amoled-border: #2A2F40;
  --amoled-divider: #1E2230;
  --amoled-text-primary: #F2F3F7;
  --amoled-text-secondary: #C9CAD3;
  --amoled-text-tertiary: #8F90A0;
  --amoled-text-disabled: #5C5D6A;

  /* Dark kategória színek (pasztell dark tints) */
  --dark-lavender: #2A2442;
  --dark-peach: #3A261D;
  --dark-mint: #163336;
  --dark-sky: #152B3A;
  --dark-rose: #3A1E2B;
  --dark-lemon: #3A3516;
  --dark-sage: #1E3228;
  --dark-coral: #3A201A;

  /* Glow színek (bright accents) */
  --glow-lavender: #B4AAFF;
  --glow-peach: #FFB478;
  --glow-mint: #78FFDC;
  --glow-sky: #78C8FF;
  --glow-rose: #FF78A0;
  --glow-lemon: #FFF5AA;
  --glow-sage: #96DCB4;
  --glow-coral: #FF8C78;
}
```

### Semantic Colors
```css
:root {
  --color-success: #34C759;
  --color-warning: #FF9500;
  --color-error: #FF3B30;
  --color-info: #007AFF;
  --color-urgent: #FF6B6B;  /* Sürgős badge */
}
```

### Brand Accent (elegáns kék)
A régi lila gradiens (`#667eea → #764ba2`) helyett egységes kék brand-akcens.
Minden gomb, cím-gradiens, FAB és avatar ezekből a tokenekből épül fel.
A **kártyák** (pasztell színek + gradiens/aura) NEM használják ezt — érintetlenek.
```css
:root {
  --brand-500: #2F80ED;   /* elsődleges kék */
  --brand-400: #5DA9FF;   /* világosabb kék */
  --brand-600: #1E63C4;   /* mélyebb kék (hover/press) */
  --brand-gradient: linear-gradient(135deg, var(--brand-400) 0%, var(--brand-500) 100%);
  --brand-gradient-text: linear-gradient(90deg, var(--brand-400), var(--brand-500));
  --brand-shadow: rgba(47, 128, 237, 0.35);
  --brand-shadow-soft: rgba(47, 128, 237, 0.20);
}
```

---

## 📐 Typography

### Font Stack
```css
:root {
  --font-system: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 
                 'Segoe UI', system-ui, 'Helvetica Neue', Arial, sans-serif;
}
```

### Type Scale
```css
:root {
  /* Betűméretek */
  --text-xs: 12px;     /* Metadata, timestamps */
  --text-sm: 14px;     /* Segédszövegek */
  --text-base: 16px;   /* Alapméret - jól olvasható */
  --text-md: 18px;     /* Panel címek */
  --text-lg: 20px;     /* Oldal címek */
  --text-xl: 24px;     /* Főcímek */
  --text-2xl: 32px;    /* Hero szövegek */
  
  /* Betűvastagság */
  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;
  
  /* Sormagasság */
  --leading-tight: 1.2;
  --leading-normal: 1.5;
  --leading-relaxed: 1.75;
}
```

### Betűméret beállítások
```css
/* Kis méret */
.font-size-small { --text-base: 14px; }

/* Közepes méret (alapértelmezett) */
.font-size-medium { --text-base: 16px; }

/* Nagy méret (accessibility) */
.font-size-large { --text-base: 18px; }
```

---

## 📏 Spacing System

### Spacing Scale (8px base)
```css
:root {
  --space-0: 0;
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-7: 32px;
  --space-8: 40px;
  --space-9: 48px;
  --space-10: 64px;
}
```

### Component Spacing
```css
:root {
  /* Padding értékek */
  --padding-card: 20px;
  --padding-button: 12px 20px;
  --padding-input: 12px 16px;
  --padding-modal: 24px;
  
  /* Margin értékek */
  --gap-cards: 20px;
  --gap-list-items: 8px;
  --gap-form-fields: 16px;
  --margin-section: 32px;
}
```

---

## 🔲 Layout

### Container
```css
.container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 0 env(safe-area-inset-right) 0 env(safe-area-inset-left);
}
```

### Grid System
```css
.note-grid {
  display: grid;
  gap: var(--gap-cards);
  padding: var(--space-3);

  /* Mobile: 1 oszlop */
  grid-template-columns: 1fr;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  overflow-x: hidden;

  /* 375px optimalizálás iPhone 13 mini számára */
  @media (max-width: 375px) {
    padding: 8px;
    gap: 16px;
  }

  /* Tablet: 2 oszlop */
  @media (min-width: 640px) {
    grid-template-columns: repeat(2, 1fr);
  }

  /* Desktop: 3 oszlop, központosítva, rugalmas méretezés */
  @media (min-width: 1024px) {
    grid-template-columns: repeat(3, 1fr);
    max-width: 1000px;
    margin: 0 auto;
  }
}

/* Grid gyerek elemek - NEM szabad explicit szélességet megadni! */
.draggable-wrapper,
.card-wrapper {
  min-width: 0;  /* Grid flexibilitáshoz */
  box-sizing: border-box;
}
```

---

## 🎴 Components

### Note/Todo Card
```css
.card {
  /* Alapstílusok */
  border-radius: 20px;
  padding: var(--padding-card);
  position: relative;
  transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden; /* Aura overlay clip */

  /* iOS-szerű árnyék - Mérsékelt (világos mód) */
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.06),
    0 4px 12px rgba(0, 0, 0, 0.08),
    0 8px 20px rgba(0, 0, 0, 0.10);

  /* Hover/Touch feedback */
  &:hover {
    transform: translateY(-2px) scale(1.01);
    box-shadow:
      0 2px 6px rgba(0, 0, 0, 0.10),
      0 8px 20px rgba(0, 0, 0, 0.12),
      0 16px 32px rgba(0, 0, 0, 0.14);
  }

  &:active {
    transform: scale(0.98);
  }
}

/* Delete button pozícionálás */
.card__delete {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--color-info);
  color: white;
  z-index: 2;
  opacity: 0; /* Desktop hover */
  transition: all 200ms ease;
}

.card:hover .card__delete {
  opacity: 1;
}

/* Touch devices - always visible */
@media (hover: none), (pointer: coarse) {
  .card__delete {
    opacity: 1;
  }
}

/* Dark mode - AMOLED Premium Glow */
[data-theme="dark"] .card {
  background: var(--amoled-surface-1) !important;
  border: 1px solid var(--amoled-border);
  color: var(--amoled-text-primary);
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.55),
    0 10px 30px rgba(0, 0, 0, 0.55);
}

/* Aura overlay - kategória alapú glow */
[data-theme="dark"] .card::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 1;
  background: radial-gradient(
    circle at 15% 10%,
    var(--card-tint, rgba(255, 255, 255, 0.10)) 0%,
    transparent 55%
  );
  z-index: 0;
  border-radius: 20px;
}

/* Content above aura */
[data-theme="dark"] .card > * {
  position: relative;
  z-index: 1;
}

/* Delete button dark mode fix */
[data-theme="dark"] .card__delete {
  position: absolute;
  z-index: 2;
}

/* Hover glow dark mode */
[data-theme="dark"] .card:hover {
  transform: translateY(-2px) scale(1.01);
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.55),
    0 16px 45px rgba(0, 0, 0, 0.65),
    0 0 0 1px rgba(255, 255, 255, 0.06),
    0 0 28px var(--card-glow, rgba(255, 255, 255, 0.10));
}

/* Glass effect a modálokhoz */
.card--glass {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.3);
}
```

### Floating Action Button (FAB)
```css
.fab {
  /* Pozíció */
  position: fixed;
  bottom: calc(24px + env(safe-area-inset-bottom));
  right: 24px;
  z-index: 1000;
  
  /* Méret */
  width: 56px;
  height: 56px;
  border-radius: 50%;
  
  /* Megjelenés */
  background: var(--brand-gradient);
  color: white;
  box-shadow: 
    0 4px 12px var(--brand-shadow),
    0 8px 24px var(--brand-shadow-soft);
  
  /* Animáció */
  transition: all 300ms cubic-bezier(0.68, -0.55, 0.265, 1.55);
  
  &:hover {
    transform: rotate(90deg) scale(1.1);
  }
  
  &:active {
    transform: rotate(90deg) scale(0.95);
  }
  
  /* Plus ikon */
  &::before,
  &::after {
    content: '';
    position: absolute;
    background: white;
  }
  
  &::before {
    width: 24px;
    height: 2px;
    left: 16px;
    top: 27px;
  }
  
  &::after {
    width: 2px;
    height: 24px;
    left: 27px;
    top: 16px;
  }
}
```

### Modal
```css
.modal-backdrop {
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

.modal-content {
  background: var(--bg-primary);
  border-radius: 24px;
  padding: var(--padding-modal);
  max-width: 90vw;
  max-height: 85vh;
  
  /* iOS bounce effect */
  animation: modalSlideIn 400ms cubic-bezier(0.68, -0.55, 0.265, 1.55);
  
  /* Árnyék */
  box-shadow: 
    0 10px 40px rgba(0, 0, 0, 0.2),
    0 24px 80px rgba(0, 0, 0, 0.1);
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(100px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
```

### Buttons
```css
.button {
  /* Alapstílusok */
  border-radius: 12px;
  padding: var(--padding-button);
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  transition: all 200ms ease;
  position: relative;
  overflow: hidden;
  
  /* Ripple effect container */
  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.5);
    transform: translate(-50%, -50%);
    transition: width 0.6s, height 0.6s;
  }
  
  &:active::before {
    width: 300px;
    height: 300px;
  }
}

.button--primary {
  background: var(--brand-gradient);
  color: white;
  box-shadow: 0 4px 12px var(--brand-shadow);
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 20px var(--brand-shadow);
  }
}

.button--secondary {
  background: var(--bg-tertiary);
  color: var(--text-primary);
  
  &:hover {
    background: var(--bg-secondary);
  }
}

.button--danger {
  background: var(--color-error);
  color: white;
}
```

### Form Inputs
```css
.input {
  /* Alapstílusok */
  width: 100%;
  padding: var(--padding-input);
  border: 1px solid var(--border-light);
  border-radius: 12px;
  font-size: var(--text-base);
  background: var(--bg-primary);
  transition: all 200ms ease;
  
  /* Focus állapot */
  &:focus {
    outline: none;
    border-color: var(--color-info);
    box-shadow: 
      0 0 0 3px rgba(0, 122, 255, 0.1),
      0 2px 8px rgba(0, 122, 255, 0.1);
  }
  
  /* Placeholder */
  &::placeholder {
    color: var(--text-tertiary);
  }
}

/* Textarea */
.textarea {
  min-height: 120px;
  resize: vertical;
}
```

### Color Picker
```css
.color-picker {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.color-option {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  transition: all 200ms ease;
  position: relative;
  
  &:hover {
    transform: scale(1.1);
  }
  
  &.selected {
    transform: scale(1.15);
    
    &::after {
      content: '✓';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: white;
      font-size: 20px;
      font-weight: bold;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    }
  }
}
```

### Todo Checkbox
```css
.checkbox-container {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  cursor: pointer;
  user-select: none;
}

.checkbox {
  width: 24px;
  height: 24px;
  border: 2px solid var(--border-medium);
  border-radius: 6px;
  position: relative;
  transition: all 200ms ease;
  
  &:hover {
    border-color: var(--color-info);
  }
}

.checkbox--checked {
  background: var(--color-success);
  border-color: var(--color-success);
  
  &::after {
    content: '';
    position: absolute;
    left: 7px;
    top: 3px;
    width: 6px;
    height: 12px;
    border: solid white;
    border-width: 0 2px 2px 0;
    transform: rotate(45deg);
    animation: checkmark 200ms ease;
  }
}

@keyframes checkmark {
  0% {
    transform: rotate(45deg) scale(0);
  }
  50% {
    transform: rotate(45deg) scale(1.2);
  }
  100% {
    transform: rotate(45deg) scale(1);
  }
}

.checkbox-label {
  font-size: var(--text-base);
  transition: all 200ms ease;
}

.checkbox-label--completed {
  text-decoration: line-through;
  opacity: 0.5;
}
```

### Progress Indicator
```css
.progress {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-sm);
  color: var(--text-tertiary);
}

.progress-bar {
  flex: 1;
  height: 6px; /* Világos mód: vékony */
  background: var(--bg-tertiary);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--brand-400), var(--brand-500));
  border-radius: 3px;
  transition: width 300ms ease;
}

.progress-text {
  min-width: 50px;
  text-align: right;
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
}

/* Dark mode - modernebb megjelenés */
[data-theme="dark"] .progress-bar {
  height: 12px; /* Vastagabb */
  background: rgba(0, 0, 0, 0.08);
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
}

[data-theme="dark"] .progress-fill {
  background: #007AFF; /* Egyszínű kék */
  box-shadow: 0 1px 4px rgba(0, 122, 255, 0.3);
}

[data-theme="dark"] .progress-text {
  font-size: var(--text-base); /* Nagyobb */
  font-weight: var(--font-semibold); /* Félkövér */
  color: #007AFF; /* Kék szöveg */
}

/* Világos módban marad szürke */
.progress-text {
  color: var(--text-tertiary);
}
```

---

## ✨ Animations & Interactions

### Micro-interactions
```css
/* Tap feedback */
@keyframes tapFeedback {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(0.95); }
}

/* Slide animations */
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Fade animations */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* List item stagger */
.list-item {
  animation: slideUp 400ms ease both;
  animation-delay: calc(var(--index) * 50ms);
}
```

### Page Transitions
```css
/* Route változás */
.page-enter {
  animation: slideUp 300ms ease;
}

.page-exit {
  animation: fadeOut 200ms ease;
}
```

### Skeleton Loading
```css
.skeleton {
  background: linear-gradient(
    90deg,
    var(--bg-tertiary) 25%,
    var(--bg-secondary) 50%,
    var(--bg-tertiary) 75%
  );
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
  border-radius: 8px;
}

@keyframes loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

---

## 🌗 Dark Mode - AMOLED Premium Glow

### Filozófia
A sötét mód nem egyszerű színinverzió, hanem egy **prémium élmény** AMOLED kijelzőkre optimalizálva:
- **Mély fekete háttér** (#07080D) - valódi AMOLED energia-megtakarítás
- **Rétegzett surface rendszer** - különböző mélységű felületek
- **Kategória-alapú aura effekt** - finom radial gradient glow
- **Prémium glow a hover-nél** - kategória színekkel
- **Automatikus rendszer detektálás** - app induláskor

### AMOLED Háttér + Surface Rendszer
```css
:root {
  /* AMOLED háttér - mély fekete */
  --amoled-bg: #07080D;
  --amoled-bg-2: #0B1020;

  /* Surface rétegek - progresszív világosodás */
  --amoled-surface-1: #111421; /* card base */
  --amoled-surface-2: #151A2A; /* elevated surfaces */
  --amoled-surface-3: #1B2134; /* modal / active */

  /* Border / divider */
  --amoled-border: #2A2F40;
  --amoled-divider: #1E2230;

  /* Text colors - optimalizált olvashatóság */
  --amoled-text-primary: #F2F3F7;
  --amoled-text-secondary: #C9CAD3;
  --amoled-text-tertiary: #8F90A0;
  --amoled-text-disabled: #5C5D6A;
}
```

### Dark Theme Global Overrides
```css
[data-theme="dark"] {
  /* Háttér színek - AMOLED rendszer */
  --bg-primary: var(--amoled-bg);
  --bg-secondary: var(--amoled-bg);
  --bg-tertiary: rgba(255, 255, 255, 0.06);

  /* Szöveg színek - AMOLED optimalizált */
  --text-primary: var(--amoled-text-primary);
  --text-secondary: var(--amoled-text-secondary);
  --text-tertiary: var(--amoled-text-tertiary);

  /* Határok - subtilis vonalak */
  --border-light: var(--amoled-border);
  --border-medium: var(--amoled-border);
}

/* Body háttér gradient */
[data-theme="dark"] body {
  background: linear-gradient(180deg, var(--amoled-bg), var(--amoled-bg-2));
}
```

### Kategória Színek Dark Mode-ban
```css
:root {
  /* Dark kategória színek - sötét pasztell tónusok */
  --dark-lavender: #2A2442;
  --dark-peach: #3A261D;
  --dark-mint: #163336;
  --dark-sky: #152B3A;
  --dark-rose: #3A1E2B;
  --dark-lemon: #3A3516;
  --dark-sage: #1E3228;
  --dark-coral: #3A201A;

  /* Glow színek - világos, neon-szerű kiemelések */
  --glow-lavender: #B4AAFF;
  --glow-peach: #FFB478;
  --glow-mint: #78FFDC;
  --glow-sky: #78C8FF;
  --glow-rose: #FF78A0;
  --glow-lemon: #FFF5AA;
  --glow-sage: #96DCB4;
  --glow-coral: #FF8C78;
}
```

### Card Component - AMOLED Premium Glow
```css
/* Alap kártya dark mode-ban */
[data-theme="dark"] .card {
  background: var(--amoled-surface-1) !important;
  border: 1px solid var(--amoled-border);
  color: var(--amoled-text-primary);
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.55),
    0 10px 30px rgba(0, 0, 0, 0.55);
}

/* Aura overlay effect - kategória alapú radial gradient */
[data-theme="dark"] .card::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 1;
  background: radial-gradient(
    circle at 15% 10%,
    var(--card-tint, rgba(255, 255, 255, 0.10)) 0%,
    transparent 55%
  );
  z-index: 0;
  border-radius: 20px;
}

/* Tartalom az aura overlay fölött */
[data-theme="dark"] .card > * {
  position: relative;
  z-index: 1;
}

/* Hover glow effect - kategória színnel */
[data-theme="dark"] .card:hover {
  transform: translateY(-2px) scale(1.01);
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.55),
    0 16px 45px rgba(0, 0, 0, 0.65),
    0 0 0 1px rgba(255, 255, 255, 0.06),
    0 0 28px var(--card-glow, rgba(255, 255, 255, 0.10));
}

/* Absolute pozicionált elemek (pl. delete button) megtartása */
[data-theme="dark"] .card__delete {
  position: absolute;
  z-index: 2;
}
```

### Kategória Hozzárendelés - Dynamic CSS Variables
```css
/* NoteCard.svelte / TodoCard.svelte - példa */
<article
  class="card"
  style:--card-tint={getDarkTint(note.color)}
  style:--card-glow={getGlowColor(note.color)}
>
```

### Progress Bar - Dark Mode
```css
[data-theme="dark"] .progress-bar {
  background: var(--amoled-surface-2);
}

[data-theme="dark"] .progress-fill {
  background: #007AFF; /* Egyszínű kék */
  box-shadow: 0 1px 4px rgba(0, 122, 255, 0.3);
}

/* Progress text - nagyobb, félkövér */
[data-theme="dark"] .progress-text {
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  color: var(--text-tertiary);
}
```

### Checkbox - Dark Mode with Glow
```css
[data-theme="dark"] .checkbox {
  border-color: var(--amoled-border);
  background: var(--amoled-surface-2);
}

[data-theme="dark"] .checkbox--checked {
  background: var(--color-success);
  border-color: var(--color-success);
  box-shadow: 0 0 12px #34C759; /* Zöld glow */
}
```

### FAB - Dark Mode Premium Gradient
```css
[data-theme="dark"] .fab {
  background: linear-gradient(135deg, #78C8FF 0%, #B4AAFF 100%);
  box-shadow:
    0 10px 28px #000000,
    0 0 24px #78C8FF;
}
```

### Header - Dark Mode Glassmorphism
```css
[data-theme="dark"] .header {
  background: rgba(28, 28, 30, 0.7);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

/* Header subtitle - fehér szöveg dark mode-ban */
[data-theme="dark"] .header__subtitle {
  color: #FFFFFF;
}
```

### Modal - Dark Mode
```css
[data-theme="dark"] .modal-backdrop {
  background: #000000;
}

[data-theme="dark"] .modal-content {
  background: var(--amoled-surface-3);
  border: 1px solid var(--amoled-border);
  color: var(--amoled-text-primary);
}
```

### Editor Components - Dark Mode Aura
```css
/* TodoEditor - items-list aura effect */
[data-theme="dark"] .items-list {
  background: var(--amoled-surface-1) !important;
  border: 1px solid var(--amoled-border);
}

[data-theme="dark"] .items-list::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(
    circle at 15% 10%,
    var(--card-tint, rgba(255, 255, 255, 0.10)) 0%,
    transparent 55%
  );
  z-index: 0;
  border-radius: 12px;
}

/* NoteEditor - textarea gradient stack */
[data-theme="dark"] .textarea {
  background: var(--amoled-surface-1);
  background-image: radial-gradient(
    circle at 15% 10%,
    var(--card-tint, rgba(255, 255, 255, 0.10)) 0%,
    transparent 55%
  ),
  radial-gradient(
    circle at 100% 100%,
    var(--amoled-surface-1) 0%,
    var(--amoled-surface-1) 100%
  );
}
```

### Theme Detection & Toggle
```typescript
// theme.ts - automatikus rendszer detektálás
function initTheme(): void {
  const systemPref = detectSystemTheme(); // 'dark' | 'light'
  clearSessionTheme(); // Minden indításkor friss detektálás
  applyTheme(systemPref); // System preference alkalmazása
}

// Session toggle - sessionStorage-ban tárolva
async function toggleTheme(): Promise<void> {
  const current = get(currentThemeWritable);
  const newTheme = current === 'light' ? 'dark' : 'light';
  setSessionTheme(newTheme); // Session-only, nem persistent
  applyTheme(newTheme);
}
```

### Dark Mode Best Practices
1. **Használd a CSS változókat** - `--amoled-*` prefix az AMOLED tokenekhez
2. **Kategória dinamikus színek** - `getDarkTint()` és `getGlowColor()` helper függvények
3. **Z-index layering** - aura overlay (0), content (1), fixed elemek (2+)
4. **Absolute positioning megtartása** - explicit override szükséges az aura overlay után
5. **Scrollbar styling** - `rgba(255, 255, 255, 0.4)` dark mode-ban
6. **Border kontrasztok** - `rgba(255, 255, 255, 0.3)` inputoknál, `var(--amoled-border)` kártyáknál

---

## ♿ Accessibility

### Focus States
```css
/* Keyboard focus jelzés */
*:focus-visible {
  outline: 2px solid var(--color-info);
  outline-offset: 2px;
}

/* Touch eszközön nincs focus ring */
@media (hover: none) {
  *:focus-visible {
    outline: none;
  }
}
```

### Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### High Contrast
```css
@media (prefers-contrast: high) {
  .card {
    border: 2px solid var(--text-primary);
  }
  
  .button {
    border: 2px solid currentColor;
  }
}
```

---

## 📱 Responsive Breakpoints
```css
/* Mobile First Breakpoints */
$breakpoints: (
  'sm': 640px,   /* Landscape phones, tablets */
  'md': 768px,   /* Tablets */
  'lg': 1024px,  /* Desktop */
  'xl': 1280px   /* Large desktop */
);

/* Safe area padding iOS */
.safe-area {
  padding-top: env(safe-area-inset-top);
  padding-right: env(safe-area-inset-right);
  padding-bottom: env(safe-area-inset-bottom);
  padding-left: env(safe-area-inset-left);
}
```

---

## 🎯 Component States

### Loading State
- Skeleton screens minden komponenshez
- Smooth fade-in amikor betöltődött
- Progress indicator hosszabb műveleteknél

### Empty State
- Barátságos illusztráció vagy ikon
- Rövid, motiváló szöveg
- Akció gomb új tartalom létrehozásához

### Error State
- Piros border vagy háttér
- Tiszta hibaüzenet
- Javítási javaslat

### Success State
- Zöld checkmark animáció
- Rövid success toast
- Auto-dismiss 3mp után

---

## 📦 Export Settings

### CSS Custom Properties Export
```javascript
// Minden design token elérhető JavaScript-ből
const getDesignToken = (token) => {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(token);
};

// Példa használat
const primaryColor = getDesignToken('--color-lavender');
```

### Svelte Component Props
```typescript
// Közös prop típusok
interface ColorProp {
  color: 'lavender' | 'peach' | 'mint' | 'sky' | 'rose' | 'lemon' | 'sage' | 'coral';
}

interface SizeProp {
  size: 'small' | 'medium' | 'large';
}

interface VariantProp {
  variant: 'primary' | 'secondary' | 'danger' | 'ghost';
}
```

---

## 🚀 Performance Guidelines

### CSS Optimizations
- CSS változók használata ismétlődő értékekhez
- GPU-accelerált animációk (transform, opacity)
- Will-change használata kritikus animációknál
- Containment API nagy listákhoz

### Asset Loading
- Lazy loading képekhez
- Critical CSS inline
- Font-display: swap a webfontokhoz
- SVG ikonok inline használata

---

## 📝 Implementation Notes

### General Guidelines
1. **Mobile First**: Minden komponens először mobilra optimalizálva
2. **Touch Friendly**: Min. 44x44px touch target
3. **Smooth Animations**: 60 FPS cél minden animációnál
4. **Progressive Enhancement**: Alapfunkciók működnek JavaScript nélkül is
5. **Semantic HTML**: Megfelelő HTML elemek használata
6. **ARIA Labels**: Minden interaktív elemhez
7. **Keyboard Navigation**: Tab order, focus trap modálokban
8. **Color Contrast**: WCAG AAA szintű kontraszt arány

### Dark Mode Implementation Checklist
1. **Theme Detection**:
   - App induláskor automatikus rendszer detektálás
   - `initTheme()` törli a sessionStorage-t és alkalmazza a system preference-t
   - Toggle button sessionStorage-ba ment (nem persistent)

2. **CSS Architecture**:
   - AMOLED tokenek a `:root`-ban definiálva
   - `[data-theme="dark"]` szelektorral override-olva
   - Dark kategória színek és glow színek elkülönítve

3. **Card Components**:
   - `::before` pseudo-element az aura overlay-hez
   - Radial gradient `circle at 15% 10%` pozícióval
   - Z-index layering: overlay (0), content (1), fixed elemek (2+)
   - Absolute positioned elemek explicit override-ja szükséges

4. **Dynamic Colors**:
   - `getDarkTint(hexColor)` - dark kategória szín visszaadása
   - `getGlowColor(hexColor)` - glow szín visszaadása
   - CSS változók injektálása: `style:--card-tint={cardTint}`

5. **Editor Components**:
   - TodoEditor: `.items-list::before` aura overlay
   - NoteEditor: `.textarea` background-image gradient stack
   - Content z-index: 1 az overlay fölött

6. **Common Pitfalls**:
   - ⚠️ `position: relative` az aura overlay miatt - explicit `position: absolute` override szükséges
   - ⚠️ Scrollbar styling dark mode-ban: `rgba(255, 255, 255, 0.4)`
   - ⚠️ Border kontrasztok: inputoknál világosabb, kártyáknál `--amoled-border`
   - ⚠️ Delete button z-index: 2 (overlay és content fölött)

---

## 🎨 Quick Start CSS
```css
/* App.css alapok */
@import './design-tokens.css';

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: var(--font-system);
  font-size: var(--text-base);
  line-height: var(--leading-normal);
  color: var(--text-primary);
  background: var(--bg-secondary);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.app-container {
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
}

/* iOS rubber band effect */
.ios-bounce {
  -webkit-overflow-scrolling: touch;
}

/* Disable iOS tap highlight */
* {
  -webkit-tap-highlight-color: transparent;
}
```

Ez a Design System biztosítja a modern, iOS-szerű megjelenést a Notizz alkalmazáshoz! 🎨