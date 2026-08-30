// Organizaciones del territorio (para el mapa y la vitrina).
export const organizaciones = [
  {
    nombre: 'Accionar',
    tipo: 'Asociacion',
    zona: 'VIRCH',
    localidad: 'Rawson',
    descripcion: 'Asociación civil sin fines de lucro con base en Rawson que trabaja en la intersección entre economía del cuidado, género y economía popular. Acompaña a mujeres y personas en situación de vulnerabilidad con talleres, capacitaciones y articulación con políticas públicas, desde una perspectiva de derechos y autonomía.',
    tags: ['Economía del cuidado', 'Género', 'Economía popular'],
    lat: -43.3002, lng: -65.1023,
    contacto: '', aprobado: true, destacado: true
  }
];

// Los cursos que hoy están publicados en profeluna.ar.
export const semillas = [
  // ── Ruta del emprendedor ──
  {
    seccion: 'ruta', orden: 1,
    etiqueta: 'Estudio de costos',
    titulo: 'Estructura de costos',
    descripcion: 'Qué te cuesta producir y a qué precio conviene vender. Costos, gastos, margen de contribución, punto de equilibrio y estrategias de precio.',
    estado: 'disponible',
    enlace: 'costos/index.html',
    textoEnlace: 'Empezar el curso →',
    metas: ['10 módulos', '4 herramientas', '~120 min'],
    destacado: false, insignia: ''
  },
  {
    seccion: 'ruta', orden: 2,
    etiqueta: 'Llegar al cliente',
    titulo: 'Marketing mix para emprendedores',
    descripcion: 'Cómo llegar al cliente que querés. Las 4 P —producto, precio, plaza y promoción— aplicadas a tu emprendimiento.',
    estado: 'disponible',
    enlace: 'marketing-mix/index.html',
    textoEnlace: 'Empezar el curso →',
    metas: ['6 módulos', 'Plan descargable', '~75 min'],
    destacado: false, insignia: ''
  },
  {
    seccion: 'ruta', orden: 3,
    etiqueta: 'Finanzas del negocio',
    titulo: 'Finanzas para emprendedores',
    descripcion: 'Cómo separar la plata del negocio de la plata personal. Cuentas, registros, manejo del efectivo y primeros pasos en inversiones.',
    estado: 'disponible',
    enlace: 'finanzas-emprendedores/index.html',
    textoEnlace: 'Empezar el curso →',
    metas: ['6 módulos', 'Plan descargable', '~90 min'],
    destacado: false, insignia: ''
  },
  {
    seccion: 'ruta', orden: 4,
    etiqueta: 'Cuidar el valor',
    titulo: 'Inflación y resguardo de valor',
    descripcion: 'Cómo proteger lo que ganás en un contexto inflacionario. Estrategias para no perder.',
    estado: 'proximamente',
    enlace: '', textoEnlace: '',
    metas: ['Próximo ciclo 2026'],
    destacado: false, insignia: ''
  },
  {
    seccion: 'ruta', orden: 5,
    etiqueta: 'Financiamiento',
    titulo: 'Acceso al financiamiento',
    descripcion: 'Cómo buscar plata para crecer: créditos, herramientas del Estado y programas para emprendedores.',
    estado: 'proximamente',
    enlace: '', textoEnlace: '',
    metas: ['Próximo ciclo 2026'],
    destacado: false, insignia: ''
  },
  {
    seccion: 'ruta', orden: 6,
    etiqueta: 'Cierre de la ruta',
    titulo: 'Mi plan de negocio',
    descripcion: 'Tomás todo lo aprendido y armás tu propio plan de negocio, siguiendo el marco de formulación de proyectos de Daniel Semyraz.',
    estado: 'proximamente',
    enlace: '', textoEnlace: '',
    metas: ['Cuando completes la ruta'],
    destacado: true, insignia: 'Integrador final'
  },

  // ── Cursos transversales ──
  {
    seccion: 'transversales', orden: 1,
    etiqueta: 'Empleo',
    titulo: 'Armando tu CV',
    descripcion: 'Construí un currículum profesional paso a paso. Cargás tus datos en cada módulo y al final descargás tu CV en PDF y la constancia.',
    estado: 'disponible',
    enlace: 'armando-cv/index.html',
    textoEnlace: 'Empezar el curso →',
    metas: ['7 módulos', '3 estilos', '~90 min'],
    destacado: false, insignia: ''
  },
  {
    seccion: 'transversales', orden: 2,
    etiqueta: 'Trabajo registrado',
    titulo: 'Empleadas de casas particulares',
    descripcion: 'Liquidación de sueldos: haberes, aportes, vacaciones, SAC e indemnizaciones para empleadas y empleadores.',
    estado: 'proximamente',
    enlace: '', textoEnlace: '',
    metas: ['Próximo ciclo 2026'],
    destacado: false, insignia: ''
  },
  {
    seccion: 'transversales', orden: 3,
    etiqueta: 'Recurso ANMAT',
    titulo: 'Manipulación segura de alimentos',
    descripcion: 'Curso oficial gratuito que otorga el carnet de manipulador, necesario para gastronomía, ferias y repostería.',
    estado: 'externo',
    enlace: 'https://www.argentina.gob.ar/anmat/regulados/alimentos/carnet-de-manipuladores/curso',
    textoEnlace: 'Inscribirme en ANMAT ↗',
    metas: ['Carnet oficial', 'Virtual · ANMAT'],
    destacado: false, insignia: ''
  },

  // ── Matriz Semilla (tercer sector) ──
  {
    seccion: 'matriz', orden: 1,
    etiqueta: 'Módulo 01 · Punto de partida',
    titulo: 'La economía que existe',
    descripcion: 'Por qué el marketing no alcanza, las tres lógicas de la economía plural (mercado, redistribución, reciprocidad) y la diferencia entre gestionar el sentido y co-producirlo.',
    estado: 'disponible',
    enlace: 'tercer-sector/matriz-semilla/modulo-01.html',
    textoEnlace: 'Empezar el módulo →',
    metas: ['1 módulo', '~90 min', 'Constancia'],
    destacado: false, insignia: ''
  },
  {
    seccion: 'matriz', orden: 2,
    etiqueta: 'Módulo 02 · Raíz',
    titulo: 'La narrativa fundante',
    descripcion: 'Identidad cooperativa: quiénes somos, por qué existimos y qué nos diferencia de una empresa o un programa estatal.',
    estado: 'proximamente',
    enlace: '', textoEnlace: '',
    metas: ['Ciclo 2026'],
    destacado: false, insignia: ''
  },
  {
    seccion: 'matriz', orden: 3,
    etiqueta: 'Módulos 03–06 · Flor · Tronco · Fruto',
    titulo: 'Propósito, gestión e incidencia',
    descripcion: 'Propósito territorial y cuidado como derecho; comunicación interna que sostiene la democracia; e incidencia para co-construir políticas públicas.',
    estado: 'proximamente',
    enlace: '', textoEnlace: '',
    metas: ['Ciclo 2026'],
    destacado: false, insignia: ''
  },

  // ── Próximas capacitaciones (tercer sector) ──
  {
    seccion: 'proximas', orden: 1,
    etiqueta: 'En preparación',
    titulo: 'Gobernanza y democracia cooperativa',
    descripcion: 'Cómo tomar decisiones entre muchas personas, prevenir la degeneración cooperativa y sostener la participación real.',
    estado: 'preparacion',
    enlace: '', textoEnlace: '',
    metas: ['Ciclo 2026'],
    destacado: false, insignia: ''
  },
  {
    seccion: 'proximas', orden: 2,
    etiqueta: 'En preparación',
    titulo: 'Economía del cuidado',
    descripcion: 'El cuidado como trabajo y como derecho: cooperativas de cuidado, reconocimiento y organización del sector en el Valle.',
    estado: 'preparacion',
    enlace: '', textoEnlace: '',
    metas: ['Ciclo 2026'],
    destacado: false, insignia: ''
  },
  {
    seccion: 'proximas', orden: 3,
    etiqueta: 'En preparación',
    titulo: 'Formalización e INAES',
    descripcion: 'Del grupo de hecho a la organización con personería: pasos, requisitos y acompañamiento para regularizarse.',
    estado: 'preparacion',
    enlace: '', textoEnlace: '',
    metas: ['Ciclo 2026'],
    destacado: false, insignia: ''
  }
];

export const epjaMaterias = [
  {
    codigo: 'foi',
    campo: 'foi',
    nombre: 'FOI · Formación Orientada I',
    descripcion: 'Materia de ingreso para estudiantes EPJA. Ordena el recorrido, presenta la misión del aula y trabaja fundamentos de la economía social, comunitaria y solidaria.',
    color: '#2E5638',
    orden: 1
  },
  {
    codigo: 'foii',
    campo: 'foii',
    nombre: 'Recursos Humanos y Relaciones Laborales',
    descripcion: 'Capacidades, habilidades y competencias; descripción de puestos, selección, contratación y evaluación de desempeño.',
    color: '#B05C33',
    orden: 2
  },
  {
    codigo: 'foiiadministracionsueldos',
    campo: 'foii',
    nombre: 'Administración y liquidación de sueldos',
    descripcion: 'Administración laboral, registración y liquidación de haberes.',
    color: '#B05C33',
    orden: 3
  },
  {
    codigo: 'foiieconomiasocial',
    campo: 'foii',
    nombre: 'Economía social y desarrollo sustentable',
    descripcion: 'Economía social, formas de cooperación y desarrollo sustentable en el territorio.',
    color: '#B05C33',
    orden: 4
  }
];

export const epjaModulos = [
  {
    materiaCodigo: 'foi',
    titulo: 'Bienvenida al aula EPJA',
    resumen: 'Cómo funciona el aula, qué vas a encontrar y cómo recorrerla con calma.',
    contenido: `
      <h2>Bienvenida</h2>
      <p>Este espacio está pensado para que puedas estudiar a tu ritmo, desde el celular o la computadora, sin perder el hilo del recorrido.</p>
      <p>Vas a encontrar materiales breves, ordenados y concretos. La idea es que sepas siempre dónde estás y cuál es el siguiente paso.</p>
      <h3>Cómo te conviene usar el aula</h3>
      <ul>
        <li>Entrá con frecuencia, aunque sea por poco tiempo.</li>
        <li>Completá un módulo por vez.</li>
        <li>Tomá notas de las ideas que te resulten más útiles.</li>
      </ul>
    `,
    orden: 1,
    publicado: true
  },
  {
    materiaCodigo: 'foi',
    titulo: 'Misión y fundamentos de la ESCyS',
    resumen: 'Una introducción a la economía social, comunitaria y solidaria y su relación con la vida cotidiana.',
    contenido: `
      <h2>Misión del espacio</h2>
      <p>La propuesta busca acompañarte para que puedas ordenar ideas, reconocer herramientas y vincular lo que aprendés con tu realidad concreta.</p>
      <h3>Fundamentos de la ESCyS</h3>
      <p>La economía social, comunitaria y solidaria pone en el centro a las personas, el trabajo y el territorio. No parte solamente de la ganancia, sino también del cuidado, la cooperación y el bien común.</p>
      <ul>
        <li>Trabajo con sentido.</li>
        <li>Organización colectiva.</li>
        <li>Aprendizajes conectados con el territorio.</li>
      </ul>
    `,
    orden: 2,
    publicado: true
  },
  {
    materiaCodigo: 'foiiadministracionsueldos',
    titulo: 'Administración y liquidación de sueldos',
    resumen: 'Primer acercamiento a nociones administrativas y a la liquidación básica de haberes.',
    contenido: `
      <h2>Administración y trabajo</h2>
      <p>En esta parte de FOII vamos a empezar a ordenar ideas básicas sobre administración, registración y liquidación de sueldos.</p>
      <h3>Preguntas guía</h3>
      <ul>
        <li>¿Qué información hace falta para liquidar un sueldo?</li>
        <li>¿Qué conceptos aparecen en un recibo?</li>
        <li>¿Qué relación hay entre trabajo, derechos y registración?</li>
      </ul>
    `,
    orden: 1,
    publicado: true
  },
  {
    materiaCodigo: 'foiieconomiasocial',
    titulo: 'Economía social, desarrollo sustentable y relaciones laborales',
    resumen: 'Trabajo, vínculos laborales, territorio y desarrollo sustentable en clave EPJA.',
    contenido: `
      <h2>Trabajo, territorio y vínculos</h2>
      <p>FOII también invita a pensar cómo se organiza el trabajo, qué lugar ocupa la economía social y por qué el desarrollo sustentable importa en la vida cotidiana.</p>
      <h3>Ejes de trabajo</h3>
      <ul>
        <li>Recursos humanos y relaciones laborales.</li>
        <li>Economía social y formas de cooperación.</li>
        <li>Desarrollo sustentable y responsabilidad con el territorio.</li>
      </ul>
    `,
    orden: 2,
    publicado: true
  }
];
