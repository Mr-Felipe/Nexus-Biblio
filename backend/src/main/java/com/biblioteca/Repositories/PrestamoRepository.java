package com.biblioteca.Repositories;

import com.biblioteca.Entities.Prestamo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PrestamoRepository extends JpaRepository<Prestamo, Long> {

    List<Prestamo> findByUsuarioId(Long usuarioId);

    List<Prestamo> findByEstado(String estado);

    List<Prestamo> findByUsuarioIdAndEstado(Long usuarioId, String estado);

    long countByUsuarioIdAndEstado(Long usuarioId, String estado);

    long countByEstado(String estado);
}
