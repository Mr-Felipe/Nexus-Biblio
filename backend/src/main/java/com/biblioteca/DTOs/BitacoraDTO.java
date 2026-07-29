package com.biblioteca.DTOs;

import java.time.OffsetDateTime;

public class BitacoraDTO {
    private Long id;
    private OffsetDateTime fechaOperacion;
    private Long usuarioId;
    private String usuarioNombre;
    private String operacion;
    private String tablaAfectada;
    private String ip;
    private String detalle;

    public BitacoraDTO() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public OffsetDateTime getFechaOperacion() { return fechaOperacion; }
    public void setFechaOperacion(OffsetDateTime fechaOperacion) { this.fechaOperacion = fechaOperacion; }

    public Long getUsuarioId() { return usuarioId; }
    public void setUsuarioId(Long usuarioId) { this.usuarioId = usuarioId; }

    public String getUsuarioNombre() { return usuarioNombre; }
    public void setUsuarioNombre(String usuarioNombre) { this.usuarioNombre = usuarioNombre; }

    public String getOperacion() { return operacion; }
    public void setOperacion(String operacion) { this.operacion = operacion; }

    public String getTablaAfectada() { return tablaAfectada; }
    public void setTablaAfectada(String tablaAfectada) { this.tablaAfectada = tablaAfectada; }

    public String getIp() { return ip; }
    public void setIp(String ip) { this.ip = ip; }

    public String getDetalle() { return detalle; }
    public void setDetalle(String detalle) { this.detalle = detalle; }
}
