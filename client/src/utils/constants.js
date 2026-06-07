export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  RESOLVER: 'resolver',
  END_USER: 'end_user',
};

export const ROLE_LABELS = {
  admin: 'Administrador',
  manager: 'Gestor',
  resolver: 'Resolutor',
  end_user: 'Usuario Final',
};

export const TICKET_TYPES = {
  incident: 'Incidente',
  work_order: 'Orden de Trabajo',
  change_request: 'Solicitud de Cambio',
  problem: 'Problema',
};

export const TICKET_STATUS = {
  new: 'Nuevo',
  in_progress: 'En Progreso',
  on_hold: 'En Espera',
  resolved: 'Resuelto',
  closed: 'Cerrado',
  cancelled: 'Cancelado',
};

export const PRIORITIES = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
  critical: 'Crítica',
};
