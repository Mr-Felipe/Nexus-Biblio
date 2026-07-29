package com.biblioteca.Services;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.biblioteca.DTOs.NotificacionDTO;
import com.biblioteca.Entities.Notificacion;
import com.biblioteca.Entities.Usuario;
import com.biblioteca.Repositories.NotificacionRepository;
import com.biblioteca.Repositories.UsuarioRepository;

@Service
public class NotificacionService {

    private final NotificacionRepository notificacionRepository;
    private final UsuarioRepository usuarioRepository;

    public NotificacionService(NotificacionRepository notificacionRepository, UsuarioRepository usuarioRepository) {
        this.notificacionRepository = notificacionRepository;
        this.usuarioRepository = usuarioRepository;
    }

    public List<NotificacionDTO> findByUsuarioId(Long usuarioId) {
        return notificacionRepository.findByUsuarioId(usuarioId).stream()
            .map(this::toDTO)
            .collect(Collectors.toList());
    }

    public long countNoLeidas(Long usuarioId) {
        return notificacionRepository.countByUsuarioIdAndLeida(usuarioId, false);
    }

    @Transactional
    public Notificacion crearNotificacion(Long usuarioId, String mensaje, String tipo) {
        Optional<Usuario> usuarioOpt = usuarioRepository.findById(usuarioId);
        if (usuarioOpt.isEmpty()) return null;

        Notificacion notificacion = new Notificacion();
        notificacion.setUsuario(usuarioOpt.get());
        notificacion.setMensaje(mensaje);
        notificacion.setTipo(tipo);
        notificacion.setLeida(false);
        return notificacionRepository.save(notificacion);
    }

    @Transactional
    public ResponseEntity<?> marcarLeida(Long notificacionId) {
        Optional<Notificacion> notifOpt = notificacionRepository.findById(notificacionId);
        if (notifOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("mensaje", "Notificación no encontrada"));
        }

        Notificacion notificacion = notifOpt.get();
        notificacion.setLeida(true);
        notificacionRepository.save(notificacion);

        return ResponseEntity.ok(Map.of("mensaje", "Notificación marcada como leída"));
    }

    @Transactional
    public ResponseEntity<?> marcarTodasLeidas(Long usuarioId) {
        List<Notificacion> noLeidas = notificacionRepository.findByUsuarioIdAndLeida(usuarioId, false);
        for (Notificacion n : noLeidas) {
            n.setLeida(true);
            notificacionRepository.save(n);
        }
        return ResponseEntity.ok(Map.of("mensaje", "Todas las notificaciones marcadas como leídas"));
    }

    public NotificacionDTO toDTO(Notificacion notificacion) {
        NotificacionDTO dto = new NotificacionDTO();
        dto.setId(notificacion.getId());
        dto.setMensaje(notificacion.getMensaje());
        dto.setTipo(notificacion.getTipo());
        dto.setLeida(notificacion.getLeida());
        dto.setFechaCreacion(notificacion.getFechaCreacion());
        return dto;
    }
}
