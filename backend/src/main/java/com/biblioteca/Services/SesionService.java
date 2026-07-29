package com.biblioteca.Services;

import java.util.Map;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import jakarta.servlet.http.HttpSession;

@Service
public class SesionService {

    private final PasswordEncoder passwordEncoder;

    public SesionService(PasswordEncoder passwordEncoder) {
        this.passwordEncoder = passwordEncoder;
    }

    public String hashPassword(String rawPassword) {
        return passwordEncoder.encode(rawPassword);
    }

    public boolean checkPassword(String rawPassword, String hashedPassword) {
        return passwordEncoder.matches(rawPassword, hashedPassword);
    }

    @SuppressWarnings("unchecked")
    public void guardarUsuario(HttpSession session, Map<String, Object> usuario) {
        session.setAttribute("usuario", usuario);
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> obtenerUsuario(HttpSession session) {
        return (Map<String, Object>) session.getAttribute("usuario");
    }

    public boolean haySesion(HttpSession session) {
        return obtenerUsuario(session) != null;
    }

    public void cerrarSesion(HttpSession session) {
        session.invalidate();
    }

    // --- Roles ---

    public boolean esAdministrador(HttpSession session) {
        Map<String, Object> usuario = obtenerUsuario(session);
        return usuario != null && "ADMINISTRADOR".equalsIgnoreCase((String) usuario.get("rol"));
    }

    public boolean esBibliotecario(HttpSession session) {
        Map<String, Object> usuario = obtenerUsuario(session);
        return usuario != null && "BIBLIOTECARIO".equalsIgnoreCase((String) usuario.get("rol"));
    }

    public boolean esDocente(HttpSession session) {
        Map<String, Object> usuario = obtenerUsuario(session);
        return usuario != null && "DOCENTE".equalsIgnoreCase((String) usuario.get("rol"));
    }

    public boolean esEstudiante(HttpSession session) {
        Map<String, Object> usuario = obtenerUsuario(session);
        return usuario != null && "ESTUDIANTE".equalsIgnoreCase((String) usuario.get("rol"));
    }

    public boolean esAdminOBibliotecario(HttpSession session) {
        return esAdministrador(session) || esBibliotecario(session);
    }

    public boolean esSoloAdministrador(HttpSession session) {
        return esAdministrador(session);
    }

    public boolean esUsuarioNormal(HttpSession session) {
        return esDocente(session) || esEstudiante(session);
    }
}
