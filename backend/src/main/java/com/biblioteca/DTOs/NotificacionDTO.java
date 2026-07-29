package com.biblioteca.DTOs;

import java.time.OffsetDateTime;

public class NotificacionDTO {
    private Long id;
    private String mensaje;
    private String tipo;
    private Boolean leida;
    private OffsetDateTime fechaCreacion;

    public NotificacionDTO() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getMensaje() { return mensaje; }
    public void setMensaje(String mensaje) { this.mensaje = mensaje; }

    public String getTipo() { return tipo; }
    public void setTipo(String tipo) { this.tipo = tipo; }

    public Boolean getLeida() { return leida; }
    public void setLeida(Boolean leida) { this.leida = leida; }

    public OffsetDateTime getFechaCreacion() { return fechaCreacion; }
    public void setFechaCreacion(OffsetDateTime fechaCreacion) { this.fechaCreacion = fechaCreacion; }
}
