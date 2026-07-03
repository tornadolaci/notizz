# 🎨 Design Token Table — Notizz

**Light Mode vs Dark Mode (AMOLED Premium Glow)**

> **Single source of truth:** [`src/app.css`](src/app.css) (`:root` és
> `[data-theme="dark"]` blokkok). Ez a dokumentum csak emberi olvasásra szánt
> tükör — ha eltér a kódtól, a kód a mérvadó. Komponensszinten nincs hardcoded
> HEX: minden szín tokenből (`var(--…)`) jön.

---

## 🧱 1. Background & Surface Tokens

| Token | Light (HEX) | Dark (HEX) | Usage |
|:--|:-:|:-:|:--|
| `--bg-primary` | `#FFFFFF` | `#07080D` (`--amoled-bg`) | App fő háttér |
| `--bg-secondary` | `#F6F7FB` | `#07080D` (`--amoled-bg`) | Oldal / listák |
| `--bg-tertiary` | `#ECEEF4` | `rgba(255,255,255,0.06)` | Inputok, sávok |
| `--surface-1` | `#FFFFFF` | `#111421` (`--amoled-surface-1`) | Kártyák |
| `--surface-2` | `#F7F8FC` | `#151A2A` (`--amoled-surface-2`) | Input, inner panel |
| `--surface-3` | `#EEF0F6` | `#1B2134` (`--amoled-surface-3`) | Modal, aktív elem |

A body háttere világosban `linear-gradient(180deg, #F9FAFD 0%, #F3F4F9 100%)`,
sötétben `linear-gradient(180deg, #07080D, #0B1020)`.

🧠 **Elv:** Light = fehér + levegő · Dark = rétegzett, AMOLED-barát sötétkékek.

---

## ✍️ 2. Text Tokens

| Token | Light | Dark | Usage |
|:--|:-:|:-:|:--|
| `--text-primary` | `#1B1C22` | `#F2F3F7` | Címek, fő szöveg |
| `--text-secondary` | `#4B4E5E` | `#C9CAD3` | Leírás, lista |
| `--text-tertiary` | `#8C8FA1` | `#8F90A0` | Meta, timestamp |
| `--text-disabled` | `#C6C8D2` | `#5C5D6A` | Disabled állapot |

🧠 **Fontos:** Completed todo **nem tűnik el**, csak optikailag hátralép.

---

## 🪟 3. Border & Divider Tokens

| Token | Light | Dark | Usage |
|:--|:-:|:-:|:--|
| `--border-light` | `#E2E4ED` | `#2A2F40` (`--amoled-border`) | Input, card edge |
| `--border-medium` | `#D2D5E2` | `#2A2F40` (`--amoled-border`) | Checkbox |
| `--divider` | `#E6E8F0` | `#1E2230` (`--amoled-divider`) | Elválasztók |

---

## 🔵 4. Brand Accent (elegáns kék)

A régi lila gradiens (`#667eea → #764ba2`) helyett egységes kék brand-akcens.
Minden gomb, cím-gradiens, FAB és avatar ezekből épül fel. A **kártyák** (pasztell
színek + gradiens/aura) **NEM** használják ezt — érintetlenek.

| Token | Érték | Usage |
|:--|:-:|:--|
| `--brand-500` | `#2F80ED` | Elsődleges kék |
| `--brand-400` | `#5DA9FF` | Világosabb kék |
| `--brand-600` | `#1E63C4` | Mélyebb kék (hover/press) |
| `--brand-gradient` | `linear-gradient(135deg, #5DA9FF 0%, #2F80ED 100%)` | Gombok, FAB, avatar |
| `--brand-gradient-text` | `linear-gradient(90deg, #5DA9FF, #2F80ED)` | Cím-gradiensek (clip: text) |
| `--brand-shadow` | `rgba(47,128,237,0.35)` | Akcens árnyék |
| `--brand-shadow-soft` | `rgba(47,128,237,0.20)` | Lágy akcens árnyék |

Használat: elsődleges gombok, login/submit gombok, `AuthGate`/`AuthModal`/
`Header`/Beállítások/`reset-password` cím-gradiensek, Beállítások avatar, FAB.

---

## 🎴 5. Category Base Colors (Shared Semantic)

Jelentés-alapú színek; light & dark másképp használja őket. A kártya `color`
mezője ezt a HEX-et tárolja.

| Category | Base (HEX) | Token | Jelentés |
|:--|:-:|:--|:--|
| Lavender | `#E6E6FA` | `--color-lavender` | Jegyzetek |
| Peach | `#FFDAB9` | `--color-peach` | Fontos todók |
| Mint | `#B2DFDB` | `--color-mint` | Befejezett feladatok |
| Sky | `#87CEEB` | `--color-sky` | Általános todók |
| Rose | `#FFB6C1` | `--color-rose` | Sürgős jegyzetek |
| Lemon | `#FFFACD` | `--color-lemon` | Ötletek |
| Sage | `#B2D3C2` | `--color-sage` | Projektek |
| Coral | `#FFB5A7` | `--color-coral` | Személyes |

---

## 🌗 6. Category Usage — Light vs Dark

**Light Mode (Gradient Fill):** `linear-gradient(145deg, <base-color> 0%, #FFFFFF 85%)`
— a kártya `--card-color` változóján keresztül.

**Dark Mode (Aura + Glow):** `--amoled-surface-1` alap + kategória `radial-gradient`
aura (`circle at 15% 10%`) + glow-színű hover shadow.

---

## 🌙 7. Dark Mode Category Tints

| Category | Dark Tint | Glow Color |
|:--|:-:|:-:|
| Lavender | `#2A2442` | `#B4AAFF` |
| Peach | `#3A261D` | `#FFB478` |
| Mint | `#163336` | `#78FFDC` |
| Sky | `#152B3A` | `#78C8FF` |
| Rose | `#3A1E2B` | `#FF78A0` |
| Lemon | `#3A3516` | `#FFF5AA` |
| Sage | `#1E3228` | `#96DCB4` |
| Coral | `#3A201A` | `#FF8C78` |

🧠 **Szabály:** `--dark-*` → aura / gradient alap · `--glow-*` → hover, highlight.

---

## 📊 8. Progress Indicator

| Property | Light | Dark |
|:--|:-:|:-:|
| Bar magasság | `10px` | `10px` |
| Track | `#E6E8F0` | `rgba(255,255,255,0.08)` |
| Fill | `linear-gradient(90deg, #5DA9FF 0%, #2F80ED 100%)` | `#007AFF` (egyszínű) |
| Text | `#2F80ED` | `var(--text-tertiary)` (`#8F90A0`) |

---

## ✅ 9. Checkbox

| State | Light | Dark |
|:--|:-:|:-:|
| Border | `#D2D5E2` | `#2A2F40` |
| Background | `#FFFFFF` | `#151A2A` |
| Checked BG | `#34C759` | `#34C759` (+ zöld glow) |
| Checkmark | `#FFFFFF` | `#FFFFFF` |

---

## ➕ 10. Floating Action Button (FAB)

| Property | Light | Dark |
|:--|:-:|:-:|
| Gradient | `linear-gradient(135deg, #2F80ED 0%, #5DA9FF 50%, #91EAE4 100%)` | `linear-gradient(135deg, #78C8FF 0%, #2F80ED 100%)` |
| Shadow | `0 12px 30px var(--brand-shadow)` | `0 10px 28px rgba(0,0,0,.60)`, `0 0 30px rgba(120,200,255,.25)` |
| Hover shadow | `0 16px 40px var(--brand-shadow)` | `+ 0 0 40px rgba(120,200,255,.35)` |
| Size | `64px` | `64px` |

---

## 🧭 11. Header

| Token | Light | Dark |
|:--|:-:|:-:|
| BG | `linear-gradient(180deg, #FFFFFF 0%, #F4F6FB 100%)` | `rgba(28,28,30,0.7)` + blur(20px) |
| Title Gradient | `var(--brand-gradient-text)` (`#5DA9FF → #2F80ED`) | ugyanaz |
| Subtitle | `#8C8FA1` | `#FFFFFF` |

---

## 🪟 12. Editor (Opened Todo List / Note)

| Element | Light | Dark |
|:--|:-:|:-:|
| Editor BG | `linear-gradient(145deg, #F7F8FC 0%, #FFFFFF 85%)` | `--amoled-surface-1` + aura |
| Inner panel | `#FFFFFF` (áttetsző) | `#151A2A` |
| Close / action | Fehér + kék outline | Sötét surface + glow |

---

## 🚨 13. Semantic State Colors

| State | Token | HEX |
|:--|:--|:-:|
| Success | `--color-success` | `#34C759` |
| Warning | `--color-warning` | `#FF9500` |
| Error | `--color-error` | `#FF3B30` |
| Info | `--color-info` | `#007AFF` |

> Megjegyzés: a korábbi `--color-urgent` (`#FF6B6B`) nincs definiálva az
> `app.css`-ben; sürgős kiemeléshez az `--color-error`-t használjuk.

---

## 🧠 14. Mentális modell

**Light Mode:** „Air · Soft · Calm · Productive"
**Dark Mode:** „Depth · Glow · Focus · Premium"
**Accent:** „Elegant Blue" — nyugodt, letisztult, nem harsány.

---

## ✅ Definition of Done (Design Tokens)

- minden szín **tokenből jön** (`var(--…)`), nincs hardcoded HEX komponensszinten
- light & dark **vizuálisan párban**
- a brand-akcens **kék**, sehol nincs lila/gradiens „AI-slop"
- a **kártyák** pasztell színei és gradiens/aura jellege **érintetlen**
- új komponens token-alapú, és `src/app.css`-ből örökli az értékeket
