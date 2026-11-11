# Noorin Website (Next.js + Tailwind CSS)

## Chalane ke liye
```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
```

## Colours / theme kahan badlein?
**Sirf ek file:** `src/app/globals.css` ka `@theme { ... }` block.

| Cheez | Variable | Tailwind class |
|---|---|---|
| Page background | `--color-background` | `bg-background` |
| Card background | `--color-surface` | `bg-surface` |
| Normal text | `--color-foreground` | `text-foreground` |
| Heading text | `--color-heading` | `text-heading` |
| Halka text | `--color-muted` | `text-muted` |
| Border | `--color-border` | `border-border` |
| Gold line | `--color-line` | `bg-line`, `border-line` |
| Primary button | `--color-primary` (+ `-hover`, `-foreground`) | `bg-primary` |
| Accent / gold | `--color-accent` (+ `-hover`, `-foreground`, `-strong`) | `bg-accent` |
| Link | `--color-link`, `--color-link-hover` | automatic (`<a>`) |

## Rules
- Component mein hex code (`#C9A24B`) ya `bg-[#...]` kabhi mat likho. Hamesha theme class use karo (`bg-primary`, `text-heading`, ...).
- Button: `className="btn btn-primary"`, `btn btn-accent`, `btn btn-outline`
- Card: `className="card"`, Input: `className="input"`, Gold line: `className="divider"`
- Fonts `@fontsource` se aate hain (self-hosted). Font badalna ho to `layout.tsx` ke imports aur `globals.css` ke `--font-display` / `--font-sans` badlo.

## Brand files
`public/brand/` mein logo aur app icon PNG hain. Favicon `src/app/favicon.ico`, `icon.png`, `apple-icon.png` se Next.js khud lagata hai.
# Ecommerce-Noorin
