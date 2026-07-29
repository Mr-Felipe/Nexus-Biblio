package com.biblioteca.Repositories;

import com.biblioteca.Entities.BitacoraAuditoria;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BitacoraAuditoriaRepository extends JpaRepository<BitacoraAuditoria, Long> {

    List<BitacoraAuditoria> findByTablaAfectada(String tablaAfectada);

    List<BitacoraAuditoria> findByUsuarioId(Long usuarioId);

    List<BitacoraAuditoria> findByOperacion(String operacion);

    List<BitacoraAuditoria> findAllByOrderByFechaOperacionDesc();
}
