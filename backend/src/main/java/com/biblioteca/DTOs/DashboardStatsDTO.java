package com.biblioteca.DTOs;

public class DashboardStatsDTO {
    private int totalBooks;
    private int totalEjemplares;
    private int availableBooks;
    private int activeLoans;
    private int pendingReturns;
    private int totalLoans;
    private int activeReservations;
    private int activeSanctions;
    private double totalFines;
    private int activeUsers;
    private int totalUsuarios;

    public DashboardStatsDTO() {}

    public int getTotalBooks() { return totalBooks; }
    public void setTotalBooks(int totalBooks) { this.totalBooks = totalBooks; }

    public int getTotalEjemplares() { return totalEjemplares; }
    public void setTotalEjemplares(int totalEjemplares) { this.totalEjemplares = totalEjemplares; }

    public int getAvailableBooks() { return availableBooks; }
    public void setAvailableBooks(int availableBooks) { this.availableBooks = availableBooks; }

    public int getActiveLoans() { return activeLoans; }
    public void setActiveLoans(int activeLoans) { this.activeLoans = activeLoans; }

    public int getPendingReturns() { return pendingReturns; }
    public void setPendingReturns(int pendingReturns) { this.pendingReturns = pendingReturns; }

    public int getTotalLoans() { return totalLoans; }
    public void setTotalLoans(int totalLoans) { this.totalLoans = totalLoans; }

    public int getActiveReservations() { return activeReservations; }
    public void setActiveReservations(int activeReservations) { this.activeReservations = activeReservations; }

    public int getActiveSanctions() { return activeSanctions; }
    public void setActiveSanctions(int activeSanctions) { this.activeSanctions = activeSanctions; }

    public double getTotalFines() { return totalFines; }
    public void setTotalFines(double totalFines) { this.totalFines = totalFines; }

    public int getActiveUsers() { return activeUsers; }
    public void setActiveUsers(int activeUsers) { this.activeUsers = activeUsers; }

    public int getTotalUsuarios() { return totalUsuarios; }
    public void setTotalUsuarios(int totalUsuarios) { this.totalUsuarios = totalUsuarios; }
}
