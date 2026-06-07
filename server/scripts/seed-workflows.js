// Script de ejemplo: crea 4 flujos de trabajo de prueba
// Uso: node scripts/seed-workflows.js <organization_id>
// Ejemplo: node scripts/seed-workflows.js 1

const { Workflow, Organization } = require('../src/models');

const raw = process.argv[2];
const orgId = parseInt(raw);
if (!raw || isNaN(orgId)) {
  (async () => {
    const orgs = await Organization.findAll({ attributes: ['id', 'name'] });
    console.log('Especifica un ID de organización válido. Disponibles:');
    for (const o of orgs) {
      console.log(`  ${o.id} → ${o.name}`);
    }
    console.log('\nEjemplo: node scripts/seed-workflows.js 1');
    process.exit(1);
  })();
  return;
}

function buildWorkflow(name, nodes, edges) {
  return {
    organization_id: orgId,
    name,
    nodes,
    edges: edges || [],
    is_active: true,
  };
}

const WORKFLOWS = [
  // -------------------------------------------------------
  // 1. Incidente Simple: Inicio -> Incidente -> Notificación -> Fin
  // -------------------------------------------------------
  buildWorkflow(
    'Ejemplo 1: Incidente Simple',
    [
      { id: 'ex1_start', type: 'default', position: { x: 50, y: 200 }, data: { label: 'Inicio', nodeType: 'start' } },
      { id: 'ex1_incident', type: 'default', position: { x: 350, y: 200 }, data: { label: 'Incidente', nodeType: 'incident', assigned_group_id: 1 } },
      { id: 'ex1_notif', type: 'default', position: { x: 650, y: 200 }, data: { label: 'Notificar al solicitante', nodeType: 'notification', message: 'Su incidente ha sido procesado.', recipients: [] } },
      { id: 'ex1_end', type: 'default', position: { x: 950, y: 200 }, data: { label: 'Fin', nodeType: 'end' } },
    ],
    [
      { id: 'e1-1', source: 'ex1_start', target: 'ex1_incident', type: 'smoothstep', animated: true, style: { stroke: '#666' } },
      { id: 'e1-2', source: 'ex1_incident', target: 'ex1_notif', type: 'smoothstep', animated: true, style: { stroke: '#666' } },
      { id: 'e1-3', source: 'ex1_notif', target: 'ex1_end', type: 'smoothstep', animated: true, style: { stroke: '#666' } },
    ],
  ),

  // -------------------------------------------------------
  // 2. Incidente con Aprobación: Inicio -> Incidente -> Aprobación -> Notificación -> Fin
  // -------------------------------------------------------
  buildWorkflow(
    'Ejemplo 2: Incidente con Aprobación',
    [
      { id: 'ex2_start', type: 'default', position: { x: 50, y: 200 }, data: { label: 'Inicio', nodeType: 'start' } },
      { id: 'ex2_incident', type: 'default', position: { x: 350, y: 200 }, data: { label: 'Incidente', nodeType: 'incident', assigned_group_id: 1 } },
      { id: 'ex2_approval', type: 'default', position: { x: 650, y: 200 }, data: { label: 'Aprobar solución', nodeType: 'approval', assigned_group_id: 1 } },
      { id: 'ex2_notif', type: 'default', position: { x: 950, y: 200 }, data: { label: 'Notificar resultado', nodeType: 'notification', message: 'Su incidente ha sido resuelto y aprobado.', recipients: [] } },
      { id: 'ex2_end', type: 'default', position: { x: 1250, y: 200 }, data: { label: 'Fin', nodeType: 'end' } },
    ],
    [
      { id: 'e2-1', source: 'ex2_start', target: 'ex2_incident', type: 'smoothstep', animated: true, style: { stroke: '#666' } },
      { id: 'e2-2', source: 'ex2_incident', target: 'ex2_approval', type: 'smoothstep', animated: true, style: { stroke: '#666' } },
      { id: 'e2-3', source: 'ex2_approval', target: 'ex2_notif', type: 'smoothstep', animated: true, style: { stroke: '#666' } },
      { id: 'e2-4', source: 'ex2_notif', target: 'ex2_end', type: 'smoothstep', animated: true, style: { stroke: '#666' } },
    ],
  ),

  // -------------------------------------------------------
  // 3. Incidente con Condición: Inicio -> Incidente -> Condición (urgencia)
  //    Si urgencia = alta -> Notificación "Prioritario" -> Fin
  //    Si no -> Notificación "Normal" -> Fin
  // -------------------------------------------------------
  buildWorkflow(
    'Ejemplo 3: Incidente con Condición',
    [
      { id: 'ex3_start', type: 'default', position: { x: 50, y: 300 }, data: { label: 'Inicio', nodeType: 'start' } },
      { id: 'ex3_incident', type: 'default', position: { x: 350, y: 300 }, data: { label: 'Incidente', nodeType: 'incident', assigned_group_id: 1 } },
      { id: 'ex3_condition', type: 'default', position: { x: 650, y: 300 }, data: { label: '¿Urgencia alta?', nodeType: 'condition', field: 'priority', operator: 'equals', value: 'high' } },
      { id: 'ex3_notif_high', type: 'default', position: { x: 950, y: 150 }, data: { label: 'Notif. Prioritario', nodeType: 'notification', message: 'Su incidente urgente ha sido atendido prioritariamente.', recipients: [] } },
      { id: 'ex3_notif_normal', type: 'default', position: { x: 950, y: 450 }, data: { label: 'Notif. Normal', nodeType: 'notification', message: 'Su incidente ha sido procesado en tiempo estándar.', recipients: [] } },
      { id: 'ex3_end', type: 'default', position: { x: 1250, y: 300 }, data: { label: 'Fin', nodeType: 'end' } },
    ],
    [
      { id: 'e3-1', source: 'ex3_start', target: 'ex3_incident', type: 'smoothstep', animated: true, style: { stroke: '#666' } },
      { id: 'e3-2', source: 'ex3_incident', target: 'ex3_condition', type: 'smoothstep', animated: true, style: { stroke: '#666' } },
      { id: 'e3-3', source: 'ex3_condition', target: 'ex3_notif_high', sourceHandle: 'true', type: 'smoothstep', animated: true, style: { stroke: '#52c41a' } },
      { id: 'e3-4', source: 'ex3_condition', target: 'ex3_notif_normal', sourceHandle: 'false', type: 'smoothstep', animated: true, style: { stroke: '#ff4d4f' } },
      { id: 'e3-5', source: 'ex3_notif_high', target: 'ex3_end', type: 'smoothstep', animated: true, style: { stroke: '#666' } },
      { id: 'e3-6', source: 'ex3_notif_normal', target: 'ex3_end', type: 'smoothstep', animated: true, style: { stroke: '#666' } },
    ],
  ),

  // -------------------------------------------------------
  // 4. OT con Aprobación: Inicio -> OT -> Aprobación -> Notificación -> Fin
  // -------------------------------------------------------
  buildWorkflow(
    'Ejemplo 4: OT con Aprobación',
    [
      { id: 'ex4_start', type: 'default', position: { x: 50, y: 200 }, data: { label: 'Inicio', nodeType: 'start' } },
      { id: 'ex4_workorder', type: 'default', position: { x: 350, y: 200 }, data: { label: 'Orden de Trabajo', nodeType: 'work_order', assigned_group_id: 2 } },
      { id: 'ex4_approval', type: 'default', position: { x: 650, y: 200 }, data: { label: 'Aprobar OT', nodeType: 'approval', assigned_group_id: 2 } },
      { id: 'ex4_notif', type: 'default', position: { x: 950, y: 200 }, data: { label: 'Notificar finalización', nodeType: 'notification', message: 'Su orden de trabajo ha sido completada y aprobada.', recipients: [] } },
      { id: 'ex4_end', type: 'default', position: { x: 1250, y: 200 }, data: { label: 'Fin', nodeType: 'end' } },
    ],
    [
      { id: 'e4-1', source: 'ex4_start', target: 'ex4_workorder', type: 'smoothstep', animated: true, style: { stroke: '#666' } },
      { id: 'e4-2', source: 'ex4_workorder', target: 'ex4_approval', type: 'smoothstep', animated: true, style: { stroke: '#666' } },
      { id: 'e4-3', source: 'ex4_approval', target: 'ex4_notif', type: 'smoothstep', animated: true, style: { stroke: '#666' } },
      { id: 'e4-4', source: 'ex4_notif', target: 'ex4_end', type: 'smoothstep', animated: true, style: { stroke: '#666' } },
    ],
  ),
];

(async () => {
  console.log(`Creando flujos de ejemplo para organización ${orgId}...`);

  for (const wf of WORKFLOWS) {
    const existing = await Workflow.findOne({ where: { name: wf.name, organization_id: orgId } });
    if (existing) {
      console.log(`  Ya existe: "${wf.name}" (id=${existing.id})`);
      continue;
    }
    const created = await Workflow.create(wf);
    console.log(`  Creado: "${wf.name}" (id=${created.id})`);
  }

  // Mostrar resumen
  const all = await Workflow.findAll({ where: { organization_id: orgId } });
  console.log(`\nTotal flujos en org ${orgId}: ${all.length}`);
  for (const w of all) {
    console.log(`  [${w.id}] ${w.name} (activo: ${w.is_active})`);
  }

  console.log('\nAsigna un flujo a un servicio desde el panel Admin > Servicios, editando el servicio y seleccionando el flujo en el campo "Workflow".');

  process.exit();
})();
