# Commit 1 — Phase 1 Migration Tests

## Descripción

Este PR introduce la **Fase 1 de la migración de datos**: normalización idempotente de UUIDs, identificadores de negocio y timestamps.

### Qué se agrega

- `tests/migration.test.js`: Suite de tests que cubre 13 casos críticos:
  1. Generación de UUID v4 para clientes
  2. Preservación de UUIDs existentes (idempotencia)
  3. Diferencia de UUIDs entre clientes
  4. businessId único y compartido globalmente
  5. createdAt generado solo en datos legacy
  6. createdAt nunca sobrescrito si ya existe
  7. updatedAt válido y trackeable
  8. UUID para transacciones
  9. clientId correcto en transacciones
  10. Migración de campo `date` → `occurredAt`
  11. occurredAt existente nunca sobrescrito
  12. Datos legacy sin nuevos campos siguen siendo válidos
  13. **Idempotencia del ciclo completo**:
      ```
      legacy data
        ↓
      normalize()
        ↓
      persist (IndexedDB)
        ↓
      load()
        ↓
      normalize() nuevamente
        ↓
      MISMO id, businessId, clientId, occurredAt, createdAt
      ```

### Cambios técnicos

- **`scripts/migration.js`** ya estaba presente: módulo de normalización idempotente
- **`scripts/db.js`** ya integraba `migration.js`: las funciones `ensureClientUUIDs` y `ensureTransactionUUIDs` se invocan en `saveClient`, `saveClients`, `replaceAllClients` y `loadAllClients`
- **`tests/migration.test.js`** (nuevo): tests con fake IndexedDB + localStorage para verificar sin dependencias de navegador

### Contrato de Fase 1

- ✅ DB version = 1 (sin cambios de schema)
- ✅ keyPath = name (sin cambios)
- ✅ clients[name] como patrón de acceso en memoria (sin cambios)
- ✅ Campos UUID + metadata añadidos sin romper compatibilidad
- ✅ Normalización solo persiste cuando es necesario

### Cómo verificar

```bash
npm test
```

Todos los tests en `tests/migration.test.js` deben pasar en verde.

### Próximos pasos

Una vez este PR esté verde y mergeado:
1. **Commit 2**: Regression tests (verifica que `clients[name]`, compras, pagos, saldo, historial, dashboard, exportación sigan funcionando)
2. **Commit 3**: IndexedDB v2 (agrega stores `metadata` y `syncQueue` sin cambiar `clientsStore` ni sus keys)

---

## Checklist

- [x] Tests de migración para UUID y metadatos
- [x] Verificación de idempotencia del ciclo completo
- [x] Sin cambios en lógica de negocio
- [x] Sin cambios en schema de IndexedDB v1
- [x] PR template añadido para futuros contribuidores
