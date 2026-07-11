// Datos iniciales que init-db.js carga solo si la tabla correspondiente está vacía.

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
