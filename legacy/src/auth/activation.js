import { mac } from './crypto.js';
import { createActivationDelivery as createDelivery } from '../../../shared/server/auth/activation.js';
export const createActivationDelivery = options => createDelivery({ ...options, mac });
