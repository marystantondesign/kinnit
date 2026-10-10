// Utility for managing bidirectional links between Plans and Occasions

import { getOccasion, saveOccasion } from "./occasionStorage";
import { getPlan, savePlan } from "./planStorage";

/**
 * Link a plan to an occasion (bidirectional many-to-many)
 */
export function linkPlanToOccasion(planId: string, occasionId: string): void {
  const plan = getPlan(planId);
  const occasion = getOccasion(occasionId);
  
  if (!plan || !occasion) return;
  
  // Update the plan's linked occasions (many-to-many)
  if (!plan.linkedOccasionIds) {
    plan.linkedOccasionIds = [];
  }
  if (!plan.linkedOccasionIds.includes(occasionId)) {
    plan.linkedOccasionIds.push(occasionId);
    savePlan(plan);
  }
  
  // Update the occasion's related plans
  if (!occasion.relatedPlanIds) {
    occasion.relatedPlanIds = [];
  }
  if (!occasion.relatedPlanIds.includes(planId)) {
    occasion.relatedPlanIds.push(planId);
    saveOccasion(occasion);
  }
}

/**
 * Unlink a plan from an occasion (bidirectional)
 */
export function unlinkPlanFromOccasion(planId: string, occasionId: string): void {
  const plan = getPlan(planId);
  const occasion = getOccasion(occasionId);
  
  if (plan && plan.linkedOccasionIds) {
    plan.linkedOccasionIds = plan.linkedOccasionIds.filter(id => id !== occasionId);
    savePlan(plan);
  }
  
  if (occasion) {
    if (occasion.relatedPlanIds) {
      occasion.relatedPlanIds = occasion.relatedPlanIds.filter(id => id !== planId);
      saveOccasion(occasion);
    }
  }
}

/**
 * Unlink a plan from all its current occasions
 */
export function unlinkPlanFromCurrentOccasion(planId: string): void {
  const plan = getPlan(planId);
  if (!plan || !plan.linkedOccasionIds || plan.linkedOccasionIds.length === 0) return;
  
  // Unlink from all occasions
  plan.linkedOccasionIds.forEach(occasionId => {
    unlinkPlanFromOccasion(planId, occasionId);
  });
}

/**
 * Remove a plan from an occasion's related plans (alias for unlinkPlanFromOccasion)
 */
export function removePlanFromOccasion(planId: string, occasionId: string): void {
  unlinkPlanFromOccasion(planId, occasionId);
}