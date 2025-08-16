import api from './api';

// Profile Decorations APIs
export const getProfileDecorations = (filters = {}) => api.get('/profile-decorations/decorations', { params: filters });
export const getUserDecorations = () => api.get('/profile-decorations/user-decorations');
export const purchaseDecoration = (decorationId, currency = 'coins') => api.post('/profile-decorations/purchase', { decorationId, currency });
export const equipDecoration = (decorationId, slot) => api.post('/profile-decorations/equip', { decorationId, slot });
export const unequipDecoration = (decorationId) => api.post('/profile-decorations/unequip', { decorationId });
export const getEquippedDecorations = () => api.get('/profile-decorations/equipped');
export const getDecorationCategories = () => api.get('/profile-decorations/categories');
export const getFeaturedDecorations = () => api.get('/profile-decorations/featured');
export const searchDecorations = (query) => api.get('/profile-decorations/search', { params: query });

// Advanced Shop APIs
export const getShopItemsAdvanced = (filters = {}) => api.get('/shop/items', { params: filters });
export const getShopCategories = () => api.get('/shop/categories');
export const getShopBundles = () => api.get('/shop/bundles');
export const purchaseShopItem = (itemId, currency = 'coins') => api.post('/shop/purchase', { itemId, currency });
export const getPurchaseHistory = () => api.get('/shop/purchases');
export const getFeaturedItems = () => api.get('/shop/featured');
export const searchShopItems = (query) => api.get('/shop/search', { params: query });

// Advanced Pet APIs
export const getPetCollection = () => api.get('/pets/collection');
export const feedPetAdvanced = (petId, foodType) => api.post(`/pets/${petId}/feed`, { foodType });
export const playWithPet = (petId) => api.post(`/pets/${petId}/play`);
export const trainPet = (petId, trainingType) => api.post(`/pets/${petId}/train`, { trainingType });
export const evolvePet = (petId) => api.post(`/pets/${petId}/evolve`);
export const getPetStats = (petId) => api.get(`/pets/${petId}/stats`);
export const getPetAbilities = (petId) => api.get(`/pets/${petId}/abilities`); 