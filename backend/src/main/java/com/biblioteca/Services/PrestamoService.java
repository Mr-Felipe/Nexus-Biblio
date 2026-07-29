package com.biblioteca.Services;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.biblioteca.DTOs.PrestamoDTO;
import com.biblioteca.Entities.Ejemplar;
import com.biblioteca.Entities.Prestamo;
import com.biblioteca.Entities.Sancion;
import com.biblioteca.Entities.Usuario;
import com.biblioteca.Repositories.EjemplarRepository;
import com.biblioteca.Repositories.LibroRepository;
import com.biblioteca.Repositories.PrestamoRepository;
import com.biblioteca.Repositories.SancionRepository;
import com.biblioteca.Repositories.UsuarioRepository;

@Service
public class PrestamoService {

    private final PrestamoRepository prestamoRepository;
    private final EjemplarRepository ejemplarRepository;
    private final UsuarioRepository usuarioRepository;
    private final LibroRepository libroRepository;
    private final SancionRepository sancionRepository;
    private final NotificacionService notificacionService;

    public PrestamoService(PrestamoRepository prestamoRepository, EjemplarRepository ejemplarRepository,
                           UsuarioRepository usuarioRepository, LibroRepository libroRepository,
                           SancionRepository sancionRepository, NotificacionService notificacionService) {
        this.prestamoRepository = prestamoRepository;
        this.ejemplarRepository = ejemplarRepository;
        this.usuarioRepository = usuarioRepository;
        this.libroRepository = libroRepository;
        this.sancionRepository = sancionRepository;
        this.notificacionService = notificacionService;
    }

    public List<PrestamoDTO> findAll() {
        return prestamoRepository.findAll().stream()
            .map(this::toDTO)
            .collect(Collectors.toList());
    }

    public Optional<PrestamoDTO> findById(Long id) {
        return prestamoRepository.findById(id).map(this::toDTO);
    }

    public List<PrestamoDTO> findByUsuarioId(Long usuarioId) {
        return prestamoRepository.findByUsuarioId(usuarioId).stream()
            .map(this::toDTO)
            .collect(Collectors.toList());
    }

    public List<PrestamoDTO> findByEstado(String estado) {
        return prestamoRepository.findByEstado(estado).stream()
            .map(this::toDTO)
            .collect(Collectors.toList());
    }

    public List<PrestamoDTO> findPendientes() {
        return prestamoRepository.findByEstado("PENDIENTE_DEVOLUCION").stream()
            .map(this::toDTO)
            .collect(Collectors.toList());
    }

    @Transactional
    public ResponseEntity<?> eliminar(Long id) {
        Optional<Prestamo> prestamoOpt = prestamoRepository.findById(id);
        if (prestamoOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("mensaje", "Préstamo no encontrado"));
        }

        Prestamo prestamo = prestamoOpt.get();

        Ejemplar ejemplar = prestamo.getEjemplar();
        if ("PRESTADO".equals(ejemplar.getEstado()) || "PENDIENTE_DEVOLUCION".equals(prestamo.getEstado())) {
            ejemplar.setEstado("DISPONIBLE");
            ejemplarRepository.save(ejemplar);
        }

        prestamoRepository.deleteById(id);

        return ResponseEntity.ok(Map.of("mensaje", "Préstamo eliminado exitosamente"));
    }

    @Transactional
    public ResponseEntity<?> crearPrestamo(Long usuarioId, String libroIsbn) {
        Optional<Usuario> usuarioOpt = usuarioRepository.findById(usuarioId);
        if (usuarioOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("mensaje", "Usuario no encontrado"));
        }
        Usuario usuario = usuarioOpt.get();

        if (!usuario.getActivo()) {
            return ResponseEntity.badRequest()
                .body(Map.of("mensaje", "El usuario no está activo"));
        }

        long prestamosActivos = prestamoRepository.countByUsuarioIdAndEstado(usuarioId, "ACTIVO")
            + prestamoRepository.countByUsuarioIdAndEstado(usuarioId, "PENDIENTE_DEVOLUCION");
        if (prestamosActivos > 0) {
            return ResponseEntity.badRequest()
                .body(Map.of("mensaje", "El usuario ya tiene un préstamo activo. Límite: 1 préstamo a la vez."));
        }

        long sancionesActivas = sancionRepository.countByUsuarioIdAndEstado(usuarioId, "ACTIVA");
        if (sancionesActivas > 0) {
            return ResponseEntity.badRequest()
                .body(Map.of("mensaje", "El usuario tiene sanciones activas. Debe saldarlas antes de solicitar un préstamo."));
        }

        var libroOpt = libroRepository.findByIsbn(libroIsbn);
        if (libroOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("mensaje", "Libro no encontrado"));
        }

        Long libroId = libroOpt.get().getId();
        Optional<Ejemplar> ejemplarOpt = ejemplarRepository.findFirstByLibroIdAndEstado(libroId, "DISPONIBLE");
        if (ejemplarOpt.isEmpty()) {
            return ResponseEntity.badRequest()
                .body(Map.of("mensaje", "No hay ejemplares disponibles de este libro"));
        }

        Ejemplar ejemplar = ejemplarOpt.get();
        ejemplar.setEstado("PRESTADO");
        ejemplarRepository.save(ejemplar);

        Prestamo prestamo = new Prestamo();
        prestamo.setUsuario(usuario);
        prestamo.setEjemplar(ejemplar);
        prestamo.setFechaPrestamo(LocalDate.now());
        prestamo.setFechaLimiteDevolucion(LocalDate.now().plusDays(15));
        prestamo.setEstado("ACTIVO");

        Prestamo guardado = prestamoRepository.save(prestamo);

        return ResponseEntity.status(HttpStatus.CREATED).body(toDTO(guardado));
    }

    @Transactional
    public ResponseEntity<?> devolverPrestamo(Long prestamoId) {
        Optional<Prestamo> prestamoOpt = prestamoRepository.findById(prestamoId);
        if (prestamoOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("mensaje", "Préstamo no encontrado"));
        }

        Prestamo prestamo = prestamoOpt.get();
        if (prestamo.getEstado().equals("DEVUELTO")) {
            return ResponseEntity.badRequest()
                .body(Map.of("mensaje", "Este préstamo ya fue devuelto"));
        }
        if (prestamo.getEstado().equals("PENDIENTE_DEVOLUCION")) {
            return ResponseEntity.badRequest()
                .body(Map.of("mensaje", "Este préstamo ya está pendiente de evaluación"));
        }

        prestamo.setEstado("PENDIENTE_DEVOLUCION");
        prestamoRepository.save(prestamo);

        notificacionService.crearNotificacion(
            prestamo.getUsuario().getId(),
            "Tu devolución del préstamo #" + prestamoId + " está pendiente de evaluación por el bibliotecario.",
            "PRESTAMO"
        );

        return ResponseEntity.ok(Map.of(
            "mensaje", "Devolución solicitada exitosamente",
            "prestamo", toDTO(prestamo)
        ));
    }

    @Transactional
    public ResponseEntity<?> confirmarDevolucion(Long prestamoId, String estadoEjemplar,
                                                  String observaciones, double valorMulta,
                                                  String tipoSancion, Long bibliotecarioId) {
        Optional<Prestamo> prestamoOpt = prestamoRepository.findById(prestamoId);
        if (prestamoOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("mensaje", "Préstamo no encontrado"));
        }

        Prestamo prestamo = prestamoOpt.get();
        if (!prestamo.getEstado().equals("PENDIENTE_DEVOLUCION")) {
            return ResponseEntity.badRequest()
                .body(Map.of("mensaje", "Este préstamo no está pendiente de devolución"));
        }

        prestamo.setEstado("DEVUELTO");
        prestamo.setFechaRealDevolucion(LocalDate.now());
        prestamo.setObservaciones(observaciones);

        if (bibliotecarioId != null) {
            usuarioRepository.findById(bibliotecarioId).ifPresent(prestamo::setEvaluadoPor);
        }

        prestamoRepository.save(prestamo);

        Ejemplar ejemplar = prestamo.getEjemplar();
        ejemplar.setEstado(estadoEjemplar);
        ejemplarRepository.save(ejemplar);

        if (tipoSancion != null && !tipoSancion.isBlank()) {
            Sancion sancion = new Sancion();
            sancion.setUsuario(prestamo.getUsuario());
            sancion.setPrestamo(prestamo);
            sancion.setTipo(tipoSancion);
            sancion.setMotivo(observaciones != null ? observaciones : "Multa por devolución");
            sancion.setValorEconomico(new java.math.BigDecimal(valorMulta));
            sancion.setEstado("ACTIVA");
            sancionRepository.save(sancion);

            String msgSancion = "Se le ha registrado una sanción " + tipoSancion + " por el préstamo #" + prestamoId + "."
                + (valorMulta > 0 ? " Multa: $ " + valorMulta + "." : "")
                + " Motivo: " + (observaciones != null ? observaciones : "Sin observaciones");
            notificacionService.crearNotificacion(
                prestamo.getUsuario().getId(),
                msgSancion,
                "SANCION"
            );
        }

        String msgDevolucion = "Tu devolución del préstamo #" + prestamoId + " ha sido procesada. Estado del ejemplar: " + estadoEjemplar + "."
            + (tipoSancion != null && !tipoSancion.isBlank() ? " Se aplicó una sanción." : " No se generaron sanciones.");
        notificacionService.crearNotificacion(
            prestamo.getUsuario().getId(),
            msgDevolucion,
            "PRESTAMO"
        );

        return ResponseEntity.ok(Map.of(
            "mensaje", "Devolución confirmada exitosamente",
            "prestamo", toDTO(prestamo)
        ));
    }

    public PrestamoDTO toDTO(Prestamo prestamo) {
        PrestamoDTO dto = new PrestamoDTO();
        dto.setId(prestamo.getId());
        dto.setUsuarioId(prestamo.getUsuario().getId());
        dto.setUsuarioNombre(prestamo.getUsuario().getNombreCompleto());
        dto.setEjemplarId(prestamo.getEjemplar().getId());
        dto.setEjemplarCodigo(prestamo.getEjemplar().getCodigoEjemplar());
        dto.setLibroIsbn(prestamo.getEjemplar().getLibro().getIsbn());
        dto.setLibroTitulo(prestamo.getEjemplar().getLibro().getTitulo());
        dto.setFechaPrestamo(prestamo.getFechaPrestamo());
        dto.setFechaLimite(prestamo.getFechaLimiteDevolucion());
        dto.setFechaRealDevolucion(prestamo.getFechaRealDevolucion());
        dto.setEstado(prestamo.getEstado());
        dto.setObservaciones(prestamo.getObservaciones());
        if (prestamo.getEvaluadoPor() != null) {
            dto.setEvaluadoPorId(prestamo.getEvaluadoPor().getId());
            dto.setEvaluadoPorNombre(prestamo.getEvaluadoPor().getNombreCompleto());
        }
        return dto;
    }
}
