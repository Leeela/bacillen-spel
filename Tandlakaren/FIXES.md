# Tandlakaren-spelet — Viktiga fixes

## 🌳 Träd-logik (STABIL)

**PROBLEM:** Träd placerades baserat på pixel-position (`Math.floor(b.x / (VW*0.3)) % 2`), vilket glitchade när byggnader återanvändes.

**LÖSNING:** Varje byggnad har nu ett `hasTree` boolean-värde som tilldelas vid skapandet och bevaras när byggnaden återanvänds.

### Implementerad i:

1. **mkBuilding()** — initieras när byggnad skapas:
   ```javascript
   const hasTree = Math.random() < 0.6;
   return { x, w, h, color, hasTree };
   ```

2. **update()** — byggnaders respawn (när de rullar av skärmen):
   ```javascript
   if (b.x + b.w < 0) {
     // ...
     b.hasTree = Math.random() < 0.6;
   }
   ```

3. **drawBackground()** — rendering:
   ```javascript
   if (b.hasTree) {
     drawTree(b.x + b.w + VW*0.02, GY);
   }
   ```

## ⚠️ Varning för framtida ändringar

- **Ändra INTE träd-logiken utan att uppdatera alla tre ställen ovan**
- Om du skriver om `mkBuilding()` eller `update()` buildings-logiken — se till att `hasTree` bevaras
- Träden rör sig nu stabilt med sina byggnader 🌳

---

**Status:** ✅ Fungerar perfekt från 2026-04-17 och framåt
