package com.biblioteca.controllers;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.biblioteca.Services.PrestamoService;
import com.biblioteca.Services.SesionService;

import jakarta.servlet.http.HttpSession;

@CrossOrigin(origins = "http://localhost:4200", allowCredentials = "true")
@RestController
@RequestMapping("/api/prestamos")
public class PrestamoController {

    private final PrestamoService prestamoService;
    private final SesionService sesionService;

    public PrestamoController(PrestamoService prestamoService, SesionService sesionService) {
        this.prestamoService = prestamoService;
        this.sesionService = sesionService;
    }

    @GetMapping
    public ResponseEntity<?> findAll(HttpSession session) {
        if (!sesionService.haySesion(session)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("mensaje", "Debes iniciar sesión"));
        }
        return ResponseEntity.ok(prestamoService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> findById(@PathVariable Long id, HttpSession session) {
        if (!sesionService.haySesion(session)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("mensaje", "Debes iniciar sesión"));
        }
        return prestamoService.findById(id)
            .map(p -> ResponseEntity.ok((Object) p))
            .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("mensaje", "Préstamo no encontrado")));
    }

    @GetMapping("/usuario/{usuarioId}")
    public ResponseEntity<?> findByUsuarioId(@PathVariable Long usuarioId, HttpSession session) {
        if (!sesionService.haySesion(session)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("mensaje", "Debes iniciar sesión"));
        }
        return ResponseEntity.ok(prestamoService.findByUsuarioId(usuarioId));
    }

    @GetMapping("/estado/{estado}")
    public ResponseEntity<?> findByEstado(@PathVariable String estado, HttpSession session) {
        if (!sesionService.haySesion(session)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("mensaje", "Debes iniciar sesión"));
        }
        return ResponseEntity.ok(prestamoService.findByEstado(estado));
    }

    @GetMapping("/pendientes")
    public ResponseEntity<?> findPendientes(HttpSession session) {
        if (!sesionService.haySesion(session)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("mensaje", "Debes iniciar sesión"));
        }
        if (!sesionService.esAdminOBibliotecario(session)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Map.of("mensaje", "No tienes permisos"));
        }
        return ResponseEntity.ok(prestamoService.findPendientes());
    }

    @PostMapping
    public ResponseEntity<?> crear(@RequestBody Map<String, Object> body, HttpSession session) {
        if (!sesionService.haySesion(session)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("mensaje", "Debes iniciar sesión"));
        }
        Long usuarioId = body.get("usuarioId") != null ? ((Number) body.get("usuarioId")).longValue() : null;
        String libroIsbn = body.get("libroIsbn") != null ? String.valueOf(body.get("libroIsbn")) : null;
        if (usuarioId == null || libroIsbn == null) {
            return ResponseEntity.badRequest()
                .body(Map.of("mensaje", "usuarioId y libroIsbn son obligatorios"));
        }
        return prestamoService.crearPrestamo(usuarioId, libroIsbn);
    }

    @PutMapping("/{id}/devolver")
    public ResponseEntity<?> devolver(@PathVariable Long id, HttpSession session) {
        if (!sesionService.haySesion(session)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("mensaje", "Debes iniciar sesión"));
        }
        return prestamoService.devolverPrestamo(id);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminar(@PathVariable Long id, HttpSession session) {
        if (!sesionService.haySesion(session)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("mensaje", "Debes iniciar sesión"));
        }
        if (!sesionService.esAdminOBibliotecario(session)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Map.of("mensaje", "No tienes permisos"));
        }
        return prestamoService.eliminar(id);
    }

    @PutMapping("/{id}/confirmar")
    public ResponseEntity<?> confirmar(@PathVariable Long id, @RequestBody Map<String, Object> body, HttpSession session) {
        if (!sesionService.haySesion(session)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("mensaje", "Debes iniciar sesión"));
        }
        if (!sesionService.esAdminOBibliotecario(session)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Map.of("mensaje", "Solo administradores y bibliotecarios pueden confirmar devoluciones"));
        }

        String estadoEjemplar = (String) body.getOrDefault("estadoEjemplar", "DISPONIBLE");
        String observaciones = (String) body.get("observaciones");
        double multa = body.get("multa") != null ? ((Number) body.get("multa")).doubleValue() : 0;
        String tipoSancion = (String) body.get("tipoSancion");

        var usuario = sesionService.obtenerUsuario(session);
        Long bibliotecarioId = usuario != null ? usuario.getId() : null;

        return prestamoService.confirmarDevolucion(id, estadoEjemplar, observaciones, multa, tipoSancion, bibliotecarioId);
    }
}
