const pool = require('../config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Registrar un nuevo usuario (solo lo debería usar un Admin desde el panel)
const createUsuario = async (req, res) => {
  try {
    const { marca_id, nombre, email, password, rol, descuento_max_permitido } = req.body;
    if (!nombre || !email || !password) {
      return res.status(400).json({ error: 'nombre, email y password son obligatorios' });
    }

    // Validación básica: el descuento debe ser un porcentaje razonable (0-100)
    if (descuento_max_permitido !== undefined) {
      const valor = Number(descuento_max_permitido);
      if (isNaN(valor) || valor < 0 || valor > 100) {
        return res.status(400).json({ error: 'descuento_max_permitido debe ser un número entre 0 y 100' });
      }
    }

    const password_hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      `INSERT INTO usuarios (marca_id, nombre, email, password_hash, rol, descuento_max_permitido) VALUES (?, ?, ?, ?, ?, ?)`,
      [marca_id || null, nombre, email, password_hash, rol || 'ASESOR', descuento_max_permitido ?? 10.00]
    );
    res.status(201).json({ id: result.insertId, mensaje: 'Usuario creado correctamente' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Ya existe un usuario con ese email' });
    }
    console.error(error);
    res.status(500).json({ error: 'Error al crear el usuario' });
  }
};

// Login: valida email + password, devuelve un token si es correcto
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'email y password son obligatorios' });
    }

    const [rows] = await pool.query('SELECT * FROM usuarios WHERE email = ? AND activo = 1', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const usuario = rows[0];
    const passwordValida = await bcrypt.compare(password, usuario.password_hash);
    if (!passwordValida) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
      { id: usuario.id, nombre: usuario.nombre, rol: usuario.rol, marca_id: usuario.marca_id },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      mensaje: 'Login exitoso',
      token,
      usuario: { id: usuario.id, nombre: usuario.nombre, rol: usuario.rol, marca_id: usuario.marca_id }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
};

// Listar usuarios (para el panel admin)
const getUsuarios = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, marca_id, nombre, email, rol, activo, creado_en, descuento_max_permitido FROM usuarios'
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener los usuarios' });
  }
};

module.exports = { createUsuario, login, getUsuarios };