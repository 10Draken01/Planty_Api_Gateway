import { Options } from 'http-proxy-middleware';

export interface IProxyConfig {
  target: string;
  pathRewrite: Record<string, string>;
  timeout?: number;
  requiresAuth?: boolean;
}

export interface IProxyOptions extends Options {
  target: string;
}
