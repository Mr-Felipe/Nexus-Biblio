package com.biblioteca.Services;

import java.math.BigDecimal;

import org.springframework.stereotype.Service;

import com.biblioteca.DTOs.DashboardStatsDTO;
import com.biblioteca.Repositories.EjemplarRepository;
import com.biblioteca.Repositories.LibroRepository;
import com.biblioteca.Repositories.PrestamoRepository;
import com.biblioteca.Repositories.ReservaRepository;
import com.biblioteca.Repositories.SancionRepository;
import com.biblioteca.Repositories.UsuarioRepository;

@Service
public class DashboardService {

    private final LibroRepository libroRepository;
    private final EjemplarRepository ejemplarRepository;
    private final PrestamoRepository prestamoRepository;
    private final ReservaRepository reservaRepository;
    private final SancionRepository sancionRepository;
    private final UsuarioRepository usuarioRepository;

    public DashboardService(LibroRepository libroRepository, EjemplarRepository ejemplarRepository,
                            PrestamoRepository prestamoRepository, ReservaRepository reservaRepository,
                            SancionRepository sancionRepository, UsuarioRepository usuarioRepository) {
        this.libroRepository = libroRepository;
        this.ejemplarRepository = ejemplarRepository;
        this.prestamoRepository = prestamoRepository;
        this.reservaRepository = reservaRepository;
        this.sancionRepository = sancionRepository;
        this.usuarioRepository = usuarioRepository;
    }

    public DashboardStatsDTO obtenerEstadisticas() {
        DashboardStatsDTO stats = new DashboardStatsDTO();

        long totalEjemplares = ejemplarRepository.count();
        stats.setTotalBooks((int) totalEjemplares);
        stats.setTotalEjemplares((int) totalEjemplares);
        stats.setAvailableBooks((int) ejemplarRepository.countByEstado("DISPONIBLE"));

        long prestamosActivos = prestamoRepository.countByEstado("ACTIVO")
            + prestamoRepository.countByEstado("PENDIENTE_DEVOLUCION")
            + prestamoRepository.countByEstado("VENCIDO");
        stats.setActiveLoans((int) prestamosActivos);
        stats.setPendingReturns((int) prestamoRepository.countByEstado("PENDIENTE_DEVOLUCION"));
        stats.setTotalLoans((int) prestamoRepository.count());

        stats.setActiveReservations((int) (reservaRepository.countByEstado("PENDIENTE")
            + reservaRepository.countByEstado("ACTIVA")));

        stats.setActiveSanctions((int) sancionRepository.countByEstado("ACTIVA"));
        BigDecimal multas = sancionRepository.sumValorEconomicoByEstado("ACTIVA");
        stats.setTotalFines(multas != null ? multas.doubleValue() : 0.0);

        long usuariosActivos = usuarioRepository.findAll().stream()
            .filter(u -> Boolean.TRUE.equals(u.getActivo()))
            .count();
        stats.setActiveUsers((int) usuariosActivos);
        stats.setTotalUsuarios((int) usuarioRepository.count());

        return stats;
    }
}
