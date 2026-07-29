package com.biblioteca.controllers;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.biblioteca.Entities.Usuario;
import com.biblioteca.Entities.UsuarioSesion;
import com.biblioteca.Services.SesionService;
import com.biblioteca.Services.UsuarioService;

import jakarta.servlet.http.HttpSession;

@CrossOrigin(origins = "http://localhost:4200", allowCredentials = "true")
@RestController
@RequestMapping("/api/sesion")
public class SesionController {

    private final SesionService sesionService;
    private final UsuarioService usuarioService;

    public SesionController(SesionService sesionService, UsuarioService usuarioService) {
        this.sesionService = sesionService;
        this.usuarioService = usuarioService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials, HttpSession session) {
        String correo = credentials.get("correoElectronico");
        String contrasena = credentials.get("contrasena");

        if (correo == null || contrasena == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("mensaje", "El correo y la contraseña son obligatorios"));
        }

        Usuario usuario = usuarioService.findByCorreo(correo.trim().toLowerCase())
            .orElse(null);

        if (usuario == null || !sesionService.checkPassword(contrasena, usuario.getContrasena())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("mensaje", "Credenciales incorrectas"));
        }

        if (!usuario.getActivo()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Map.of("mensaje", "La cuenta está desactivada. Contacte al administrador."));
        }

        UsuarioSesion usuarioSesion = new UsuarioSesion();
        usuarioSesion.setId(usuario.getId());
        usuarioSesion.setNombre(usuario.getNombreCompleto());
        usuarioSesion.setCorreo(usuario.getCorreoElectronico());
        usuarioSesion.setRol(usuario.getRol());

        sesionService.guardarUsuario(session, usuarioSesion);

        return ResponseEntity.ok(Map.of(
            "mensaje", "Inicio de sesión exitoso",
            "usuario", usuarioSesion
        ));
    }

    @PostMapping("/registro")
    public ResponseEntity<?> registro(@RequestBody Map<String, String> datos) {
        String nombre = datos.get("nombreCompleto");
        String correo = datos.get("correoElectronico");
        String contrasena = datos.get("contrasena");

        if (nombre == null || nombre.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("mensaje", "El nombre es obligatorio"));
        }
        if (correo == null || correo.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("mensaje", "El correo electrónico es obligatorio"));
        }
        if (contrasena == null || contrasena.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("mensaje", "La contraseña es obligatoria"));
        }

        correo = correo.trim().toLowerCase();

        if (usuarioService.existsByCorreo(correo)) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(Map.of("mensaje", "El correo ya se encuentra registrado"));
        }

        Usuario usuario = new Usuario();
        usuario.setNombreCompleto(nombre.trim());
        usuario.setCorreoElectronico(correo);
        usuario.setContrasena(sesionService.hashPassword(contrasena));
        usuario.setRol("ESTUDIANTE");
        usuario.setActivo(true);

        Usuario nuevoUsuario = usuarioService.save(usuario);

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
            "mensaje", "Registro exitoso",
            "id", nuevoUsuario.getId(),
            "nombre", nuevoUsuario.getNombreCompleto(),
            "rol", nuevoUsuario.getRol()
        ));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpSession session) {
        sesionService.cerrarSesion(session);
        return ResponseEntity.ok(Map.of("mensaje", "Sesión cerrada exitosamente"));
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(HttpSession session) {
        UsuarioSesion usuario = sesionService.obtenerUsuario(session);

        if (usuario == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("mensaje", "No hay una sesión activa"));
        }

        return ResponseEntity.ok(usuario);
    }
}
