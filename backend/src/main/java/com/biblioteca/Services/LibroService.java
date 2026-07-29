package com.biblioteca.Services;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import com.biblioteca.DTOs.EjemplarDTO;
import com.biblioteca.DTOs.LibroDTO;
import com.biblioteca.Entities.Ejemplar;
import com.biblioteca.Entities.Libro;
import com.biblioteca.Repositories.EjemplarRepository;
import com.biblioteca.Repositories.LibroRepository;
import com.biblioteca.Repositories.PrestamoRepository;

@Service
public class LibroService {

    private final LibroRepository libroRepository;
    private final EjemplarRepository ejemplarRepository;
    private final PrestamoRepository prestamoRepository;

    public LibroService(LibroRepository libroRepository, EjemplarRepository ejemplarRepository,
                        PrestamoRepository prestamoRepository) {
        this.libroRepository = libroRepository;
        this.ejemplarRepository = ejemplarRepository;
        this.prestamoRepository = prestamoRepository;
    }

    public List<LibroDTO> findAll() {
        return libroRepository.findAll().stream()
            .map(this::toDTO)
            .collect(Collectors.toList());
    }

    public Optional<LibroDTO> findById(Long id) {
        return libroRepository.findById(id).map(this::toDTO);
    }

    public Optional<LibroDTO> findByIsbn(String isbn) {
        return libroRepository.findByIsbn(isbn).map(this::toDTO);
    }

    public ResponseEntity<?> guardar(Libro libro) {
        if (libro.getIsbn() != null && libroRepository.existsByIsbn(libro.getIsbn())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(Map.of("mensaje", "El ISBN ya está registrado"));
        }
        Libro guardado = libroRepository.save(libro);
        return ResponseEntity.status(HttpStatus.CREATED).body(toDTO(guardado));
    }

    public ResponseEntity<?> actualizar(Long id, Libro libroActualizado) {
        Optional<Libro> existenteOpt = libroRepository.findById(id);
        if (existenteOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("mensaje", "Libro no encontrado"));
        }

        Libro existente = existenteOpt.get();
        if (libroActualizado.getTitulo() != null) existente.setTitulo(libroActualizado.getTitulo());
        if (libroActualizado.getAutor() != null) existente.setAutor(libroActualizado.getAutor());
        if (libroActualizado.getEditorial() != null) existente.setEditorial(libroActualizado.getEditorial());
        if (libroActualizado.getAnioPublicacion() != null) existente.setAnioPublicacion(libroActualizado.getAnioPublicacion());
        if (libroActualizado.getStockMinimo() != null) existente.setStockMinimo(libroActualizado.getStockMinimo());
        if (libroActualizado.getPortadaUrl() != null) existente.setPortadaUrl(libroActualizado.getPortadaUrl());
        if (libroActualizado.getEstadoGeneral() != null) existente.setEstadoGeneral(libroActualizado.getEstadoGeneral());

        Libro guardado = libroRepository.save(existente);
        return ResponseEntity.ok(toDTO(guardado));
    }

    public ResponseEntity<?> eliminar(Long id) {
        Optional<Libro> libroOpt = libroRepository.findById(id);
        if (libroOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("mensaje", "Libro no encontrado"));
        }
        String titulo = libroOpt.get().getTitulo();
        libroRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("mensaje", "Libro eliminado correctamente"));
    }

    public List<EjemplarDTO> findEjemplaresByLibroId(Long libroId) {
        return ejemplarRepository.findByLibroId(libroId).stream()
            .map(this::toEjemplarDTO)
            .collect(Collectors.toList());
    }

    public LibroDTO toDTO(Libro libro) {
        LibroDTO dto = new LibroDTO();
        dto.setId(libro.getId());
        dto.setIsbn(libro.getIsbn());
        dto.setTitulo(libro.getTitulo());
        dto.setAutor(libro.getAutor());
        dto.setEditorial(libro.getEditorial());
        dto.setAnioPublicacion(libro.getAnioPublicacion());
        dto.setStockMinimo(libro.getStockMinimo());
        dto.setPortadaUrl(libro.getPortadaUrl());
        dto.setEstadoGeneral(libro.getEstadoGeneral());

        List<Ejemplar> ejemplares = ejemplarRepository.findByLibroId(libro.getId());
        int disponibles = (int) ejemplares.stream().filter(e -> e.getEstado().equals("DISPONIBLE")).count();

        List<EjemplarDTO> ejemplaresDTO = ejemplares.stream()
            .map(this::toEjemplarDTO)
            .collect(Collectors.toList());

        dto.setEjemplares(ejemplaresDTO);
        dto.setTotalEjemplares(ejemplares.size());
        dto.setDisponibles(disponibles);

        return dto;
    }

    private EjemplarDTO toEjemplarDTO(Ejemplar ejemplar) {
        EjemplarDTO dto = new EjemplarDTO();
        dto.setId(ejemplar.getId());
        String codigo = ejemplar.getCodigoEjemplar();
        String[] parts = codigo.split("-");
        dto.setNumero(Integer.parseInt(parts[parts.length - 1]));
        dto.setCodigo(codigo);
        dto.setEstado(ejemplar.getEstado());
        return dto;
    }
}
