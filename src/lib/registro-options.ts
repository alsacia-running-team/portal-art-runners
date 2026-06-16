// Opciones del cuestionario de registro. Se comparten entre el formulario de
// registro, la tabla de solicitudes del admin y el detalle del cliente para
// guardar valores cortos en la BD y mostrar etiquetas legibles en la UI.

export type Option = { value: string; label: string }

export const INTERESTED_PLANS: Option[] = [
  { value: 'grupal', label: 'Grupal' },
  { value: 'personalizado', label: 'Personalizado' },
]

export const LIVES_IN_ALSACIA_OPTIONS: Option[] = [
  { value: 'true', label: 'Sí' },
  { value: 'false', label: 'No' },
]

export const TRAINING_LEVELS: Option[] = [
  { value: 'A', label: 'A. Nunca he entrenado, quiero empezar' },
  { value: 'B', label: 'B. Entreno una o dos veces por semana' },
  { value: 'C', label: 'C. Entreno tres o más veces por semana' },
  { value: 'D', label: 'D. Llevo más de tres meses sin entrenar' },
]

export const TRAINING_GOALS: Option[] = [
  { value: 'salud', label: 'Salud y bienestar general' },
  { value: 'peso', label: 'Control de peso' },
  { value: 'rendimiento', label: 'Mejorar rendimiento (resistencia y/o velocidad)' },
  { value: 'social', label: 'Compartir con las personas del equipo (social)' },
]

export const STRENGTH_TRAINING_OPTIONS: Option[] = [
  { value: 'no', label: 'No' },
  { value: 'gimnasio', label: 'Sí, en gimnasio' },
  { value: 'casa', label: 'Sí, en casa' },
]

function labelFrom(options: Option[], value: string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '—'
  return options.find((option) => option.value === value)?.label ?? value
}

export const interestedPlanLabel = (value: string | null | undefined) =>
  labelFrom(INTERESTED_PLANS, value)

export const trainingLevelLabel = (value: string | null | undefined) =>
  labelFrom(TRAINING_LEVELS, value)

export const trainingGoalLabel = (value: string | null | undefined) =>
  labelFrom(TRAINING_GOALS, value)

export const strengthTrainingLabel = (value: string | null | undefined) =>
  labelFrom(STRENGTH_TRAINING_OPTIONS, value)

export function livesInAlsaciaLabel(value: boolean | null | undefined): string {
  if (value === null || value === undefined) return '—'
  return value ? 'Sí' : 'No'
}
