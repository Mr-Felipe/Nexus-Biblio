package com.biblioteca.DTOs;

import java.time.LocalDate;

public class PrestamoDTO {
    private Long id;
    private Long usuarioId;
    private String usuarioNombre;
    private Long ejemplarId;
    private String libroIsbn;
    private String libroTitulo;
    private String ejemplarCodigo;
    private LocalDate fechaPrestamo;
    private LocalDate fechaLimite;
    private LocalDate fechaRealDevolucion;
    private String estado;
    private String observaciones;
    private Long evaluadoPorId;
    private String evaluadoPorNombre;

    public PrestamoDTO() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUsuarioId() { return usuarioId; }
    public void setUsuarioId(Long usuarioId) { this.usuarioId = usuarioId; }

    public String getUsuarioNombre() { return usuarioNombre; }
    public void setUsuarioNombre(String usuarioNombre) { this.usuarioNombre = usuarioNombre; }

    public Long getEjemplarId() { return ejemplarId; }
    public void setEjemplarId(Long ejemplarId) { this.ejemplarId = ejemplarId; }

    public String getLibroIsbn() { return libroIsbn; }
    public void setLibroIsbn(String libroIsbn) { this.libroIsbn = libroIsbn; }

    public String getLibroTitulo() { return libroTitulo; }
    public void setLibroTitulo(String libroTitulo) { this.libroTitulo = libroTitulo; }

    public String getEjemplarCodigo() { return ejemplarCodigo; }
    public void setEjemplarCodigo(String ejemplarCodigo) { this.ejemplarCodigo = ejemplarCodigo; }

    public LocalDate getFechaPrestamo() { return fechaPrestamo; }
    public void setFechaPrestamo(LocalDate fechaPrestamo) { this.fechaPrestamo = fechaPrestamo; }

    public LocalDate getFechaLimite() { return fechaLimite; }
    public void setFechaLimite(LocalDate fechaLimite) { this.fechaLimite = fechaLimite; }

    public LocalDate getFechaRealDevolucion() { return fechaRealDevolucion; }
    public void setFechaRealDevolucion(LocalDate fechaRealDevolucion) { this.fechaRealDevolucion = fechaRealDevolucion; }

    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }

    public String getObservaciones() { return observaciones; }
    public void setObservaciones(String observaciones) { this.observaciones = observaciones; }

    public Long getEvaluadoPorId() { return evaluadoPorId; }
    public void setEvaluadoPorId(Long evaluadoPorId) { this.evaluadoPorId = evaluadoPorId; }

    public String getEvaluadoPorNombre() { return evaluadoPorNombre; }
    public void setEvaluadoPorNombre(String evaluadoPorNombre) { this.evaluadoPorNombre = evaluadoPorNombre; }
}
