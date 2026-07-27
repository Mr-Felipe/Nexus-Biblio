# Respaldo - Login y Registro Original

## Descripción
Esta carpeta contiene el código original del login y registro que estaba integrado directamente en los archivos principales de la aplicación antes de ser extraído a un componente separado.

## Fecha del respaldo
Antes del 24/07/2026

## Archivos incluidos

### `backup-login-original.html`
- Template HTML original del login/registro
- Estaba integrado en `app.html` dentro de `@if (!state.currentUser())`
- Incluía formulario de login y registro inline
- Credenciales de prueba dentro del formulario de login

### `backup-login-original.ts`
- Métodos TypeScript originales de login/registro
- Estaban integrados en `app.ts`
- Incluía:
  - `showRegisterForm` signal
  - `showPassword` signal
  - `loginForm` FormGroup
  - `registerForm` FormGroup
  - `useCredentials()` method
  - `openRegisterForm()` method
  - `registerUser()` method
  - `onLoginSubmit()` method

## Cambios realizados
El código fue extraído a un componente separado en:
- `components/auth/login/login.component.ts`
- `components/auth/login/login.component.html`
- `components/auth/login/login.component.css`

Los cambios incluyeron:
1. Layout dividido (login izquierda, mensaje derecha)
2. Animación flip al cambiar entre login/registro
3. Credenciales de prueba movidas al div del mensaje
4. Diseño mantenido con Material Icons y estilos de biblioteca
