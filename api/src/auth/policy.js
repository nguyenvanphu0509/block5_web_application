import { BusinessError } from '../validation.js';

export const roles = Object.freeze(['admin', 'editor', 'chef', 'viewer']);

export function canWriteResource(user, resource) {
  if (!user) return false;
  if (user.role === 'admin' || user.role === 'editor') return true;
  return user.role === 'chef' && resource === 'dishes';
}

export function canDeleteResource(user, resource) {
  if (!user) return false;
  return user.role === 'admin' || user.role === 'editor' || (user.role === 'chef' && resource === 'dishes');
}

export function assertDishAttribute(user, dish) {
  if (user.role !== 'chef') return;
  if (dish.chefId !== user.chefId) {
    throw new BusinessError('FORBIDDEN', 'Bạn chỉ được quản lý món thuộc đầu bếp của mình.');
  }
}

export function assertChefAssignment(user, data) {
  if (user.role !== 'chef') return;
  if (data.chefId !== undefined && data.chefId !== user.chefId) {
    throw new BusinessError('FORBIDDEN', 'Không được gán món cho đầu bếp khác.');
  }
}
