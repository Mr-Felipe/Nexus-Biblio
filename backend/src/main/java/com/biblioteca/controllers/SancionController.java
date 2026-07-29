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

import com.biblioteca.Services.SancionService;
import com.biblioteca.Services.SesionService;

import jakarta.servlet.http.HttpSession;

@CrossOrigin(origins = "http://localhost:4200", allowCredentials = "true")
@RestController
@RequestMapping("/api/sanciones")
public class SancionController {

    private final SancionService sancionService;
    private final SesionService sesionService;

    public SancionController(SancionService sancionService, SesionService sesionService) {
        this.sancionService = sancionService;
        this.sesionService = sesionService;
    }

    @GetMapping
    public ResponseEntity<?> findAll(HttpSession session) {
        if (!sesionService.haySesion(session)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("mensaje", "Debes iniciar sesión"));
        }
        if (!sesionService.esAdminOBibliotecario(session)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Map.of("mensaje", "No tienes permisos"));
        }
        return ResponseEntity.ok(sancionService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> findById(@PathVariable Long id, HttpSession session) {
        if (!sesionService.haySesion(session)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("mensaje", "Debes iniciar sesión"));
        }
        return sancionService.findById(id)
            .map(s -> ResponseEntity.ok((Object) s))
            .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("mensaje", "Sanción no encontrada")));
    }

    @GetMapping("/usuario/{usuarioId}")
    public ResponseEntity<?> findByUsuarioId(@PathVariable Long usuarioId, HttpSession session) {
        if (!sesionService.haySesion(session)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("mensaje", "Debes iniciar sesión"));
        }
        return ResponseEntity.ok(sancionService.findByUsuarioId(usuarioId));
    }

    @GetMapping("/estado/{estado}")
    public ResponseEntity<?> findByEstado(@PathVariable String estado, HttpSession session) {
        if (!sesionService.haySesion(session)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("mensaje", "Debes iniciar sesión"));
        }
        return ResponseEntity.ok(sancionService.findByEstado(estado));
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
        String tipo = (String) body.get("tipo");
        String motivo = (String) body.get("motivo");
        double valor = body.get("valorEconomico") != null ? ((Number) body.get("valorEconomico")).doubleValue() : 0;
        Long prestamoId = body.get("prestamoId") != null ? ((Number) body.get("prestamoId")).longValue() : null;
        return sancionService.crearSancion(usuarioId, tipo, motivo, valor, prestamoId);
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
        return sancionService.eliminar(id);
    }

    @PutMapping("/{id}/pagar")
    public ResponseEntity<?> pagar(@PathVariable Long id, HttpSession session) {
        if (!sesionService.haySesion(session)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("mensaje", "Debes iniciar sesión"));
        }
        if (!sesionService.esAdminOBibliotecario(session)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Map.of("mensaje", "No tienes permisos"));
        }
        return sancionService.pagarSancion(id);
    }
}
