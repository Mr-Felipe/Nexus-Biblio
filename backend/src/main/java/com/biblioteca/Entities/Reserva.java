package com.biblioteca.Entities;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "reservas")
public class Reserva {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "libro_id", nullable = false)
    private Libro libro;

    @Column(name = "fecha_reserva")
    private OffsetDateTime fechaReserva;

    @Column(name = "fecha_vencimiento")
    private OffsetDateTime fechaVencimiento;

    @Column(nullable = false, length = 20)
    private String estado = "PENDIENTE";

    @Column(name = "posicion_cola")
    private Integer posicionCola = 1;

    @Column(name = "fecha_creacion")
    private OffsetDateTime fechaCreacion;

    public Reserva() {
    }

    public Reserva(Long id, Usuario usuario, Libro libro, OffsetDateTime fechaReserva,
                   OffsetDateTime fechaVencimiento, String estado, Integer posicionCola,
                   OffsetDateTime fechaCreacion) {
        this.id = id;
        this.usuario = usuario;
        this.libro = libro;
        this.fechaReserva = fechaReserva;
        this.fechaVencimiento = fechaVencimiento;
        this.estado = estado;
        this.posicionCola = posicionCola;
        this.fechaCreacion = fechaCreacion;
    }

    @PrePersist
    protected void onCreate() {
        fechaCreacion = OffsetDateTime.now();
        if (fechaReserva == null) {
            fechaReserva = OffsetDateTime.now();
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Usuario getUsuario() { return usuario; }
    public void setUsuario(Usuario usuario) { this.usuario = usuario; }

    public Libro getLibro() { return libro; }
    public void setLibro(Libro libro) { this.libro = libro; }

    public OffsetDateTime getFechaReserva() { return fechaReserva; }
    public void setFechaReserva(OffsetDateTime fechaReserva) { this.fechaReserva = fechaReserva; }

    public OffsetDateTime getFechaVencimiento() { return fechaVencimiento; }
    public void setFechaVencimiento(OffsetDateTime fechaVencimiento) { this.fechaVencimiento = fechaVencimiento; }

    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }

    public Integer getPosicionCola() { return posicionCola; }
    public void setPosicionCola(Integer posicionCola) { this.posicionCola = posicionCola; }

    public OffsetDateTime getFechaCreacion() { return fechaCreacion; }
    public void setFechaCreacion(OffsetDateTime fechaCreacion) { this.fechaCreacion = fechaCreacion; }
}
