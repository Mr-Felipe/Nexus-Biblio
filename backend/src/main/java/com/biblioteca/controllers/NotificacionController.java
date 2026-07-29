package com.biblioteca.controllers;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.biblioteca.Services.NotificacionService;
import com.biblioteca.Services.SesionService;

import jakarta.servlet.http.HttpSession;

@CrossOrigin(origins = "http://localhost:4200", allowCredentials = "true")
@RestController
@RequestMapping("/api/notificaciones")
public class NotificacionController {

    private final NotificacionService notificacionService;
    private final SesionService sesionService;

    public NotificacionController(NotificacionService notificacionService, SesionService sesionService) {
        this.notificacionService = notificacionService;
        this.sesionService = sesionService;
    }

    @GetMapping("/usuario/{usuarioId}")
    public ResponseEntity<?> findByUsuarioId(@PathVariable Long usuarioId, HttpSession session) {
        if (!sesionService.haySesion(session)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("mensaje", "Debes iniciar sesión"));
        }
        return ResponseEntity.ok(notificacionService.findByUsuarioId(usuarioId));
    }

    @GetMapping("/usuario/{usuarioId}/no-leidas")
    public ResponseEntity<?> countNoLeidas(@PathVariable Long usuarioId, HttpSession session) {
        if (!sesionService.haySesion(session)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("mensaje", "Debes iniciar sesión"));
        }
        return ResponseEntity.ok(Map.of("count", notificacionService.countNoLeidas(usuarioId)));
    }

    @PostMapping
    public ResponseEntity<?> crear(@RequestBody Map<String, Object> body, HttpSession session) {
        if (!sesionService.haySesion(session)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("mensaje", "Debes iniciar sesión"));
        }
        if (!sesionService.esAdminOBibliotecario(session)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Map.of("mensaje", "No tienes permisos"));
        }
        Long usuarioId = body.get("usuarioId") != null ? ((Number) body.get("usuarioId")).longValue() : null;
        String mensaje = (String) body.get("mensaje");
        String tipo = (String) body.getOrDefault("tipo", "SISTEMA");
        var notificacion = notificacionService.crearNotificacion(usuarioId, mensaje, tipo);
        return ResponseEntity.status(HttpStatus.CREATED).body(notificacionService.toDTO(notificacion));
    }

    @PutMapping("/{id}/leer")
    public ResponseEntity<?> marcarLeida(@PathVariable Long id, HttpSession session) {
        if (!sesionService.haySesion(session)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("mensaje", "Debes iniciar sesión"));
        }
        return notificacionService.marcarLeida(id);
    }

    @PutMapping("/leer-todas/{usuarioId}")
    public ResponseEntity<?> marcarTodasLeidas(@PathVariable Long usuarioId, HttpSession session) {
        if (!sesionService.haySesion(session)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("mensaje", "Debes iniciar sesión"));
        }
        return notificacionService.marcarTodasLeidas(usuarioId);
    }
}
