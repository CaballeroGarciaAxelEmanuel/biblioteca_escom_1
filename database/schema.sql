-- database/schema.sql
CREATE DATABASE IF NOT EXISTS biblioteca_escom;
USE biblioteca_escom;

-- Tabla de usuarios
CREATE TABLE usuarios (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(100) NOT NULL,
    direccion TEXT,
    identificacion VARCHAR(50),
    rol ENUM('ADMIN', 'BIBLIOTECARIO', 'LECTOR') NOT NULL DEFAULT 'LECTOR',
    tiene_membresia BOOLEAN DEFAULT FALSE,
    estado ENUM('ACTIVO', 'INACTIVO', 'BLOQUEADO') DEFAULT 'ACTIVO',
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de materiales
CREATE TABLE materiales (
    id INT PRIMARY KEY AUTO_INCREMENT,
    isbn VARCHAR(20),
    titulo VARCHAR(200) NOT NULL,
    autor VARCHAR(100),
    editorial VARCHAR(100),
    categoria ENUM('LIBRO', 'REVISTA', 'PERIODICO', 'PELICULA', 'ARTICULO') NOT NULL,
    valor DECIMAL(10,2) DEFAULT 0.00
);

-- Tabla de préstamos
CREATE TABLE prestamos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT,
    material_id INT,
    fecha_prestamo DATE,
    fecha_devolucion DATE,
    estado ENUM('ACTIVO', 'COMPLETADO', 'RETRASADO')
);

-- Tabla de multas
CREATE TABLE multas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT,
    tipo ENUM('RETRASO', 'DANIO', 'PERDIDA'),
    monto DECIMAL(10,2),
    descripcion TEXT,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado ENUM('PENDIENTE', 'PAGADA')
);

-- Tabla de quejas/sugerencias
CREATE TABLE quejas_sugerencias (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT,
    tipo ENUM('QUEJA', 'SUGERENCIA'),
    mensaje TEXT,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    leido BOOLEAN DEFAULT FALSE
);

-- Insertar datos de prueba
INSERT INTO usuarios (nombre, email, password, rol, tiene_membresia) VALUES
('Administrador Principal', 'admin@ipn.mx', 'admi', 'ADMIN', TRUE),
('Bibliotecario Demo', 'biblio@ipn.mx', 'bibl', 'BIBLIOTECARIO', TRUE),
('Lector con Membresía', 'lector1@ipn.mx', 'lect', 'LECTOR', TRUE),
('Lector sin Membresía', 'lector2@ipn.mx', 'lect', 'LECTOR', FALSE);

INSERT INTO materiales (isbn, titulo, autor, editorial, categoria, valor) VALUES
('978-607-15-1234-5', 'Introducción a la Programación', 'Carlos Rodríguez', 'Pearson', 'LIBRO', 450.00),
('978-970-26-5678-9', 'Estructuras de Datos', 'Ana Martínez', 'McGraw-Hill', 'LIBRO', 550.00);

INSERT INTO prestamos (usuario_id, material_id, fecha_prestamo, fecha_devolucion, estado) VALUES
(3, 1, DATE_SUB(CURDATE(), INTERVAL 5 DAY), DATE_SUB(CURDATE(), INTERVAL 1 DAY), 'RETRASADO');

INSERT INTO multas (usuario_id, tipo, monto, descripcion, estado) VALUES
(3, 'RETRASO', 500.00, 'Retraso en devolución', 'PENDIENTE');

INSERT INTO quejas_sugerencias (usuario_id, tipo, mensaje) VALUES
(3, 'SUGERENCIA', 'Más libros de Python y machine learning');