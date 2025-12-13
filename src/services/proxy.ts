import { ProxyFactory, ProxyService } from '../infrastructure/proxy/ProxyFactory';

export const userServiceProxy = ProxyFactory.createProxy(ProxyService.USERS);
export const authServiceProxy = ProxyFactory.createProxy(ProxyService.AUTH);
export const protectedChatbotProxy = ProxyFactory.createProxy(ProxyService.CHATBOT);
export const orchardServiceProxy = ProxyFactory.createProxy(ProxyService.ORCHARD);
export const algorithmGenServiceProxy = ProxyFactory.createProxy(ProxyService.ALGORITHM_GEN);
export const plantServiceProxy = ProxyFactory.createProxy(ProxyService.PLANT);
export const recommenderServiceProxy = ProxyFactory.createProxy(ProxyService.RECOMMENDER);
