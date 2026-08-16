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

// Valida email + password contra la BD. Devuelve el usuario si es correcto, o null si no.
// Compartida entre el login de API y el login del panel admin.
const validarCredenciales = async (email, password) => {
  const [rows] = await pool.query('SELECT * FROM usuarios WHERE email = ? AND activo = 1', [email]);
  if (rows.length === 0) {
    return null;
  }

  const usuario = rows[0];
  const passwordValida = await bcrypt.compare(password, usuario.password_hash);
  if (!passwordValida) {
    return null;
  }

  return usuario;
};

// Genera el JWT a partir de un usuario ya validado
const generarToken = (usuario) => {
  return jwt.sign(
    { id: usuario.id, nombre: usuario.nombre, rol: usuario.rol, marca_id: usuario.marca_id },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );
};

// Login de API: valida email + password, devuelve el token en el body (JSON)
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'email y password son obligatorios' });
    }

    const usuario = await validarCredenciales(email, password);
    if (!usuario) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = generarToken(usuario);

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

// Login del panel admin: valida email + password, setea el token como cookie httpOnly y redirige
const loginPanel = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.render('admin/login', { error: 'Email y contraseña son obligatorios' });
    }

    const usuario = await validarCredenciales(email, password);
    if (!usuario) {
      return res.render('admin/login', { error: 'Credenciales inválidas' });
    }

    const token = generarToken(usuario);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 8 * 60 * 60 * 1000 // 8 horas, igual que la expiración del JWT
    });

    res.redirect('/admin/proformas');
  } catch (error) {
    console.error(error);
    res.render('admin/login', { error: 'Error al iniciar sesión, intenta de nuevo' });
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

module.exports = { createUsuario, login, loginPanel, getUsuarios };