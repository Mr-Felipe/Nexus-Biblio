package com.biblioteca.Services;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.biblioteca.Entities.Ejemplar;
import com.biblioteca.Entities.Prestamo;
import com.biblioteca.Entities.Sancion;
import com.biblioteca.Repositories.EjemplarRepository;
import com.biblioteca.Repositories.PrestamoRepository;
import com.biblioteca.Repositories.SancionRepository;

@Service
public class SchedulerService {

    private static final Logger log = LoggerFactory.getLogger(SchedulerService.class);

    private final ReservaService reservaService;
    private final PrestamoRepository prestamoRepository;
    private final EjemplarRepository ejemplarRepository;
    private final SancionRepository sancionRepository;
    private final NotificacionService notificacionService;

    public SchedulerService(ReservaService reservaService,
                            PrestamoRepository prestamoRepository,
                            EjemplarRepository ejemplarRepository,
                            SancionRepository sancionRepository,
                            NotificacionService notificacionService) {
        this.reservaService = reservaService;
        this.prestamoRepository = prestamoRepository;
        this.ejemplarRepository = ejemplarRepository;
        this.sancionRepository = sancionRepository;
        this.notificacionService = notificacionService;
    }

    @Scheduled(cron = "0 0 0 * * *")
    @Transactional
    public void cancelarReservasVencidas() {
        log.info("Ejecutando: cancelarReservasVencidas");
        reservaService.cancelarReservasVencidas();
    }

    @Scheduled(cron = "0 0 1 * * *")
    @Transactional
    public void marcarPrestamosVencidos() {
        log.info("Ejecutando: marcarPrestamosVencidos");
        LocalDate hoy = LocalDate.now();

        List<Prestamo> activos = prestamoRepository.findByEstado("ACTIVO");
        for (Prestamo prestamo : activos) {
            if (prestamo.getFechaLimiteDevolucion().isBefore(hoy)) {
                prestamo.setEstado("VENCIDO");
                prestamoRepository.save(prestamo);

                notificacionService.crearNotificacion(
                    prestamo.getUsuario().getId(),
                    "Tu préstamo del libro \"" + prestamo.getEjemplar().getLibro().getTitulo()
                        + "\" ha vencido. Fecha límite: " + prestamo.getFechaLimiteDevolucion()
                        + ". Por favor, devuélvelo lo antes posible.",
                    "PRESTAMO"
                );

                crearSancionPorRetraso(prestamo, hoy);
            }
        }
    }

    private void crearSancionPorRetraso(Prestamo prestamo, LocalDate hoy) {
        long diasRetraso = java.time.temporal.ChronoUnit.DAYS.between(
            prestamo.getFechaLimiteDevolucion(), hoy
        );

        if (diasRetraso <= 0) return;

        boolean yaTieneSancion = sancionRepository.findByUsuarioId(prestamo.getUsuario().getId())
            .stream()
            .anyMatch(s -> s.getPrestamo() != null
                && s.getPrestamo().getId().equals(prestamo.getId())
                && "ECONOMICA".equals(s.getTipo())
                && "ACTIVA".equals(s.getEstado()));

        if (yaTieneSancion) return;

        double valorMulta = diasRetraso * 500.0;

        Sancion sancion = new Sancion();
        sancion.setUsuario(prestamo.getUsuario());
        sancion.setPrestamo(prestamo);
        sancion.setTipo("ECONOMICA");
        sancion.setMotivo("Retraso de " + diasRetraso + " día(s) en la devolución del préstamo #"
            + prestamo.getId());
        sancion.setDiasRetraso((int) diasRetraso);
        sancion.setValorEconomico(new java.math.BigDecimal(valorMulta));
        sancion.setEstado("ACTIVA");
        sancionRepository.save(sancion);

        notificacionService.crearNotificacion(
            prestamo.getUsuario().getId(),
            "Se te ha aplicado una multa de $ " + valorMulta + " por retraso de "
                + diasRetraso + " día(s) en la devolución del préstamo #"
                + prestamo.getId() + ".",
            "SANCION"
        );

        log.info("Sanción creada: usuario={}, préstamo={}, díasRetraso={}, multa=${}",
            prestamo.getUsuario().getId(), prestamo.getId(), diasRetraso, valorMulta);
    }
}
