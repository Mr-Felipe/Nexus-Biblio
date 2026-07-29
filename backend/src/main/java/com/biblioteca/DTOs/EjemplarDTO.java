package com.biblioteca.DTOs;

public class EjemplarDTO {
    private Long id;
    private int numero;
    private String codigo;
    private String estado;

    public EjemplarDTO() {}

    public EjemplarDTO(Long id, int numero, String codigo, String estado) {
        this.id = id;
        this.numero = numero;
        this.codigo = codigo;
        this.estado = estado;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public int getNumero() { return numero; }
    public void setNumero(int numero) { this.numero = numero; }

    public String getCodigo() { return codigo; }
    public void setCodigo(String codigo) { this.codigo = codigo; }

    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }
}
