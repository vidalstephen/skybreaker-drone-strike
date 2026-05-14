import { resolveSetPieceArchetypeForTarget } from '../config/objectiveArchetypes';
import type {
  MissionTargetDefinition,
  SetPiecePhaseDefinition,
  Target,
  TargetComponentRuntimeState,
  TargetSetPieceRuntimeState,
} from '../types/game';

function phaseAt(runtime: TargetSetPieceRuntimeState, phaseIndex: number): SetPiecePhaseDefinition | null {
  return runtime.phases[phaseIndex] ?? null;
}

function isComponentActiveInPhase(componentId: string, phase: SetPiecePhaseDefinition | null): boolean {
  if (!phase) return true;
  return phase.activeComponentIds.includes(componentId) || (phase.exposesComponentIds ?? []).includes(componentId);
}

function applyPhaseExposure(runtime: TargetSetPieceRuntimeState): void {
  const phase = phaseAt(runtime, runtime.activePhaseIndex);
  runtime.components.forEach(component => {
    component.active = isComponentActiveInPhase(component.id, phase) || component.exposure === 'exposed';
  });
  if (!phase) return;
  (phase.hidesComponentIds ?? []).forEach(componentId => {
    const component = runtime.components.find(candidate => candidate.id === componentId);
    if (component) component.active = false;
  });
  (phase.exposesComponentIds ?? []).forEach(componentId => {
    const component = runtime.components.find(candidate => candidate.id === componentId);
    if (component) component.active = true;
  });
}

export function buildTargetSetPieceRuntime(target: MissionTargetDefinition): TargetSetPieceRuntimeState {
  const archetype = resolveSetPieceArchetypeForTarget(target);
  const componentDefinitions = target.components?.length ? target.components : archetype.components;
  const components: TargetComponentRuntimeState[] = componentDefinitions.map(component => ({
    id: component.id,
    label: component.label,
    role: component.role,
    health: component.health,
    maxHealth: component.health,
    required: component.required,
    exposure: component.exposure,
    active: component.exposure === 'exposed',
    destroyed: false,
    offset: component.offset,
    radius: component.radius,
    phaseId: component.phaseId,
    trackingMeta: component.trackingMeta,
  }));

  const runtime: TargetSetPieceRuntimeState = {
    archetypeId: archetype.id,
    label: archetype.label,
    components,
    phases: archetype.phases,
    activePhaseIndex: 0,
    completedPhaseIds: [],
  };
  applyPhaseExposure(runtime);
  return runtime;
}

function getRequiredComponentsForPhase(runtime: TargetSetPieceRuntimeState, phase: SetPiecePhaseDefinition): TargetComponentRuntimeState[] {
  const requiredIds = phase.requiredComponentIds?.length
    ? phase.requiredComponentIds
    : phase.activeComponentIds;
  return requiredIds
    .map(componentId => runtime.components.find(component => component.id === componentId))
    .filter((component): component is TargetComponentRuntimeState => !!component && component.required);
}

function isPhaseComplete(runtime: TargetSetPieceRuntimeState, phase: SetPiecePhaseDefinition): boolean {
  const required = getRequiredComponentsForPhase(runtime, phase);
  if (!required.length) return false;

  switch (phase.trigger) {
    case 'component-destroyed':
      return required.some(component => component.destroyed || component.health <= 0);
    case 'all-required-components-destroyed':
      return required.every(component => component.destroyed || component.health <= 0);
    case 'health-threshold': {
      const threshold = phase.healthThreshold ?? 0;
      return required.every(component => (component.health / component.maxHealth) * 100 <= threshold);
    }
    default:
      return false;
  }
}

function getNextPhaseIndex(runtime: TargetSetPieceRuntimeState, phase: SetPiecePhaseDefinition): number {
  if (phase.nextPhaseId) {
    const explicitIndex = runtime.phases.findIndex(candidate => candidate.id === phase.nextPhaseId);
    if (explicitIndex >= 0) return explicitIndex;
  }
  return runtime.activePhaseIndex + 1;
}

export function syncTargetSetPieceRuntime(target: Target): void {
  const runtime = target.setPiece;
  if (!runtime) return;

  target.weakPoints?.forEach(weakPoint => {
    const component = runtime.components.find(candidate => candidate.id === weakPoint.id);
    if (!component) return;
    component.health = Math.max(0, weakPoint.health);
    component.destroyed = weakPoint.destroyed || component.health <= 0;
  });

  if (!target.weakPoints?.length) {
    const core = runtime.components.find(component => component.required && component.active) ?? runtime.components.find(component => component.required);
    if (core) {
      core.health = Math.min(core.health, Math.max(0, target.health));
      core.destroyed = core.destroyed || core.health <= 0 || target.destroyed;
    }
  }
}

export function isTargetComponentDamageable(target: Target, componentId: string): boolean {
  const component = target.setPiece?.components.find(candidate => candidate.id === componentId);
  if (!component) return true;
  return component.active && !component.destroyed && component.exposure !== 'hidden';
}

export function applyTargetSetPieceVisibility(target: Target): void {
  if (!target.setPiece) return;
  target.weakPoints?.forEach(weakPoint => {
    const component = target.setPiece?.components.find(candidate => candidate.id === weakPoint.id);
    if (!component) return;
    weakPoint.mesh.visible = !weakPoint.destroyed && component.active && component.exposure !== 'hidden';
  });
}

export function advanceTargetSetPiecePhase(target: Target): SetPiecePhaseDefinition | null {
  const runtime = target.setPiece;
  if (!runtime) return null;
  syncTargetSetPieceRuntime(target);

  const phase = phaseAt(runtime, runtime.activePhaseIndex);
  if (!phase || !isPhaseComplete(runtime, phase)) return null;

  if (!runtime.completedPhaseIds.includes(phase.id)) {
    runtime.completedPhaseIds.push(phase.id);
  }

  const nextIndex = getNextPhaseIndex(runtime, phase);
  if (nextIndex < runtime.phases.length) {
    runtime.activePhaseIndex = nextIndex;
    applyPhaseExposure(runtime);
    applyTargetSetPieceVisibility(target);
  }

  return phase;
}

export function getActiveSetPiecePhase(target: Target): SetPiecePhaseDefinition | null {
  const runtime = target.setPiece;
  if (!runtime) return null;
  return phaseAt(runtime, runtime.activePhaseIndex);
}