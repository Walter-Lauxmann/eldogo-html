<?php
require_once 'config.php'; // Requerimos el archivo config.php

/**
 * Clase que nos permitre conectarnos a la BD
 */
class Conexion {
    // Propiedades
    protected $bd; // Conexión a la BD

    // Contructor (se ejecuta al crear un objeto)
    public function __construct()
    {
        // guardamos en la propiedad $bd la conexión a la BD
        $this->bd = new mysqli(DB_HOST,DB_USER,DB_PASSWORD,DB_NAME);

        // Si se produce un error de conexión, muestra un error
        if( $this->bd->connect_errno ) {
            echo 'Fallo al conectar a MySQL: ' . $this->bd->connect_error;
            return;
        }

        // Establecer el conjunto de caracteres a utf8
        $this->bd->set_charset(DB_CHARSET);
        $this->bd->query("SET NAMES 'utf8'");
    }
}


/**
 * Clase basada en Conexion 
 * para manipular los datos de la BD
 */
class Modelo extends Conexion {
    // Propiedades
    private $tabla;             // Nombre de la tabla
    private $campos= '*';       // Lista de campos
    private $id= 0;             // id del registro
    private $criterio= '';      // Criterio para las consultas
    private $orden= 'id';       // Campos de ordenamiento
    private $limite= 0;         // Cantidad de registros

    // Constructor
    public function __construct($tabla)
    {
        parent::__construct();  // Ejecutamos el constructor padre
        $this->tabla= $tabla;   // Guardamos en la propiedad $tabla, el valor del argumento        
    }

    // Getter y Setters
    public function getCampos() {
        return $this->campos;
    }
    public function setCampos($campos) {
        $this->campos= $campos;
    }
    public function getId() {
        return $this->id;
    }
    public function setId($id) {
        $this->id= $id;
    }
    public function getCriterio() {
        return $this->criterio;
    }
    public function setCriterio($criterio) {
        $this->criterio= $criterio;
    }
    public function getOrden() {
        return $this->orden;
    }
    public function setOrden($orden) {
        $this->orden= $orden;
    }
    public function getLimite() {
        return $this->limite;
    }
    public function setLimite($limite) {
        $this->limite= $limite;
    }
    
    /**
     * Selecciona los datos de la BD
     * @return datos los datos obtenidos
     */
    public function seleccionar() {
        // SELECT * FROM productos WHERE id='10' ORDER BY id LIMIT 10
        $sql = "SELECT $this->campos FROM $this->tabla";
        // Si hay un criterio, lo agregamos
        if($this->criterio != '') {
            $sql .= " WHERE $this->criterio";
        }
        // Agregamos el orden
        $sql .= " ORDER BY $this->orden";

        // Si el límite es > 0, agregamos el límite
        if($this->limite > 0) {
            $sql .= " LIMIT $this->limite";
        }

        // echo $sql . '<br>'; // Mostramos la instrucción SQL resultante

        // Ejecutamos la instrucción SQL
        $resultado = $this->bd->query($sql);
        $datos = $resultado->fetch_all(MYSQLI_ASSOC); // Guardamos los datos en un array
        $datos = json_encode($datos); // Convertimos los datos a JSON

        return $datos;
    }

    /**
     * Inserta un registro en la BD
     * @param datos los datos a insertar
     * @return id el id del registro insertado
     */
    public function insertar($datos) {
        // INSERT INTO productos (codigo, nombre, descripcion, precio, stock, imagen)
        // VALUES ('201', 'Motorola G9', 'Un gran teléfono', '450000', '30', 'motorola.jpg')
        unset($datos->id); // Eliminamos el valor de id
        $campos = implode(",",array_keys($datos)); // Separar las claves del array
        $valores = implode("','", array_values($datos)); // Separamos los valores del array

        // Guardamos la instrucción SQL
        $sql ="INSERT INTO $this->tabla ($campos) VALUES ('$valores')";
        //echo $sql; // Mostramos la instrucción SQL

        // Ejecutamos la instrucción SQL y devolvemos el id
        if ($this->bd->query($sql)) {
            // Si la consulta fue exitosa, devolvemos el ID autoincremental
            return $this->bd->insert_id;
        } else {
            // Si hubo un error, devolvemos 0 o false
            return 0; 
        }
    }

    /**
     * Permite actualizar un registro en la BD
     * @param datos los datos a actualizar
     * @return
     */
    public function actualizar($datos) {
        // UPDATE productos SET codigo='101', nombre='Samsung A56', ... WHERE id='3'
        $actualizaciones= [];
        foreach($datos as $key => $value) {
            $actualizaciones[] = "$key='$value'";
        }
        $sql = "UPDATE $this->tabla SET " . implode(",", $actualizaciones) . " WHERE $this->criterio";
        //echo $sql; // Mostramos la instrucción SQL
        $this->bd->query($sql);
    }

    /**
     * Permite eliminar un registro en la BD
     * @return
     */
    public function eliminar() {
        // DELETE FROM productos WHERE id='1'
        $sql = "DELETE FROM $this->tabla WHERE $this->criterio";
        $this->bd->query($sql);
    }

}
?>