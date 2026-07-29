package com.biblioteca.Entities;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "bitacora_auditoria")
public class BitacoraAuditoria {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id")
    private Usuario usuario;

    @Column(nullable = false, length = 50)
    private String operacion;

    @Column(name = "tabla_afectada", nullable = false, length = 50)
    private String tablaAfectada;

    @Column(name = "registro_id")
    private Long registroId;

    @Column(columnDefinition = "jsonb")
    private String detalles;

    @Column(name = "fecha_operacion")
    private OffsetDateTime fechaOperacion;

    @Column(name = "direccion_ip", length = 45)
    private String direccionIp;

    public BitacoraAuditoria() {
    }

    public BitacoraAuditoria(Long id, Usuario usuario, String operacion, String tablaAfectada,
                             Long registroId, String detalles, OffsetDateTime fechaOperacion,
                             String direccionIp) {
        this.id = id;
        this.usuario = usuario;
        this.operacion = operacion;
        this.tablaAfectada = tablaAfectada;
        this.registroId = registroId;
        this.detalles = detalles;
        this.fechaOperacion = fechaOperacion;
        this.direccionIp = direccionIp;
    }

    @PrePersist
    protected void onCreate() {
        fechaOperacion = OffsetDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Usuario getUsuario() { return usuario; }
    public void setUsuario(Usuario usuario) { this.usuario = usuario; }

    public String getOperacion() { return operacion; }
    public void setOperacion(String operacion) { this.operacion = operacion; }

    public String getTablaAfectada() { return tablaAfectada; }
    public void setTablaAfectada(String tablaAfectada) { this.tablaAfectada = tablaAfectada; }

    public Long getRegistroId() { return registroId; }
    public void setRegistroId(Long registroId) { this.registroId = registroId; }

    public String getDetalles() { return detalles; }
    public void setDetalles(String detalles) { this.detalles = detalles; }

    public OffsetDateTime getFechaOperacion() { return fechaOperacion; }
    public void setFechaOperacion(OffsetDateTime fechaOperacion) { this.fechaOperacion = fechaOperacion; }

    public String getDireccionIp() { return direccionIp; }
    public void setDireccionIp(String direccionIp) { this.direccionIp = direccionIp; }
}
