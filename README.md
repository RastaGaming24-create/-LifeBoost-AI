# LifeBoost AI

> Tu asistente financiero inteligente para organizar tu dinero, alcanzar metas y tomar mejores decisiones.

## 🚀 Estado del proyecto

LifeBoost AI está en desarrollo activo. La base de la aplicación ya está organizada como una aplicación web con Next.js, React, TypeScript y Tailwind CSS.

### Actualmente incluye

- Landing page renovada y responsive.
- Dashboard financiero inicial.
- Navegación funcional entre las secciones principales.
- Secciones de Finanzas, Metas y Asistente IA.
- Configuración de TypeScript, Tailwind CSS y PostCSS.
- Arquitectura preparada para conectar autenticación, base de datos y servicios de IA.

## 🧱 Stack

- **Next.js 15** — aplicación web y App Router.
- **React 19** — interfaz de usuario.
- **TypeScript** — tipado y mantenibilidad.
- **Tailwind CSS** — diseño responsive.
- **Firebase** — preparado para autenticación y datos.
- **OpenAI SDK** — preparado para funcionalidades de IA.
- **Recharts** — preparado para visualizaciones financieras.
- **Lucide React** — iconografía.

## 📁 Estructura principal

```text
-LifeBoost-AI/
├── app/
│   ├── ai/
│   ├── dashboard/
│   ├── finances/
│   ├── goals/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── dashboard/
│   ├── Card.tsx
│   ├── Logo.tsx
│   └── Navbar.tsx
├── next-env.d.ts
├── package.json
├── postcss.config.mjs
├── tailwind.config.ts
└── tsconfig.json
```

## 🛠️ Instalación

Requisitos: Node.js 18.18+ o una versión LTS reciente.

```bash
npm install
npm run dev
```

Después abre `http://localhost:3000` en el navegador.

## 🔎 Verificación

Antes de publicar cambios:

```bash
npm run typecheck
npm run build
```

## 🗺️ Próximas etapas

1. Autenticación segura de usuarios.
2. Base de datos para ingresos, gastos, cuentas y metas.
3. Formularios para registrar movimientos.
4. Cálculo real de patrimonio, flujo de caja y ahorro.
5. Gráficas financieras interactivas.
6. Asistente IA conectado mediante rutas del servidor.
7. Alertas y recomendaciones personalizadas.
8. Experiencia móvil y PWA.
9. Seguridad, validación y manejo de errores de producción.

## 🔐 Seguridad

Las claves privadas y secretos nunca deben colocarse en componentes del navegador ni subirse al repositorio. Las integraciones sensibles deben ejecutarse del lado del servidor mediante variables de entorno.

## 📌 Objetivo

Convertir LifeBoost AI en una plataforma práctica que ayude a las personas a entender su situación financiera, crear hábitos, controlar deudas, ahorrar y construir patrimonio paso a paso.
