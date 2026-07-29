package com.biblioteca.Services;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.biblioteca.DTOs.BitacoraDTO;
import com.biblioteca.Entities.BitacoraAuditoria;
import com.biblioteca.Entities.Usuario;
import com.biblioteca.Repositories.BitacoraAuditoriaRepository;
import com.biblioteca.Repositories.UsuarioRepository;

@Service
public class BitacoraAuditoriaService {

    private final BitacoraAuditoriaRepository repository;
    private final UsuarioRepository usuarioRepository;

    public BitacoraAuditoriaService(BitacoraAuditoriaRepository repository, UsuarioRepository usuarioRepository) {
        this.repository = repository;
        this.usuarioRepository = usuarioRepository;
    }

    public List<BitacoraDTO> findAll() {
        return repository.findAllByOrderByFechaOperacionDesc().stream()
            .map(this::toDTO)
            .collect(Collectors.toList());
    }

    public List<BitacoraDTO> findByTabla(String tabla) {
        return repository.findByTablaAfectada(tabla).stream()
            .map(this::toDTO)
            .collect(Collectors.toList());
    }

    public List<BitacoraDTO> findByUsuarioId(Long usuarioId) {
        return repository.findByUsuarioId(usuarioId).stream()
            .map(this::toDTO)
            .collect(Collectors.toList());
    }

    public BitacoraAuditoria registrar(Long usuarioId, String operacion, String tabla,
                                        Long registroId, String detalles, String ip) {
        BitacoraAuditoria bitacora = new BitacoraAuditoria();
        if (usuarioId != null) {
            usuarioRepository.findById(usuarioId).ifPresent(bitacora::setUsuario);
        }
        bitacora.setOperacion(operacion);
        bitacora.setTablaAfectada(tabla);
        bitacora.setRegistroId(registroId);
        bitacora.setDetalles(detalles);
        bitacora.setDireccionIp(ip);
        return repository.save(bitacora);
    }

    public BitacoraDTO toDTO(BitacoraAuditoria bitacora) {
        BitacoraDTO dto = new BitacoraDTO();
        dto.setId(bitacora.getId());
        dto.setFechaOperacion(bitacora.getFechaOperacion());
        if (bitacora.getUsuario() != null) {
            dto.setUsuarioId(bitacora.getUsuario().getId());
            dto.setUsuarioNombre(bitacora.getUsuario().getNombreCompleto());
        }
        dto.setOperacion(bitacora.getOperacion());
        dto.setTablaAfectada(bitacora.getTablaAfectada());
        dto.setIp(bitacora.getDireccionIp());
        dto.setDetalle(bitacora.getDetalles());
        return dto;
    }
}
