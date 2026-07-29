package com.biblioteca.Services;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.biblioteca.DTOs.SancionDTO;
import com.biblioteca.Entities.Sancion;
import com.biblioteca.Entities.Usuario;
import com.biblioteca.Repositories.PrestamoRepository;
import com.biblioteca.Repositories.SancionRepository;
import com.biblioteca.Repositories.UsuarioRepository;

@Service
public class SancionService {

    private final SancionRepository sancionRepository;
    private final UsuarioRepository usuarioRepository;
    private final PrestamoRepository prestamoRepository;
    private final NotificacionService notificacionService;

    public SancionService(SancionRepository sancionRepository, UsuarioRepository usuarioRepository,
                          PrestamoRepository prestamoRepository, NotificacionService notificacionService) {
        this.sancionRepository = sancionRepository;
        this.usuarioRepository = usuarioRepository;
        this.prestamoRepository = prestamoRepository;
        this.notificacionService = notificacionService;
    }

    public List<SancionDTO> findAll() {
        return sancionRepository.findAll().stream()
            .map(this::toDTO)
            .collect(Collectors.toList());
    }

    public Optional<SancionDTO> findById(Long id) {
        return sancionRepository.findById(id).map(this::toDTO);
    }

    public List<SancionDTO> findByUsuarioId(Long usuarioId) {
        return sancionRepository.findByUsuarioId(usuarioId).stream()
            .map(this::toDTO)
            .collect(Collectors.toList());
    }

    public List<SancionDTO> findByEstado(String estado) {
        return sancionRepository.findByEstado(estado).stream()
            .map(this::toDTO)
            .collect(Collectors.toList());
    }

    @Transactional
    public ResponseEntity<?> crearSancion(Long usuarioId, String tipo, String motivo,
                                           double valorEconomico, Long prestamoId) {
        Optional<Usuario> usuarioOpt = usuarioRepository.findById(usuarioId);
        if (usuarioOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("mensaje", "Usuario no encontrado"));
        }

        Sancion sancion = new Sancion();
        sancion.setUsuario(usuarioOpt.get());
        sancion.setTipo(tipo);
        sancion.setMotivo(motivo);
        if (valorEconomico > 0) {
            sancion.setValorEconomico(new java.math.BigDecimal(valorEconomico));
        }
        sancion.setEstado("ACTIVA");

        if (prestamoId != null) {
            prestamoRepository.findById(prestamoId).ifPresent(sancion::setPrestamo);
        }

        Sancion guardada = sancionRepository.save(sancion);

        String msg = "Se le ha registrado una sanción " + tipo + ": " + motivo;
        if (valorEconomico > 0) {
            msg += ". Multa: $ " + valorEconomico;
        }
        notificacionService.crearNotificacion(usuarioId, msg, "SANCION");

        return ResponseEntity.status(HttpStatus.CREATED).body(toDTO(guardada));
    }

    @Transactional
    public ResponseEntity<?> pagarSancion(Long sancionId) {
        Optional<Sancion> sancionOpt = sancionRepository.findById(sancionId);
        if (sancionOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("mensaje", "Sanción no encontrada"));
        }

        Sancion sancion = sancionOpt.get();
        sancion.setEstado("CUMPLIDA");
        sancion.setFechaResolucion(java.time.OffsetDateTime.now());
        sancionRepository.save(sancion);

        notificacionService.crearNotificacion(
            sancion.getUsuario().getId(),
            "Su sanción " + sancion.getTipo() + " ha sido liquidada. Ya puede realizar operaciones normales.",
            "SANCION"
        );

        return ResponseEntity.ok(Map.of(
            "mensaje", "Sanción pagada/liquidada exitosamente",
            "sancion", toDTO(sancion)
        ));
    }

    @Transactional
    public ResponseEntity<?> eliminar(Long id) {
        Optional<Sancion> sancionOpt = sancionRepository.findById(id);
        if (sancionOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("mensaje", "Sanción no encontrada"));
        }

        Sancion sancion = sancionOpt.get();
        sancionRepository.deleteById(id);

        return ResponseEntity.ok(Map.of("mensaje", "Sanción eliminada exitosamente"));
    }

    public SancionDTO toDTO(Sancion sancion) {
        SancionDTO dto = new SancionDTO();
        dto.setId(sancion.getId());
        dto.setUsuarioId(sancion.getUsuario().getId());
        dto.setUsuarioNombre(sancion.getUsuario().getNombreCompleto());
        if (sancion.getPrestamo() != null) {
            dto.setPrestamoId(sancion.getPrestamo().getId());
        }
        dto.setTipo(sancion.getTipo());
        dto.setMotivo(sancion.getMotivo());
        dto.setDiasRetraso(sancion.getDiasRetraso());
        dto.setValorEconomico(sancion.getValorEconomico());
        dto.setEstado(sancion.getEstado());
        dto.setFechaCreacion(sancion.getFechaCreacion());
        dto.setFechaResolucion(sancion.getFechaResolucion());
        return dto;
    }
}
