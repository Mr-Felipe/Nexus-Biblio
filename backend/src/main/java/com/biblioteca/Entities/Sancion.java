package com.biblioteca.Entities;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "sanciones")
public class Sancion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "prestamo_id")
    private Prestamo prestamo;

    @Column(nullable = false, length = 20)
    private String tipo;

    @Column(columnDefinition = "text")
    private String motivo;

    @Column(name = "dias_retraso")
    private Integer diasRetraso;

    @Column(name = "valor_economico", precision = 10, scale = 2)
    private BigDecimal valorEconomico;

    @Column(nullable = false, length = 20)
    private String estado = "ACTIVA";

    @Column(name = "fecha_creacion")
    private OffsetDateTime fechaCreacion;

    @Column(name = "fecha_resolucion")
    private OffsetDateTime fechaResolucion;

    public Sancion() {
    }

    public Sancion(Long id, Usuario usuario, Prestamo prestamo, String tipo, String motivo,
                   Integer diasRetraso, BigDecimal valorEconomico, String estado,
                   OffsetDateTime fechaCreacion, OffsetDateTime fechaResolucion) {
        this.id = id;
        this.usuario = usuario;
        this.prestamo = prestamo;
        this.tipo = tipo;
        this.motivo = motivo;
        this.diasRetraso = diasRetraso;
        this.valorEconomico = valorEconomico;
        this.estado = estado;
        this.fechaCreacion = fechaCreacion;
        this.fechaResolucion = fechaResolucion;
    }

    @PrePersist
    protected void onCreate() {
        fechaCreacion = OffsetDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Usuario getUsuario() { return usuario; }
    public void setUsuario(Usuario usuario) { this.usuario = usuario; }

    public Prestamo getPrestamo() { return prestamo; }
    public void setPrestamo(Prestamo prestamo) { this.prestamo = prestamo; }

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
