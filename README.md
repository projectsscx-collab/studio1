
# Documento de Diseño Técnico y Funcional: Prototipo MAPFRE

## Control de Cambios en el Documento

### Registro de Versiones
| Versión | Fecha      | Resumen                                                               | Autor                  |
|---------|------------|-----------------------------------------------------------------------|------------------------|
| v 1.0   | 01/08/2024 | Creación inicial del documento de diseño para el prototipo de formulario inteligente. | Gemini (Asistente de IA) |

### Autorizaciones

| Rol         | Nombre | Fecha |
|-------------|--------|-------|
| **Preparación** |        |       |
| **Revisión**    |        |       |
| **Aprobación**  |        |       |

---
*El siguiente documento es una representación del diseño técnico y funcional del prototipo desarrollado. Su propósito es servir como guía y documentación del trabajo realizado.*

---

## Índice
- [1. Requerimiento](#1-requerimiento)
  - [1.1. Título](#11-título)
  - [1.2. Descripción](#12-descripción)
- [2. Diseño Funcional](#2-diseño-funcional)
  - [2.1. Flujo del Formulario Multi-paso](#21-flujo-del-formulario-multi-paso)
- [3. Diseño Técnico](#3-diseño-técnico)
  - [3.1. Arquitectura General](#31-arquitectura-general)
  - [3.2. Estructura de Componentes React](#32-estructura-de-componentes-react)
  - [3.3. Flujo de Integración con Salesforce](#33-flujo-de-integración-con-salesforce)
- [4. Estimación de Esfuerzos](#4-estimación-de-esfuerzos)
  - [4.1. Estimación Propuesta](#41-estimación-propuesta)


## 1. Requerimiento

### 1.1. Título
Prototipo de Formulario Inteligente para la Captura de Leads de Seguros de Auto.

### 1.2. Descripción
Se necesita un prototipo funcional de una aplicación web que permita a los usuarios solicitar una cotización para un seguro de automóvil a través de un formulario dinámico y guiado. La aplicación debe recoger los datos del cliente y su vehículo en varios pasos, y finalmente, enviar la información a Salesforce para la creación de un nuevo *Lead*.

El formulario debe ser intuitivo, validar los datos en tiempo real y ofrecer una experiencia de usuario fluida, culminando en una pantalla de confirmación que muestre el identificador de la operación devuelto por Salesforce.

## 2. Diseño Funcional

### 2.1. Flujo del Formulario Multi-paso
El proceso de captura de datos se divide en tres pasos principales para simplificar la experiencia del usuario y reducir la carga cognitiva.

#### **Paso 1: Datos Personales y de Contacto**
- **Objetivo:** Recopilar la información básica del solicitante.
- **Campos:**
  - Nombre y Apellido
  - Tipo y Número de Documento
  - Fecha de Nacimiento (con selector de calendario amigable)
  - Teléfono Móvil y Teléfono Fijo
  - Correo Electrónico
- **Funcionalidad:** Todos los campos incluyen validación en tiempo real para asegurar que los datos son correctos y completos antes de proceder.

#### **Paso 2: Datos del Vehículo**
- **Objetivo:** Recopilar la información específica del vehículo a asegurar.
- **Campos:**
  - Número de Matrícula
  - Marca
  - Modelo
  - Año del Vehículo
  - Número de Serie
- **Funcionalidad:** El usuario introduce los detalles del vehículo, que se utilizarán para construir el objeto `risk` en el payload final de Salesforce.

#### **Paso 3: Cotización y Pago**
- **Objetivo:** Recopilar los detalles finales de la póliza y las preferencias de pago.
- **Campos:**
  - Fecha de Efectividad y Expiración (con selector de calendario amigable)
  - Prima Neta (campo de solo lectura)
  - Método, Periodicidad y Plazo de Pago (listas desplegables)
- **Funcionalidad:** En esta pantalla final, se muestra una previsualización del `JSON` completo que será enviado a Salesforce. Esto permite una verificación final de todos los datos recopilados antes del envío. Al hacer clic en "Enviar", se inicia la comunicación con Salesforce.

#### **Paso 4: Confirmación de Envío**
- **Objetivo:** Informar al usuario que su solicitud ha sido procesada con éxito.
- **Funcionalidad:** Si el envío a Salesforce es exitoso, la pantalla muestra un mensaje de confirmación, un ícono de éxito y, crucialmente, el **ID de la Operación** (`idFullOperation`) devuelto por Salesforce. Esto proporciona una referencia clara y tangible del registro.

## 3. Diseño Técnico

### 3.1. Arquitectura General
El prototipo está construido sobre un stack tecnológico moderno y robusto.

- **Frontend:** Next.js y React con TypeScript.
- **UI:** Componentes de ShadCN y estilos con Tailwind CSS.
- **Gestión de Estado y Formularios:** `react-hook-form` para una gestión eficiente y validación basada en esquemas de `zod`.
- **Backend y Lógica de Integración:** Se utiliza **Genkit**, un framework de Google para desarrollo de IA y flujos de backend, que orquesta la llamada a la API de Salesforce.

### 3.2. Estructura de Componentes React

El frontend se organiza en componentes reutilizables y especializados:

- **`page.tsx`**: Componente principal que gestiona el estado global del formulario (los datos y el paso actual), y renderiza el componente de formulario correspondiente a cada paso.
- **`form-stepper.tsx`**: Componente visual que muestra el progreso del usuario a través de los pasos del formulario.
- **`personal-details-form.tsx`, `vehicle-details-form.tsx`, `quote-form.tsx`**: Componentes para cada paso del formulario. Cada uno gestiona su propia validación de datos.
- **`submission-confirmation.tsx`**: La página final de éxito que muestra la confirmación y el ID de Salesforce.

### 3.3. Flujo de Integración con Salesforce
La comunicación con Salesforce se gestiona íntegramente en el backend a través de un flujo de Genkit.

- **`insert-lead-flow.ts`**: Este archivo define el flujo de Genkit que se encarga de:
  1.  **Autenticación**: Primero, obtiene un token de acceso de Salesforce utilizando las credenciales de cliente y la contraseña (OAuth 2.0 Password Grant Type).
  2.  **Construcción del Payload**: Recibe los datos del formulario desde el frontend y los transforma en la estructura JSON exacta que espera el endpoint `services/apexrest/core/lead/` de Salesforce.
  3.  **Llamada a la API**: Realiza una petición `POST` a la API de Salesforce, enviando el `leadPayload`.
  4.  **Manejo de Respuesta**: Captura la respuesta de Salesforce. Si es exitosa, la devuelve al frontend para que se muestre el ID de la operación. Si falla, lanza un error que se notifica al usuario mediante un `toast` de error.


## 4. Estimación de Esfuerzos

### 4.1. Estimación Propuesta
A continuación se presenta una estimación de esfuerzos para llevar este prototipo a un estado de producción, considerando desarrollo, pruebas y despliegue.

| Tarea                             | Aplica | UTES (Unidades Técnicas de Esfuerzo) |
|-----------------------------------|:------:|:------------------------------------:|
| Análisis y Diseño de Arquitectura |   Sí   |                  8                   |
| Desarrollo y Configuración        |   Sí   |                  40                  |
| Pruebas (Unitarias e Integración) |   Sí   |                  12                  |
| Documentación Técnica             |   Sí   |                  5                   |
| Despliegue y Configuración CI/CD  |   Sí   |                  8                   |
| **TOTAL**                         |        |                **73**                |
