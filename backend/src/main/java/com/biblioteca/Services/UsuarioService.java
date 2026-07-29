package com.biblioteca.Services;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.biblioteca.Entities.Usuario;
import com.biblioteca.Repositories.UsuarioRepository;

@Service
public class UsuarioService {

    private final UsuarioRepository repository;
    private final PasswordEncoder passwordEncoder;

    public UsuarioService(UsuarioRepository repository, PasswordEncoder passwordEncoder) {
        this.repository = repository;
        this.passwordEncoder = passwordEncoder;
    }

    public List<Usuario> findAll() {
        return repository.findAll();
    }

    public Optional<Usuario> findById(Long id) {
        return repository.findById(id);
    }

    public Optional<Usuario> findByCorreo(String correo) {
        return repository.findByCorreoElectronico(correo);
    }

    public Usuario save(Usuario usuario) {
        return repository.save(usuario);
    }

    public void deleteById(Long id) {
        repository.deleteById(id);
    }

    public boolean existsByCorreo(String correo) {
        return repository.existsByCorreoElectronico(correo);
    }

    public ResponseEntity<?> guardar(Usuario usuario) {
        if (usuario.getId() != null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("mensaje", "No se debe enviar el ID al registrar un nuevo usuario"));
        }

        if (usuario.getNombreCompleto() == null || usuario.getNombreCompleto().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("mensaje", "El nombre es obligatorio y no puede estar vacío"));
        }

        if (usuario.getCorreoElectronico() == null || usuario.getCorreoElectronico().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("mensaje", "El correo electrónico es obligatorio y no puede estar vacío"));
        }

        String correoLimpio = usuario.getCorreoElectronico().trim().toLowerCase();
        usuario.setCorreoElectronico(correoLimpio);

        if (repository.existsByCorreoElectronico(correoLimpio)) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(Map.of("mensaje", "El correo ya se encuentra registrado"));
        }

        if (usuario.getContrasena() == null || usuario.getContrasena().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("mensaje", "La contraseña es obligatoria y no puede estar vacía"));
        }

        usuario.setContrasena(passwordEncoder.encode(usuario.getContrasena()));

        if (usuario.getRol() == null || usuario.getRol().isBlank()) {
            usuario.setRol("ESTUDIANTE");
        }

        if (usuario.getActivo() == null) {
            usuario.setActivo(true);
        }

        Usuario nuevoUsuario = repository.save(usuario);
        return ResponseEntity.status(HttpStatus.CREATED).body(nuevoUsuario);
    }

    public ResponseEntity<?> actualizar(Long id, Usuario usuarioActualizado) {
        Usuario usuarioExistente = repository.findById(id).orElse(null);

        if (usuarioExistente == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("mensaje", "Usuario no encontrado"));
        }

        if (usuarioActualizado.getNombreCompleto() == null || usuarioActualizado.getNombreCompleto().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("mensaje", "El nombre no puede quedar vacío al actualizar"));
        }
        usuarioExistente.setNombreCompleto(usuarioActualizado.getNombreCompleto().trim());

        if (usuarioActualizado.getCorreoElectronico() != null && !usuarioActualizado.getCorreoElectronico().isBlank()) {
            String correoLimpio = usuarioActualizado.getCorreoElectronico().trim().toLowerCase();
            if (!usuarioExistente.getCorreoElectronico().equals(correoLimpio)) {
                if (repository.existsByCorreoElectronico(correoLimpio)) {
                    return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(Map.of("mensaje", "El nuevo correo ya está en uso por otra cuenta"));
                }
                usuarioExistente.setCorreoElectronico(correoLimpio);
            }
        }

        if (usuarioActualizado.getRol() != null) {
            if (usuarioActualizado.getRol().isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("mensaje", "El rol no puede estar vacío si se intenta modificar"));
            }
            usuarioExistente.setRol(usuarioActualizado.getRol().trim());
        }

        if (usuarioActualizado.getContrasena() != null && !usuarioActualizado.getContrasena().isBlank()) {
            usuarioExistente.setContrasena(passwordEncoder.encode(usuarioActualizado.getContrasena()));
        }

        if (usuarioActualizado.getDireccion() != null) {
            usuarioExistente.setDireccion(usuarioActualizado.getDireccion());
        }

        if (usuarioActualizado.getTelefono() != null) {
            usuarioExistente.setTelefono(usuarioActualizado.getTelefono());
        }

        if (usuarioActualizado.getActivo() != null) {
            usuarioExistente.setActivo(usuarioActualizado.getActivo());
        }

        Usuario guardado = repository.save(usuarioExistente);
        return ResponseEntity.ok(guardado);
    }

    public ResponseEntity<?> eliminar(Long id) {
        Usuario usuario = repository.findById(id).orElse(null);
        if (usuario == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("mensaje", "Usuario no encontrado"));
        }

        String nombre = usuario.getNombreCompleto();
        repository.delete(usuario);
        return ResponseEntity.ok(Map.of("mensaje", "Usuario eliminado correctamente"));
    }
}
