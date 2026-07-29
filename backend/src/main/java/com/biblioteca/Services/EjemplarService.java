package com.biblioteca.Services;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.biblioteca.Entities.Ejemplar;
import com.biblioteca.Entities.Libro;
import com.biblioteca.Repositories.EjemplarRepository;
import com.biblioteca.Repositories.LibroRepository;
import com.biblioteca.Repositories.UsuarioRepository;

@Service
public class EjemplarService {

    private final EjemplarRepository repository;
    private final LibroRepository libroRepository;
    private final UsuarioRepository usuarioRepository;
    private final BitacoraAuditoriaService bitacoraService;
    private final NotificacionService notificacionService;

    public EjemplarService(EjemplarRepository repository, LibroRepository libroRepository,
                           UsuarioRepository usuarioRepository, BitacoraAuditoriaService bitacoraService,
                           NotificacionService notificacionService) {
        this.repository = repository;
        this.libroRepository = libroRepository;
        this.usuarioRepository = usuarioRepository;
        this.bitacoraService = bitacoraService;
        this.notificacionService = notificacionService;
    }

    public List<Ejemplar> findAll() {
        return repository.findAll();
    }

    public Optional<Ejemplar> findById(Long id) {
        return repository.findById(id);
    }

    public List<Ejemplar> findByLibroId(Long libroId) {
        return repository.findByLibroId(libroId);
    }

    public List<Ejemplar> findByEstado(String estado) {
        return repository.findByEstado(estado);
    }

    public long countByLibroIdAndEstado(Long libroId, String estado) {
        return repository.countByLibroIdAndEstado(libroId, estado);
    }

    @Transactional
    public ResponseEntity<?> crear(Ejemplar ejemplar, Long usuarioId) {
        if (ejemplar.getLibro() == null || ejemplar.getLibro().getId() == null) {
            return ResponseEntity.badRequest()
                .body(Map.of("mensaje", "El libro es obligatorio"));
        }

        Optional<Libro> libroOpt = libroRepository.findById(ejemplar.getLibro().getId());
        if (libroOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("mensaje", "Libro no encontrado"));
        }

        ejemplar.setLibro(libroOpt.get());
        if (ejemplar.getEstado() == null || ejemplar.getEstado().isBlank()) {
            ejemplar.setEstado("DISPONIBLE");
        }

        Ejemplar guardado = repository.save(ejemplar);

        bitacoraService.registrar(usuarioId, "CREAR", "ejemplares", guardado.getId(),
            "Nuevo ejemplar: " + guardado.getCodigoEjemplar() + " para libro \"" + libroOpt.get().getTitulo() + "\"",
            null);

        verificarStockBajo(libroOpt.get().getId());

        return ResponseEntity.status(HttpStatus.CREATED).body(guardado);
    }

    @Transactional
    public ResponseEntity<?> eliminar(Long id, Long usuarioId) {
        Optional<Ejemplar> ejemplarOpt = repository.findById(id);
        if (ejemplarOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("mensaje", "Ejemplar no encontrado"));
        }

        Ejemplar ejemplar = ejemplarOpt.get();
        Long libroId = ejemplar.getLibro().getId();
        String codigo = ejemplar.getCodigoEjemplar();

        repository.deleteById(id);

        bitacoraService.registrar(usuarioId, "ELIMINAR", "ejemplares", id,
            "Ejemplar eliminado: " + codigo, null);

        verificarStockBajo(libroId);

        return ResponseEntity.ok(Map.of("mensaje", "Ejemplar eliminado correctamente"));
    }

    @Transactional
    public ResponseEntity<?> cambiarEstado(Long ejemplarId, String nuevoEstado) {
        Optional<Ejemplar> ejemplarOpt = repository.findById(ejemplarId);
        if (ejemplarOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("mensaje", "Ejemplar no encontrado"));
        }

        Ejemplar ejemplar = ejemplarOpt.get();
        String estadoAnterior = ejemplar.getEstado();
        ejemplar.setEstado(nuevoEstado);
        repository.save(ejemplar);

        bitacoraService.registrar(null, "ACTUALIZAR", "ejemplares", ejemplarId,
            "Estado cambiado de " + estadoAnterior + " a " + nuevoEstado + " ejemplar " + ejemplar.getCodigoEjemplar(),
            null);

        verificarStockBajo(ejemplar.getLibro().getId());

        return ResponseEntity.ok(Map.of(
            "mensaje", "Estado cambiado de " + estadoAnterior + " a " + nuevoEstado,
            "ejemplar", ejemplar
        ));
    }

    public Ejemplar save(Ejemplar ejemplar) {
        return repository.save(ejemplar);
    }

    public void deleteById(Long id) {
        repository.deleteById(id);
    }

    private void verificarStockBajo(Long libroId) {
        Optional<Libro> libroOpt = libroRepository.findById(libroId);
        if (libroOpt.isEmpty()) return;

        Libro libro = libroOpt.get();
        long disponibles = repository.countByLibroIdAndEstado(libroId, "DISPONIBLE");
        int stockMinimo = libro.getStockMinimo() != null ? libro.getStockMinimo() : 0;

        if (stockMinimo > 0 && disponibles < stockMinimo) {
            String mensaje = "Stock bajo para el libro \"" + libro.getTitulo()
                + "\": solo quedan " + disponibles + " ejemplar(es) disponible(s) "
                + "(mínimo requerido: " + stockMinimo + ").";
            notificacionService.crearNotificacion(null, mensaje, "SISTEMA");
        }
    }
}
