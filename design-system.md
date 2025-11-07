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
  
  /* Sötét téma */
  --dark-bg-primary: #1C1C1E;
  --dark-bg-secondary: #2C2C2E;
  --dark-bg-tertiary: #3A3A3C;
  --dark-text-primary: #FFFFFF;
  --dark-text-secondary: #EBEBF5;
  --dark-text-tertiary: #ABABBB;
  --dark-border: rgba(255, 255, 255, 0.1);
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
  
  /* iOS-szerű árnyék - Mérsékelt */
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

/* Sürgős kártya */
.card--urgent {
  border: 2px solid var(--color-urgent);
  box-shadow: 
    0 0 0 1px var(--color-urgent),
    0 4px 12px rgba(255, 107, 107, 0.2);
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 
    0 4px 12px rgba(102, 126, 234, 0.4),
    0 8px 24px rgba(102, 126, 234, 0.2);
  
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
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
  height: 6px;
  background: var(--bg-tertiary);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea, #764ba2);
  border-radius: 3px;
  transition: width 300ms ease;
}

.progress-text {
  min-width: 50px;
  text-align: right;
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

## 🌗 Dark Mode

### Dark Theme Overrides
```css
[data-theme="dark"] {
  /* Háttér színek */
  --bg-primary: var(--dark-bg-primary);
  --bg-secondary: var(--dark-bg-secondary);
  --bg-tertiary: var(--dark-bg-tertiary);

  /* Szöveg színek */
  --text-primary: var(--dark-text-primary);
  --text-secondary: var(--dark-text-secondary);
  --text-tertiary: var(--dark-text-tertiary);

  /* Határok */
  --border-light: var(--dark-border);
  --border-medium: var(--dark-border);

  /* Kártya háttérszín sötét módban */
  --card-bg-dark: #1C1C1E;

  /* Panel színek halványítva */
  .card {
    opacity: 0.95;
    background: var(--card-bg-dark) !important;
  }

  /* Glass effect sötétben */
  .card--glass {
    background: rgba(30, 30, 30, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
}
```

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

1. **Mobile First**: Minden komponens először mobilra optimalizálva
2. **Touch Friendly**: Min. 44x44px touch target
3. **Smooth Animations**: 60 FPS cél minden animációnál
4. **Progressive Enhancement**: Alapfunkciók működnek JavaScript nélkül is
5. **Semantic HTML**: Megfelelő HTML elemek használata
6. **ARIA Labels**: Minden interaktív elemhez
7. **Keyboard Navigation**: Tab order, focus trap modálokban
8. **Color Contrast**: WCAG AAA szintű kontraszt arány

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