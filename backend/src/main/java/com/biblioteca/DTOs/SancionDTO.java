package com.biblioteca.DTOs;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public class SancionDTO {
    private Long id;
    private Long usuarioId;
    private String usuarioNombre;
    private Long prestamoId;
    private String tipo;
    private String motivo;
    private Integer diasRetraso;
    private BigDecimal valorEconomico;
    private String estado;
    private OffsetDateTime fechaCreacion;
    private OffsetDateTime fechaResolucion;

    public SancionDTO() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUsuarioId() { return usuarioId; }
    public void setUsuarioId(Long usuarioId) { this.usuarioId = usuarioId; }

    public String getUsuarioNombre() { return usuarioNombre; }
    public void setUsuarioNombre(String usuarioNombre) { this.usuarioNombre = usuarioNombre; }

    public Long getPrestamoId() { return prestamoId; }
    public void setPrestamoId(Long prestamoId) { this.prestamoId = prestamoId; }

    public String getTipo() { return tipo; }
    public void setTipo(String tipo) { this.tipo = tipo; }

    public String getMotivo() { return motivo; }
    public void setMotivo(String motivo) { this.motivo = motivo; }

    public Integer getDiasRetraso() { return diasRetraso; }
    public void setDiasRetraso(Integer diasRetraso) { this.diasRetraso = diasRetraso; }

    public BigDecimal getValorEconomico() { return valorEconomico; }
    public void setValorEconomico(BigDecimal valorEconomico) { this.valorEconomico = valorEconomico; }

    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }

    public OffsetDateTime getFechaCreacion() { return fechaCreacion; }
    public void setFechaCreacion(OffsetDateTime fechaCreacion) { this.fechaCreacion = fechaCreacion; }

    public OffsetDateTime getFechaResolucion() { return fechaResolucion; }
    public void setFechaResolucion(OffsetDateTime fechaResolucion) { this.fechaResolucion = fechaResolucion; }
}
