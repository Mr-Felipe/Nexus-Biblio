package com.biblioteca.Repositories;

import com.biblioteca.Entities.Sancion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface SancionRepository extends JpaRepository<Sancion, Long> {

    List<Sancion> findByUsuarioId(Long usuarioId);

    List<Sancion> findByEstado(String estado);

    List<Sancion> findByUsuarioIdAndEstado(Long usuarioId, String estado);

    long countByUsuarioIdAndEstado(Long usuarioId, String estado);

    long countByEstado(String estado);

    @Query("SELECT COALESCE(SUM(s.valorEconomico), 0) FROM Sancion s WHERE s.estado = :estado")
    BigDecimal sumValorEconomicoByEstado(@Param("estado") String estado);
}
