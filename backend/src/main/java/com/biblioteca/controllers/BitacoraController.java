package com.biblioteca.controllers;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.biblioteca.Services.BitacoraAuditoriaService;
import com.biblioteca.Services.SesionService;

import jakarta.servlet.http.HttpSession;

@CrossOrigin(origins = "http://localhost:4200", allowCredentials = "true")
@RestController
@RequestMapping("/api/bitacora")
public class BitacoraController {

    private final BitacoraAuditoriaService bitacoraService;
    private final SesionService sesionService;

    public BitacoraController(BitacoraAuditoriaService bitacoraService, SesionService sesionService) {
        this.bitacoraService = bitacoraService;
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
        return ResponseEntity.ok(bitacoraService.findAll());
    }

    @GetMapping("/tabla/{tabla}")
    public ResponseEntity<?> findByTabla(@PathVariable String tabla, HttpSession session) {
        if (!sesionService.haySesion(session)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("mensaje", "Debes iniciar sesión"));
        }
        return ResponseEntity.ok(bitacoraService.findByTabla(tabla));
    }

    @GetMapping("/usuario/{usuarioId}")
    public ResponseEntity<?> findByUsuarioId(@PathVariable Long usuarioId, HttpSession session) {
        if (!sesionService.haySesion(session)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("mensaje", "Debes iniciar sesión"));
        }
        return ResponseEntity.ok(bitacoraService.findByUsuarioId(usuarioId));
    }
}
