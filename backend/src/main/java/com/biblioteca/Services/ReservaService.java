package com.biblioteca.Services;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.biblioteca.DTOs.ReservaDTO;
import com.biblioteca.Entities.Libro;
import com.biblioteca.Entities.Reserva;
import com.biblioteca.Entities.Sancion;
import com.biblioteca.Entities.Usuario;
import com.biblioteca.Repositories.EjemplarRepository;
import com.biblioteca.Repositories.LibroRepository;
import com.biblioteca.Repositories.ReservaRepository;
import com.biblioteca.Repositories.SancionRepository;
import com.biblioteca.Repositories.UsuarioRepository;

@Service
public class ReservaService {

    private final ReservaRepository reservaRepository;
    private final UsuarioRepository usuarioRepository;
    private final LibroRepository libroRepository;
    private final EjemplarRepository ejemplarRepository;
    private final SancionRepository sancionRepository;
    private final NotificacionService notificacionService;
    private final BitacoraAuditoriaService bitacoraService;

    public ReservaService(ReservaRepository reservaRepository, UsuarioRepository usuarioRepository,
                          LibroRepository libroRepository, EjemplarRepository ejemplarRepository,
                          SancionRepository sancionRepository, NotificacionService notificacionService,
                          BitacoraAuditoriaService bitacoraService) {
        this.reservaRepository = reservaRepository;
        this.usuarioRepository = usuarioRepository;
        this.libroRepository = libroRepository;
        this.ejemplarRepository = ejemplarRepository;
        this.sancionRepository = sancionRepository;
        this.notificacionService = notificacionService;
        this.bitacoraService = bitacoraService;
    }

    public List<ReservaDTO> findAll() {
        return reservaRepository.findAll().stream()
            .map(this::toDTO)
            .collect(Collectors.toList());
    }

    public Optional<ReservaDTO> findById(Long id) {
        return reservaRepository.findById(id).map(this::toDTO);
    }

    public List<ReservaDTO> findByUsuarioId(Long usuarioId) {
        return reservaRepository.findByUsuarioId(usuarioId).stream()
            .map(this::toDTO)
            .collect(Collectors.toList());
    }

    public List<ReservaDTO> findByEstado(String estado) {
        return reservaRepository.findByEstado(estado).stream()
            .map(this::toDTO)
            .collect(Collectors.toList());
    }

    @Transactional
    public ResponseEntity<?> crearReserva(Long usuarioId, String libroIsbn) {
        Optional<Usuario> usuarioOpt = usuarioRepository.findById(usuarioId);
        if (usuarioOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("mensaje", "Usuario no encontrado"));
        }

        Optional<Libro> libroOpt = libroRepository.findByIsbn(libroIsbn);
        if (libroOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("mensaje", "Libro no encontrado"));
        }

        Long libroId = libroOpt.get().getId();

        List<Reserva> reservasActivas = reservaRepository.findByUsuarioIdAndEstado(usuarioId, "PENDIENTE");
        List<Reserva> reservasEnCola = reservaRepository.findByUsuarioIdAndEstado(usuarioId, "ACTIVA");
        boolean yaReservado = false;
        for (Reserva r : reservasActivas) {
            if (r.getLibro().getId().equals(libroId)) { yaReservado = true; break; }
        }
        if (!yaReservado) {
            for (Reserva r : reservasEnCola) {
                if (r.getLibro().getId().equals(libroId)) { yaReservado = true; break; }
            }
        }
        if (yaReservado) {
            return ResponseEntity.badRequest()
                .body(Map.of("mensaje", "Ya tienes una reserva activa para este libro"));
        }

        long sancionesActivas = sancionRepository.countByUsuarioIdAndEstado(usuarioId, "ACTIVA");
        if (sancionesActivas > 0) {
            return ResponseEntity.badRequest()
                .body(Map.of("mensaje", "No puedes realizar reservas si posees sanciones activas"));
        }

        long enCola = reservaRepository.countByLibroIdAndEstado(libroId, "PENDIENTE");
        long disponibles = ejemplarRepository.countByLibroIdAndEstado(libroId, "DISPONIBLE");
        String estado = (disponibles > 0 && enCola == 0) ? "ACTIVA" : "PENDIENTE";

        Reserva reserva = new Reserva();
        reserva.setUsuario(usuarioOpt.get());
        reserva.setLibro(libroOpt.get());
        reserva.setPosicionCola((int)(enCola + 1));
        reserva.setEstado(estado);
        reserva.setFechaVencimiento(OffsetDateTime.now().plusHours(24));

        Reserva guardada = reservaRepository.save(reserva);

        bitacoraService.registrar(usuarioId, "CREAR", "reservas", guardada.getId(),
            "Nueva reserva: libro \"" + libroOpt.get().getTitulo() + "\" - Estado: " + estado, null);

        if (estado.equals("ACTIVA")) {
            notificacionService.crearNotificacion(usuarioId,
                "¡Tu reserva del libro \"" + libroOpt.get().getTitulo() + "\" está lista para retirar!",
                "RESERVA"
            );
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(toDTO(guardada));
    }

    @Transactional
    public ResponseEntity<?> cancelarReserva(Long reservaId) {
        Optional<Reserva> reservaOpt = reservaRepository.findById(reservaId);
        if (reservaOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("mensaje", "Reserva no encontrada"));
        }

        Reserva reserva = reservaOpt.get();
        String estadoAnterior = reserva.getEstado();
        reserva.setEstado("CANCELADA");
        reservaRepository.save(reserva);

        bitacoraService.registrar(reserva.getUsuario().getId(), "ACTUALIZAR", "reservas", reservaId,
            "Reserva cancelada: libro \"" + reserva.getLibro().getTitulo() + "\" (estado anterior: " + estadoAnterior + ")", null);

        notificacionService.crearNotificacion(
            reserva.getUsuario().getId(),
            "Tu reserva del libro \"" + reserva.getLibro().getTitulo() + "\" ha sido cancelada.",
            "RESERVA"
        );

        recalculateQueuePositions(reserva.getLibro().getId());

        return ResponseEntity.ok(Map.of(
            "mensaje", "Reserva cancelada exitosamente",
            "reserva", toDTO(reserva)
        ));
    }

    @Transactional
    public ResponseEntity<?> procesarCola(Long libroId) {
        List<Reserva> enCola = reservaRepository.findByLibroIdAndEstado(libroId, "PENDIENTE");
        if (enCola.isEmpty()) {
            return ResponseEntity.ok(Map.of("mensaje", "No hay reservas en cola para este libro"));
        }

        Reserva siguiente = enCola.stream()
            .min((a, b) -> Integer.compare(a.getPosicionCola(), b.getPosicionCola()))
            .orElse(null);

        if (siguiente != null) {
            siguiente.setEstado("ACTIVA");
            reservaRepository.save(siguiente);

            notificacionService.crearNotificacion(
                siguiente.getUsuario().getId(),
                "¡Tu reserva del libro \"" + siguiente.getLibro().getTitulo() + "\" está lista para retirar!",
                "RESERVA"
            );
        }

        return ResponseEntity.ok(Map.of("mensaje", "Cola procesada", "reserva", toDTO(siguiente)));
    }

    @Transactional
    public void cancelarReservasVencidas() {
        List<Reserva> pendientes = reservaRepository.findByEstado("PENDIENTE");
        List<Reserva> activas = reservaRepository.findByEstado("ACTIVA");
        OffsetDateTime ahora = OffsetDateTime.now();

        for (Reserva r : pendientes) {
            OffsetDateTime fechaExp = r.getFechaVencimiento() != null
                ? r.getFechaVencimiento()
                : r.getFechaCreacion().plusHours(24);
            if (fechaExp.isBefore(ahora)) {
                r.setEstado("VENCIDA");
                reservaRepository.save(r);
                notificacionService.crearNotificacion(
                    r.getUsuario().getId(),
                    "Tu reserva del libro \"" + r.getLibro().getTitulo() + "\" ha expirado por tiempo.",
                    "RESERVA"
                );
            }
        }

        for (Reserva r : activas) {
            OffsetDateTime fechaExp = r.getFechaVencimiento() != null
                ? r.getFechaVencimiento()
                : r.getFechaCreacion().plusHours(24);
            if (fechaExp.isBefore(ahora)) {
                r.setEstado("VENCIDA");
                reservaRepository.save(r);
                notificacionService.crearNotificacion(
                    r.getUsuario().getId(),
                    "Tu reserva del libro \"" + r.getLibro().getTitulo() + "\" ha expirado por tiempo.",
                    "RESERVA"
                );
            }
        }
    }

    private void recalculateQueuePositions(Long libroId) {
        List<Reserva> enCola = reservaRepository.findByLibroIdAndEstado(libroId, "PENDIENTE");
        int position = 1;
        for (Reserva r : enCola) {
            r.setPosicionCola(position++);
            reservaRepository.save(r);
        }
    }

    public ReservaDTO toDTO(Reserva reserva) {
        ReservaDTO dto = new ReservaDTO();
        dto.setId(reserva.getId());
        dto.setUsuarioId(reserva.getUsuario().getId());
        dto.setUsuarioNombre(reserva.getUsuario().getNombreCompleto());
        dto.setLibroId(reserva.getLibro().getId());
        dto.setLibroIsbn(reserva.getLibro().getIsbn());
        dto.setLibroTitulo(reserva.getLibro().getTitulo());
        dto.setFechaReserva(reserva.getFechaReserva());
        dto.setPosicionCola(reserva.getPosicionCola());
        dto.setEstado(reserva.getEstado());
        return dto;
    }
}
