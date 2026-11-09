// Slide 30: every active account has full CRUD access, regardless of role.
export const roles = Object.freeze(['admin', 'editor', 'chef', 'viewer']);

export function canWriteResource(user) {
  return user?.status === 'active';
}

export const canDeleteResource = canWriteResource;
