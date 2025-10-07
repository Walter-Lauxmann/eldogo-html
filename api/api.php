<?php
// Permitir el acceso desde cualquier origen (necesario para pruebas locales con JS)
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header('Content-Type: application/json');

// Si la solicitud es OPTIONS (preflight), respondemos y terminamos.
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// --- Configuración de Conexión (Ajusta estos valores) ---
define('DB_HOST', 'localhost'); // Servidor de Base de Datos
define('DB_USER', 'root'); // Usuario de la Base de Datos
define('DB_PASSWORD', ''); // Contraseña de Base de Datos
define('DB_NAME', 'veterinaria'); // Nombre de la Base de Datos
define('DB_CHARSET', 'utf8'); // Cotejamiento - Conjunto de caracteres
define('ADMIN_EMAIL', 'admin@el-dogo.com'); // Correo fijo del administrador

/**
 * Clase que nos permitre conectarnos a la BD
 */
class Conexion {
    protected $bd;

    public function __construct()
    {
        // Activa el manejo de errores de MySQLi
        mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT); 
        
        try {
            $this->bd = new mysqli(DB_HOST,DB_USER,DB_PASSWORD,DB_NAME);
            if( $this->bd->connect_errno ) {
                throw new Exception('Fallo al conectar a MySQL: ' . $this->bd->connect_error);
            }
            $this->bd->set_charset(DB_CHARSET);
            $this->bd->query("SET NAMES 'utf8'");
        } catch (Exception $e) {
            // Envía una respuesta JSON de error de conexión y detiene la ejecución
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error de conexión a la base de datos: ' . $e->getMessage()]);
            exit;
        }
    }

    public function getError() {
        return $this->bd->error;
    }
}


/**
 * Clase basada en Conexion 
 * para manipular los datos de la BD
 */
class Modelo extends Conexion {
    private $tabla;
    private $campos = '*';
    private $criterio = '';
    private $orden = 'id';
    private $limite = 0;

    public function __construct($tabla)
    {
        parent::__construct();
        $this->tabla = $tabla;
    }

    // Setters
    public function setCampos($campos) { $this->campos = $campos; }
    public function setCriterio($criterio) { $this->criterio = $criterio; }
    public function setOrden($orden) { $this->orden = $orden; }
    public function setLimite($limite) { $this->limite = $limite; }
    
    /**
     * Selecciona los datos de la BD
     */
    public function seleccionar() {
        $sql = "SELECT $this->campos FROM $this->tabla";
        if($this->criterio != '') {
            $sql .= " WHERE $this->criterio";
        }
        $sql .= " ORDER BY $this->orden";

        if($this->limite > 0) {
            $sql .= " LIMIT $this->limite";
        }

        $resultado = $this->bd->query($sql);
        
        if (!$resultado) {
            return json_encode([]); 
        }

        $datos = $resultado->fetch_all(MYSQLI_ASSOC);
        return json_encode($datos);
    }

    /**
     * Inserta un registro en la BD
     */
    public function insertar($datos) {
        $datosArray = (array)$datos; // Aseguramos que sea un array
        unset($datosArray['id']);
        
        // Escapar valores para prevenir inyección SQL
        $campos = [];
        $valores = [];
        foreach($datosArray as $key => $value) {
            $campos[] = $key;
            $valores[] = $this->bd->real_escape_string((string)$value);
        }

        $camposStr = implode(",", $campos);
        $valoresStr = "'" . implode("','", $valores) . "'";

        $sql ="INSERT INTO $this->tabla ($camposStr) VALUES ($valoresStr)";

        if ($this->bd->query($sql)) {
            return $this->bd->insert_id;
        } else {
            // error_log("Error de inserción: " . $this->bd->error . " SQL: " . $sql);
            return 0; 
        }
    }

    /**
     * Permite actualizar un registro en la BD
     */
    public function actualizar($datos) {
        $actualizaciones = [];
        $querySuccessful = false;
        
        foreach((array)$datos as $key => $value) {
             // Escapar valores
            $actualizaciones[] = "$key='" . $this->bd->real_escape_string((string)$value) . "'";
        }
        $sql = "UPDATE $this->tabla SET " . implode(",", $actualizaciones) . " WHERE $this->criterio";
        
        if ($this->bd->query($sql)) {
            // El número de filas afectadas es mayor a 0 si la actualización tuvo éxito
            $querySuccessful = $this->bd->affected_rows > 0 || $this->bd->errno === 0;
        }
        return $querySuccessful;
    }

    /**
     * Permite eliminar un registro en la BD
     */
    public function eliminar() {
        $sql = "DELETE FROM $this->tabla WHERE $this->criterio";
        $this->bd->query($sql);
        return $this->bd->affected_rows > 0;
    }
}


// --- Lógica de Manejo de Solicitudes y Enrutador ---

// 1. Obtener el método HTTP y los datos de entrada
$method = $_SERVER['REQUEST_METHOD'];
$inputData = [];

if ($method == 'POST' || $method == 'PUT' || $method == 'DELETE') {
    // Intenta leer JSON del cuerpo de la solicitud (usado por fetch/axios)
    $json = file_get_contents('php://input');
    $inputData = json_decode($json, true);
    
    // Si no es JSON válido o está vacío, usa $_POST como fallback
    if ($inputData === null) {
        $inputData = [];
    }
}

// Para GET, los datos de entrada están en $_GET y se fusionan con los del body
$inputData = array_merge($inputData, $_GET);

// 2. Determinar la ruta
// La ruta viene en el parámetro 'route' (ej: api.php?route=auth/login)
$route = $inputData['route'] ?? null;
if (!$route) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Ruta de API no especificada.']);
    exit;
}

$parts = explode('/', $route);
$response = ['success' => false, 'message' => 'Ruta o método no válido.'];
http_response_code(405); // Código de respuesta por defecto: Method Not Allowed

// --- Funciones de Endpoint ---

function handleAuthRegister($data) {
    if (!isset($data['email'], $data['password'], $data['nombre'])) {
        return ['success' => false, 'message' => 'Faltan campos obligatorios para el registro (email, password, nombre).'];
    }

    $clienteModel = new Modelo('clientes');

    // 1. Verificar si el email ya existe
    $clienteModel->setCriterio("email='{$data['email']}'");
    $clienteModel->setCampos('id');
    $existingUser = json_decode($clienteModel->seleccionar(), true);
    if (!empty($existingUser)) {
        return ['success' => false, 'message' => 'El correo electrónico ya está registrado.'];
    }

    // 2. Hash de Contraseña (CRÍTICO para seguridad)
    $hashedPassword = password_hash($data['password'], PASSWORD_DEFAULT);
    
    // 3. Preparar datos para la inserción
    $insertData = [
        'nombre' => $data['nombre'],
        'apellido' => $data['apellido'] ?? 'S/D', 
        'documento' => $data['documento'] ?? 'S/D',
        'direccion' => $data['direccion'] ?? 'S/D', 
        'localidad' => $data['localidad'] ?? 'S/D',
        'telefono' => $data['telefono'] ?? 'S/D',
        'foto' => $data['foto'] ?? 'default.png',
        'email' => $data['email'],
        'usuario' => $data['email'], 
        'password' => $hashedPassword, // Guardar la contraseña hasheada
        'rol' => 'client', // NUEVO: Definir rol por defecto al registrar
    ];

    $id = $clienteModel->insertar((object)$insertData); 
    
    if ($id > 0) {
        return ['success' => true, 'message' => 'Registro insertado correctamente.', 'id' => $id];
    } else {
        return ['success' => false, 'message' => 'Error al insertar el registro.'];
    }
}

function handleAuthLogin($data) {
    if (!isset($data['email'], $data['password'])) {
        return ['success' => false, 'message' => 'Correo y contraseña son obligatorios.'];
    }
    
    $clienteModel = new Modelo('clientes');
    
    // Buscar usuario por email
    // Aseguramos obtener el rol del usuario
    $clienteModel->setCampos('id, nombre, email, password, rol'); 
    $clienteModel->setCriterio("email='{$data['email']}'");
    $clienteModel->setLimite(1);
    $result = json_decode($clienteModel->seleccionar(), true);
    
    if (empty($result)) {
        return ['success' => false, 'message' => 'Credenciales incorrectas o usuario no encontrado.'];
    }
    
    $user = $result[0];

    // Verificar contraseña hasheada
    if (password_verify($data['password'], $user['password'])) {
        // Si el email coincide con el admin fijo, sobreescribir por seguridad
        $role = ($user['email'] === ADMIN_EMAIL) ? 'admin' : ($user['rol'] ?? 'client'); 
        return [
            'success' => true,
            'user' => [
                'id' => $user['id'],
                'nombre' => $user['nombre'],
                'email' => $user['email'],
                'role' => $role,
            ]
        ];
    } else {
        return ['success' => false, 'message' => 'Credenciales incorrectas.'];
    }
}


// --- Lógica de CRUD de Mascotas (Pets) ---

function handlePetsAdd($data) {
    if (!isset($data['clientes_id'], $data['nombre'], $data['especie'], $data['raza'])) {
        return ['success' => false, 'message' => 'Faltan campos obligatorios para la mascota.'];
    }

    $mascotaModel = new Modelo('mascotas');

    // Preparar datos para la inserción
    $insertData = [
        'clientes_id' => $data['clientes_id'],
        'nombre' => $data['nombre'],
        'especie' => $data['especie'],
        'raza' => $data['raza'],
        'foto' => $data['foto'] ?? 'default_pet.png', 
        'historia_clinica' => $data['historia_clinica'] ?? 'Registro inicial.',
    ];

    $id = $mascotaModel->insertar((object)$insertData);
    
    if ($id > 0) {
        return ['success' => true, 'message' => 'Mascota registrada correctamente.', 'id' => $id];
    } else {
        return ['success' => false, 'message' => 'Error al registrar la mascota.'];
    }
}

function handlePetsList($data) {
    if (!isset($data['client_id'])) {
        return ['success' => false, 'message' => 'ID de cliente es obligatorio.'];
    }

    $mascotaModel = new Modelo('mascotas');
    // Filtra por el ID del cliente
    $mascotaModel->setCriterio("clientes_id='" . (int)$data['client_id'] . "'"); 
    $pets = json_decode($mascotaModel->seleccionar(), true);
    
    return [
        'success' => true,
        'pets' => $pets
    ];
}

function handlePetsUpdate($data) {
    if (!isset($data['id'])) {
        return ['success' => false, 'message' => 'ID de mascota es obligatorio para la actualización.'];
    }
    
    $mascotaModel = new Modelo('mascotas');
    $mascotaId = (int)$data['id'];
    
    $mascotaModel->setCriterio("id='{$mascotaId}'");
    unset($data['id']);
    
    if (empty($data)) {
        return ['success' => false, 'message' => 'No se enviaron campos para actualizar.'];
    }
    
    $updated = $mascotaModel->actualizar($data);
    
    if ($updated) {
        return ['success' => true, 'message' => 'Mascota actualizada correctamente.'];
    } else {
        return ['success' => false, 'message' => 'Error al actualizar la mascota o el registro no fue encontrado.'];
    }
}

function handlePetsDelete($data) {
    if (!isset($data['id'])) {
        return ['success' => false, 'message' => 'ID de mascota es obligatorio para la eliminación.'];
    }
    
    $mascotaModel = new Modelo('mascotas');
    $mascotaId = (int)$data['id'];
    
    $mascotaModel->setCriterio("id='{$mascotaId}'");
    $deleted = $mascotaModel->eliminar();

    if ($deleted) {
        return ['success' => true, 'message' => 'Mascota eliminada correctamente.'];
    } else {
        return ['success' => false, 'message' => 'Error al eliminar la mascota o no se encontró el registro.'];
    }
}

// --- Lógica de CRUD de Clientes (Clients) - Nuevo para Admin ---

function handleClientsList($data) {
    $clienteModel = new Modelo('clientes');
    // Campos sensibles que se requieren en el front para edición
    $clienteModel->setCampos('id, nombre, apellido, documento, direccion, localidad, telefono, email, usuario, foto, rol');
    $clients = json_decode($clienteModel->seleccionar(), true);
    
    // Opcional: Remover la contraseña si la hubiéramos traído.
    
    return [
        'success' => true,
        'clients' => $clients
    ];
}

function handleClientsUpdate($data) {
    if (!isset($data['id'])) {
        return ['success' => false, 'message' => 'ID de cliente es obligatorio para la actualización.'];
    }
    
    $clienteModel = new Modelo('clientes');
    $clienteId = (int)$data['id'];
    
    $clienteModel->setCriterio("id='{$clienteId}'");
    
    // Manejar la contraseña si se actualiza (debe ser hasheada)
    if (isset($data['password']) && !empty($data['password'])) {
        $data['password'] = password_hash($data['password'], PASSWORD_DEFAULT);
    } else {
        unset($data['password']); // No actualizar si está vacío
    }
    
    unset($data['id']);
    
    if (empty($data)) {
        return ['success' => false, 'message' => 'No se enviaron campos para actualizar.'];
    }
    
    $updated = $clienteModel->actualizar($data);
    
    if ($updated) {
        return ['success' => true, 'message' => 'Cliente actualizado correctamente.'];
    } else {
        return ['success' => false, 'message' => 'Error al actualizar el cliente o el registro no fue encontrado.'];
    }
}

function handleClientsDelete($data) {
    if (!isset($data['id'])) {
        return ['success' => false, 'message' => 'ID de cliente es obligatorio para la eliminación.'];
    }
    
    $clienteModel = new Modelo('clientes');
    $clienteId = (int)$data['id'];
    
    $clienteModel->setCriterio("id='{$clienteId}'");
    $deleted = $clienteModel->eliminar();

    if ($deleted) {
        // Opcional: Implementar lógica para eliminar mascotas asociadas aquí.
        return ['success' => true, 'message' => 'Cliente eliminado correctamente.'];
    } else {
        return ['success' => false, 'message' => 'Error al eliminar el cliente o no se encontró el registro.'];
    }
}


// --- Enrutador Principal ---

if ($parts[0] === 'auth') {
    if ($parts[1] === 'register' && $method === 'POST') {
        $response = handleAuthRegister($inputData);
        http_response_code(200);
    } elseif ($parts[1] === 'login' && $method === 'POST') {
        $response = handleAuthLogin($inputData);
        http_response_code(200);
    } elseif ($parts[1] === 'logout' && $method === 'POST') {
        $response = ['success' => true, 'message' => 'Sesión cerrada.'];
        http_response_code(200);
    } else {
        http_response_code(405);
    }
} elseif ($parts[0] === 'pets') {
    if ($parts[1] === 'add' && $method === 'POST') {
        $response = handlePetsAdd($inputData);
        http_response_code(200);
    } elseif ($parts[1] === 'list' && $method === 'GET') {
        $response = handlePetsList($inputData);
        http_response_code(200);
    } elseif ($parts[1] === 'update' && $method === 'PUT') {
        $response = handlePetsUpdate($inputData);
        http_response_code(200);
    } elseif ($parts[1] === 'delete' && $method === 'DELETE') {
        $response = handlePetsDelete($inputData);
        http_response_code(200);
    } else {
        http_response_code(405);
    }
} elseif ($parts[0] === 'clients') { // NUEVA RUTA PARA ADMINISTRACIÓN DE CLIENTES
    if ($parts[1] === 'list' && $method === 'GET') {
        $response = handleClientsList($inputData);
        http_response_code(200);
    } elseif ($parts[1] === 'update' && $method === 'PUT') {
        $response = handleClientsUpdate($inputData);
        http_response_code(200);
    } elseif ($parts[1] === 'delete' && $method === 'DELETE') {
        $response = handleClientsDelete($inputData);
        http_response_code(200);
    } else {
        http_response_code(405);
    }
}
// Para otras rutas, se extendería este router...
else {
    http_response_code(404);
    $response = ['success' => false, 'message' => 'Ruta no encontrada.'];
}

// 3. Enviar Respuesta JSON
echo json_encode($response);
exit;

?>
