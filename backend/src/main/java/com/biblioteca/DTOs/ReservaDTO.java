package com.biblioteca.DTOs;

import java.time.OffsetDateTime;

public class ReservaDTO {
    private Long id;
    private Long usuarioId;
    private String usuarioNombre;
    private Long libroId;
    private String libroIsbn;
    private String libroTitulo;
    private OffsetDateTime fechaReserva;
    private Integer posicionCola;
    private String estado;

    public ReservaDTO() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUsuarioId() { return usuarioId; }
    public void setUsuarioId(Long usuarioId) { this.usuarioId = usuarioId; }

    public String getUsuarioNombre() { return usuarioNombre; }
    public void setUsuarioNombre(String usuarioNombre) { this.usuarioNombre = usuarioNombre; }

    public Long getLibroId() { return libroId; }
    public void setLibroId(Long libroId) { this.libroId = libroId; }

    public String getLibroIsbn() { return libroIsbn; }
    public void setLibroIsbn(String libroIsbn) { this.libroIsbn = libroIsbn; }

    public String getLibroTitulo() { return libroTitulo; }
    public void setLibroTitulo(String libroTitulo) { this.libroTitulo = libroTitulo; }

    public OffsetDateTime getFechaReserva() { return fechaReserva; }
    public void setFechaReserva(OffsetDateTime fechaReserva) { this.fechaReserva = fechaReserva; }

    public Integer getPosicionCola() { return posicionCola; }
    public void setPosicionCola(Integer posicionCola) { this.posicionCola = posicionCola; }

    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }
}
