package com.biblioteca.Repositories;

import com.biblioteca.Entities.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    Optional<Usuario> findByCorreoElectronico(String correoElectronico);

    Optional<Usuario> findByCorreoElectronicoAndContrasena(String correoElectronico, String contrasena);

    boolean existsByCorreoElectronico(String correoElectronico);
}
