# 📸 Multi-Event PhotoBooth Setup

## Estructura de Assets por Evento

Cada evento debe tener su propia carpeta en `/public/events/` con los siguientes archivos:

```
public/
└── events/
    ├── boda-principal/
    │   ├── marco.png      # Marco personalizado del evento
    │   └── background.jpg # Fondo personalizado del evento
    ├── boda-maria-juan/
    │   ├── marco.png      # Marco personalizado del evento
    │   └── background.jpg # Fondo personalizado del evento
    └── otro-evento/
        ├── marco.png
        └── background.jpg
```

## URLs de Acceso

Cada evento tendrá su propia URL única:

- **Evento Principal**: `https://tu-dominio.com/boda-principal`
- **Evento María y Juan**: `https://tu-dominio.com/boda-maria-juan`
- **Otro Evento**: `https://tu-dominio.com/otro-evento`

## Configuración de Nuevo Evento

Para agregar un nuevo evento:


3. **Configurar admin** en Supabase (tabla `admins` - agregar email del admin)
4. **Compartir URL** con el cliente: `https://tu-dominio.com/nombre-del-evento`

## Storage en Firebase

Las fotos se organizan automáticamente por evento:

```
Firebase Storage/
└── photos/
    ├── boda-principal/
    │   ├── 1704067200000.png
    │   └── 1704067260000.png
    ├── boda-maria-juan/
    │   ├── 1704067200000.png
    │   └── 1704067260000.png
    └── otro-evento/
        ├── 1704067200000.png
        └── 1704067260000.png
```

## Rutas Disponibles por Evento

Cada evento tiene las siguientes rutas:

- `/evento-slug` - Pantalla de bienvenida
- `/evento-slug/choose` - Seleccionar acción (foto o galería)
- `/evento-slug/photo` - Cámara para tomar fotos
- `/evento-slug/gallery` - Galería de fotos del evento
- `/evento-slug/admin` - Panel de administración del evento

## Consideraciones Técnicas

- Las fotos se almacenan separadamente por evento en Firebase Storage
- Cada evento puede tener sus propios administradores
- Los assets (marco y fondo) se cargan dinámicamente según el evento
- El sistema es completamente escalable para agregar nuevos eventos
