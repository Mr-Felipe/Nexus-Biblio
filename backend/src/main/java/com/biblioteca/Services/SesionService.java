package com.biblioteca.Services;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.biblioteca.Entities.UsuarioSesion;

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

    public void guardarUsuario(HttpSession session, UsuarioSesion usuario) {
        session.setAttribute("usuario", usuario);
    }

    public UsuarioSesion obtenerUsuario(HttpSession session) {
        return (UsuarioSesion) session.getAttribute("usuario");
    }

    public boolean haySesion(HttpSession session) {
        return obtenerUsuario(session) != null;
    }

    public void cerrarSesion(HttpSession session) {
        session.invalidate();
    }

    // --- Roles ---

    public boolean esAdministrador(HttpSession session) {
        UsuarioSesion usuario = obtenerUsuario(session);
        return usuario != null && usuario.getRol().equalsIgnoreCase("ADMINISTRADOR");
    }

    public boolean esBibliotecario(HttpSession session) {
        UsuarioSesion usuario = obtenerUsuario(session);
        return usuario != null && usuario.getRol().equalsIgnoreCase("BIBLIOTECARIO");
    }

    public boolean esDocente(HttpSession session) {
        UsuarioSesion usuario = obtenerUsuario(session);
        return usuario != null && usuario.getRol().equalsIgnoreCase("DOCENTE");
    }

    public boolean esEstudiante(HttpSession session) {
        UsuarioSesion usuario = obtenerUsuario(session);
        return usuario != null && usuario.getRol().equalsIgnoreCase("ESTUDIANTE");
    }

    // ADMINISTRADOR y BIBLIOTECARIO pueden gestionar préstamos, reservas, sanciones
    public boolean esAdminOBibliotecario(HttpSession session) {
        return esAdministrador(session) || esBibliotecario(session);
    }

    // Solo ADMINISTRADOR puede gestionar usuarios y configuración
    public boolean esSoloAdministrador(HttpSession session) {
        return esAdministrador(session);
    }

    // DOCENTE y ESTUDIANTE son usuarios normales
    public boolean esUsuarioNormal(HttpSession session) {
        return esDocente(session) || esEstudiante(session);
    }
}
