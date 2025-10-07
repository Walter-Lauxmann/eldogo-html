<?php
// Requerimos el archivo modelos.php
require_once 'modelos.php';

// Si hay un parámetro tabla
if(isset($_GET['tabla'])) {
    $tabla = new Modelo($_GET['tabla']); // Creamos el objeto $tabla
    if(isset($_GET['id'])) { // Si está seteado el id
        $tabla->setCriterio("id=" . $_GET['id']); // Establecemos el criterio
    }    

    if(isset($_GET['accion'])) { // Si está seteada la acción
        if($_GET['accion'] == 'insertar' || $_GET['accion'] == 'actualizar') { // Si la acción es insertar o actualizar
            $valores = $_POST; // Guardamos los valores que vienen desde el formulario
            // Subida de imágenes
            if(                                             // Si
                isset($_FILES) &&                           // Está seteado $_FILES Y
                isset($_FILES['imagen']) &&                 // Está seteado imagen dentro de $_FILES Y
                !empty($_FILES['imagen']['name'] &&         // Imagen tiene nombre Y
                !empty($_FILES['imagen']['tmp_name']))      // imagen tiene nombre temporal
            ) {
                if(is_uploaded_file($_FILES['imagen']['tmp_name'])) {   // Si está subido el archivo temporal
                    $nombre_temporal = $_FILES['imagen']['tmp_name'];   // Guardamos el nombre temporal
                    $nombre = $_FILES['imagen']['name'];                // Guardamos el nombre
                    $destino = '../imagenes/productos/' . $nombre;       // Guardamos la carpeta de subida

                    if(move_uploaded_file($nombre_temporal, $destino)) { // Si se puede mover el archivo temporal al destino
                        $respuesta = [                                   // Definimos una respuesta
                            'success' => true,
                            'message' => 'Archivo subido correctamente a ' . $destino                    
                        ];
                        $valores['imagen'] = $nombre;                    // Guardamos el nombre de la imagen en el array valores
                    } else {                                             // Sino
                        $respuesta = [
                            'success' => false,
                            'message' => 'No se ha podido subir el archivo a ' . $destino                    
                        ];
                        unlink(ini_get('upload_tmp_dir').$nombre_temporal); // Eliminamos el archivo temporal
                    }
                } else {                                                    // Sino
                    $respuesta = [
                            'success' => false,
                            'message' => 'El archivo no fue procesado correctamente '                    
                        ];
                }
            }
        }

        switch ($_GET['accion']) { // Según la acción
            case 'seleccionar':
                $datos = $tabla->seleccionar(); // Ejecutamos el método seleccionar
                print_r($datos) ; // Mostramos los datos
                break;

            case 'insertar':                
                // Ejecutamos el método insertar y capturamos el ID
                $id = $tabla->insertar($valores);
    
                // Verificamos si se obtuvo un ID válido
                if ($id > 0) {
                    $respuesta = [
                        'success' => true,
                        'message' => 'Registro insertado correctamente.',
                        'id' => $id 
                    ];
                } else {
                    // En caso de que falle la inserción
                    $respuesta = [
                        'success' => false,
                        'message' => 'Error al insertar el registro.'
                    ];
                }
                
                // Siempre enviamos la respuesta JSON al final
                echo json_encode($respuesta);
                break;

            case 'actualizar':
                $tabla->actualizar($valores); // Ejecutamos el método actualizar
                $respuesta = [
                    'success' => true,
                    'message' => 'Registro actualizado correctamente.'
                ];
                echo json_encode($respuesta);
                break;

            case 'eliminar':
                $tabla->eliminar(); // Ejecutamos el método eliminar)
                $respuesta = [
                    'success' => true,
                    'message' => 'Registro eliminado correctamente.'
                ];
                echo json_encode($respuesta);
                break;
        }
    }
    
}
?>