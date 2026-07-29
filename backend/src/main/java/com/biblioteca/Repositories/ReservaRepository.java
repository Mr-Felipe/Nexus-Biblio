package com.biblioteca.Repositories;

import com.biblioteca.Entities.Reserva;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReservaRepository extends JpaRepository<Reserva, Long> {

    List<Reserva> findByUsuarioId(Long usuarioId);

    List<Reserva> findByEstado(String estado);

    List<Reserva> findByLibroIdAndEstado(Long libroId, String estado);

    List<Reserva> findByUsuarioIdAndEstado(Long usuarioId, String estado);

    long countByLibroIdAndEstado(Long libroId, String estado);

    long countByEstado(String estado);
}
