export type ServiceName =
  | 'users'
  | 'auth'
  | 'chatbot'
  | 'orchard'
  | 'algorithmGen'
  | 'plant'
  | 'recommender';

export interface ServiceEndpoint {
  name: ServiceName;
  url: string;
  healthCheck?: string;
}
