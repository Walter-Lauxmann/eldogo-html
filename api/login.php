<?php
require_once 'modelos.php';        //Requerimos la clse Modelo

$valores = $_POST; // Guardamos los valores del formulario

// Creamos las variables de usuario y password
$usuario = "'" . $_POST['usuario'] . "'";
$password = "'" . $_POST['password'] . "'";

$usuarios = new Modelo('clientes'); // Creamos el objeto Usuarios

// Establecemos el criterio con el usuario y password
$usuarios->setCriterio("usuario=$usuario AND password=$password");

// Seleccionamos los datos
$datos = $usuarios->seleccionar();

// Devolvemos los datos
echo $datos;
?>