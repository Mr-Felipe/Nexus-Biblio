package com.biblioteca.Repositories;

import com.biblioteca.Entities.Ejemplar;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EjemplarRepository extends JpaRepository<Ejemplar, Long> {

    List<Ejemplar> findByLibroId(Long libroId);

    List<Ejemplar> findByEstado(String estado);

    Optional<Ejemplar> findByCodigoEjemplar(String codigoEjemplar);

    long countByLibroIdAndEstado(Long libroId, String estado);

    long countByEstado(String estado);

    @Query("SELECT e FROM Ejemplar e WHERE e.libro.id = :libroId AND e.estado = :estado ORDER BY e.id ASC LIMIT 1")
    Optional<Ejemplar> findFirstByLibroIdAndEstado(@Param("libroId") Long libroId, @Param("estado") String estado);
}
