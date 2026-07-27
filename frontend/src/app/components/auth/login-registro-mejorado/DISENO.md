# BiblioLib - Design System

## Paleta de Colores

| Token | Hex | Uso |
|-------|-----|-----|
| `--bg` | `#F8F3EA` | Fondo general de la página |
| `--white` | `#FFFFFF` | Blanco puro |
| `--card` | `#FCFAF7` | Fondo de tarjetas y paneles de formulario |
| `--primary` | `#232233` | Color principal (oscuro tipo navy/purple) |
| `--secondary` | `#D9C997` | Color secundario (dorado/beige) |
| `--secondary-dark` | `#CDBA84` | Variante oscura del secundario |
| `--text` | `#54546A` | Color de texto principal |
| `--placeholder` | `#A0A0B2` | Color de placeholder en inputs |
| `--border` | `#DDD4BE` | Color de bordes |

### Combinaciones comunes
- **Fondo claro:** `--bg` (`#F8F3EA`)
- **Panel de formulario:** `--card` (`#FCFAF7`)
- **Panel informativo:** `--secondary` (`#D9C997`)
- **Texto sobre fondo claro:** `--text` (`#54546A`)
- **Texto sobre --secondary:** `--primary` (`#232233`)
- **Botones primarios:** fondo `--primary`, texto `--white`
- **Bordes de inputs:** `--border` (`#DDD4BE`)

---

## Tipografía

### Fuentes
| Fuente | Tipo | Uso |
|--------|------|-----|
| **Poppins** | Sans-serif | Texto general, inputs, párrafos, botones |
| **Cormorant Garamond** | Serif | Títulos, headings, logo |

### Pesos disponibles
- Poppins: 300, 400, 500, 600
- Cormorant Garamond: 500, 600, 700

### Jerarquía
- **Logo / Títulos principales:** Cormorant Garamond 700
- **Subtítulos de sección:** Cormorant Garamond 600
- **Etiquetas de inputs (label):** Poppins 600, uppercase, letterSpacing
- **Textos de cuerpo:** Poppins 400
- **Placeholder:** Poppins 400
- **Botones:** Poppins 600

---

## Iconos

**Librería:** Font Awesome 6.6.0

### Iconos en uso
| Icono | Clase | Uso |
|-------|-------|-----|
| Libro abierto | `fa-solid fa-book-open` | Logo de BiblioLib |
| Usuario | `fa-solid fa-user` | Campo nombre |
| Teléfono | `fa-solid fa-phone` | Campo celular |
| Sobre | `fa-regular fa-envelope` | Campo correo |
| Dirección | `fa-solid fa-location-dot` | Campo dirección |
| Escudo/rol | `fa-solid fa-shield-halved` | Campo rol |
| Candado | `fa-solid fa-lock` | Campo contraseña |
| Ojo | `fa-regular fa-eye` | Mostrar contraseña |
| Ojo tachado | `fa-regular fa-eye-slash` | Ocultar contraseña |
| Agregar usuario | `fa-solid fa-user-plus` | Botón crear cuenta |
| Flecha derecha | `fa-solid fa-arrow-right` | Botón login / links |

---

## Formas y Bordes Redondeados

| Elemento | Border-radius |
|----------|---------------|
| Paneles principales (container) | `25px` |
| Inputs | `14px` |
| Botones | `14px` |
| Toggle contraseña | `12px` |
| Scrollbar thumb | `20px` |
| Header mobile (registro) | `25px 25px 0 0` |
| Footer mobile (registro) | `0 0 25px 25px` |
| Header mobile (login) | `25px 25px 0 0` |
| Footer mobile (login) | `0 0 25px 25px` |

### Variable global
```css
--radius: 22px; /* registro */
--radius: 24px; /* login */
```

---

## Sombras

```css
/* Registro */
--shadow: 0 18px 40px rgba(0, 0, 0, .12);

/* Login */
--shadow: 0 20px 45px rgba(0, 0, 0, .12);
```

Se aplica a:
- Paneles del formulario
- Paneles informativos
- Header mobile
- Footer mobile

---

## Transiciones

```css
--transition: .30s ease;
```

Se usa en:
- Hover de botones
- Hover de inputs (cambio de borde)
- Hover de links
- Cambios de estado de toggle contraseña

---

## Layout

### Desktop (> 992px)
- Container: `width: min(1350px, 95%)`, centrado con `margin: auto`
- Min-height: `100vh`
- Display: `flex` con `align-items: stretch`
- Padding: `20px 0`
- Dos paneles lado a lado:
  - Formulario: `flex: 1`
  - Info panel: `flex: .65` (registro) / `flex: .82` (login)
- Header y footer mobile: `display: none`

### Tablet (768px - 992px)
- Header y footer mobile se muestran
- Panel informativo se oculta (`display: none`)
- Formulario toma `width: 100%`
- Container: `flex-direction: column`
- Padding container: `12px 0`

### Mobile (< 768px)
- Mismo que tablet pero con tamaños de fuente reducidos
- Header: padding `24px`
- Footer: padding `28px 24px`

---

## Componentes

### Inputs
- Bordes: `1px solid var(--border)`
- Border-radius: `14px`
- Padding: `14px 16px`
- Fondo: `var(--white)`
- Placeholder color: `var(--placeholder)`
- Focus: borde `var(--secondary-dark)`
- Icono izquierdo con `padding-left: 48px`

### Botones primarios
- Fondo: `var(--primary)`
- Color texto: `var(--white)`
- Border-radius: `14px`
- Padding: `16px 30px`
- Font: Poppins 600
- Hover: opacidad o cambio de color

### Botón outline (footer mobile)
- Sin fondo, borde `2px solid rgba(35,34,51,.35)`
- Border-radius: `14px`
- Hover: fondo `var(--primary)`, texto blanco

### Links
- Color: `var(--secondary-dark)`
- Text-decoration: none
- Hover: underline

---

## Estructura de Archivos

```
login y registro/
├── registro.html
├── registro.css
├── login.html
├── login.css
├── script.js
└── DISNEÑO.md
```

---

## Notas para desarrollo

1. **Consistencia de colores:** Usar siempre las variables CSS definidas en `:root`
2. **Bordes redondeados:** El diseño es "round-friendly", todos los elementos tienen border-radius generoso (14px-25px)
3. **Sombras suaves:** Usar sombras con opacidad baja (0.12) para efectos sutiles
4. **Mobile-first:** El layout está pensado para funcionar en desktop y mobile con los mismos archivos CSS usando media queries
5. **Flexbox:** Todo el layout se basa en flexbox, no grid
6. **Animaciones:** Usar `fadeUp` para entrada de elementos con `animation: fadeUp .8s ease`
