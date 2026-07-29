package com.biblioteca.DTOs;

import java.util.List;

public class LibroDTO {
    private Long id;
    private String isbn;
    private String titulo;
    private String autor;
    private String editorial;
    private Integer anioPublicacion;
    private Integer stockMinimo;
    private String portadaUrl;
    private String estadoGeneral;
    private List<EjemplarDTO> ejemplares;
    private int totalEjemplares;
    private int disponibles;

    public LibroDTO() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getIsbn() { return isbn; }
    public void setIsbn(String isbn) { this.isbn = isbn; }

    public String getTitulo() { return titulo; }
    public void setTitulo(String titulo) { this.titulo = titulo; }

    public String getAutor() { return autor; }
    public void setAutor(String autor) { this.autor = autor; }

    public String getEditorial() { return editorial; }
    public void setEditorial(String editorial) { this.editorial = editorial; }

    public Integer getAnioPublicacion() { return anioPublicacion; }
    public void setAnioPublicacion(Integer anioPublicacion) { this.anioPublicacion = anioPublicacion; }

    public Integer getStockMinimo() { return stockMinimo; }
    public void setStockMinimo(Integer stockMinimo) { this.stockMinimo = stockMinimo; }

    public String getPortadaUrl() { return portadaUrl; }
    public void setPortadaUrl(String portadaUrl) { this.portadaUrl = portadaUrl; }

    public String getEstadoGeneral() { return estadoGeneral; }
    public void setEstadoGeneral(String estadoGeneral) { this.estadoGeneral = estadoGeneral; }

    public List<EjemplarDTO> getEjemplares() { return ejemplares; }
    public void setEjemplares(List<EjemplarDTO> ejemplares) { this.ejemplares = ejemplares; }

    public int getTotalEjemplares() { return totalEjemplares; }
    public void setTotalEjemplares(int totalEjemplares) { this.totalEjemplares = totalEjemplares; }

    public int getDisponibles() { return disponibles; }
    public void setDisponibles(int disponibles) { this.disponibles = disponibles; }
}
