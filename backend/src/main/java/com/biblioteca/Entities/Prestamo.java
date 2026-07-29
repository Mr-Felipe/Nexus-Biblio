package com.biblioteca.Entities;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.OffsetDateTime;

@Entity
@Table(name = "prestamos")
public class Prestamo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ejemplar_id", nullable = false)
    private Ejemplar ejemplar;

    @Column(name = "fecha_prestamo", nullable = false)
    private LocalDate fechaPrestamo;

    @Column(name = "fecha_limite_devolucion", nullable = false)
    private LocalDate fechaLimiteDevolucion;

    @Column(name = "fecha_real_devolucion")
    private LocalDate fechaRealDevolucion;

    @Column(name = "fecha_creacion")
    private OffsetDateTime fechaCreacion;

    @Column(nullable = false, length = 30)
    private String estado = "ACTIVO";

    @Column(columnDefinition = "text")
    private String observaciones;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "evaluado_por")
    private Usuario evaluadoPor;

    public Prestamo() {
    }

    public Prestamo(Long id, Usuario usuario, Ejemplar ejemplar, LocalDate fechaPrestamo,
                    LocalDate fechaLimiteDevolucion, LocalDate fechaRealDevolucion,
                    OffsetDateTime fechaCreacion, String estado, String observaciones,
                    Usuario evaluadoPor) {
        this.id = id;
        this.usuario = usuario;
        this.ejemplar = ejemplar;
        this.fechaPrestamo = fechaPrestamo;
        this.fechaLimiteDevolucion = fechaLimiteDevolucion;
        this.fechaRealDevolucion = fechaRealDevolucion;
        this.fechaCreacion = fechaCreacion;
        this.estado = estado;
        this.observaciones = observaciones;
        this.evaluadoPor = evaluadoPor;
    }

    @PrePersist
    protected void onCreate() {
        fechaCreacion = OffsetDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Usuario getUsuario() { return usuario; }
    public void setUsuario(Usuario usuario) { this.usuario = usuario; }

    public Ejemplar getEjemplar() { return ejemplar; }
    public void setEjemplar(Ejemplar ejemplar) { this.ejemplar = ejemplar; }

    public LocalDate getFechaPrestamo() { return fechaPrestamo; }
    public void setFechaPrestamo(LocalDate fechaPrestamo) { this.fechaPrestamo = fechaPrestamo; }

    public LocalDate getFechaLimiteDevolucion() { return fechaLimiteDevolucion; }
    public void setFechaLimiteDevolucion(LocalDate fechaLimiteDevolucion) { this.fechaLimiteDevolucion = fechaLimiteDevolucion; }

    public LocalDate getFechaRealDevolucion() { return fechaRealDevolucion; }
    public void setFechaRealDevolucion(LocalDate fechaRealDevolucion) { this.fechaRealDevolucion = fechaRealDevolucion; }

    public OffsetDateTime getFechaCreacion() { return fechaCreacion; }
    public void setFechaCreacion(OffsetDateTime fechaCreacion) { this.fechaCreacion = fechaCreacion; }

    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }

    public String getObservaciones() { return observaciones; }
    public void setObservaciones(String observaciones) { this.observaciones = observaciones; }

    public Usuario getEvaluadoPor() { return evaluadoPor; }
    public void setEvaluadoPor(Usuario evaluadoPor) { this.evaluadoPor = evaluadoPor; }
}
