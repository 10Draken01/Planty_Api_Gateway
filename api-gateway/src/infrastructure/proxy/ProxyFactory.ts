import { createProxyMiddleware, RequestHandler } from 'http-proxy-middleware';
import { env } from '../../config/environment';
import { ProxyConfigBuilder } from './ProxyConfigBuilder';
import { ServiceName } from '../../domain/types/ServiceTypes';

export enum ProxyService {
  USERS = 'users',
  AUTH = 'auth',
  CHATBOT = 'chatbot',
  ORCHARD = 'orchard',
  ALGORITHM_GEN = 'algorithmGen',
  PLANT = 'plant',
  RECOMMENDER = 'recommender',
}

interface ProxyConfiguration {
  serviceName: ServiceName;
  pathRewrite: Record<string, string>;
  timeout?: number;
  withAuth?: boolean;
}

export class ProxyFactory {
  private static readonly DEFAULT_TIMEOUT = 30000;
  private static readonly ML_TIMEOUT = 60000;

  private static readonly PROXY_CONFIGURATIONS: Record<
    ProxyService,
    ProxyConfiguration
  > = {
    [ProxyService.USERS]: {
      serviceName: 'users',
      pathRewrite: { '^/api/users': '/api' },
      timeout: ProxyFactory.DEFAULT_TIMEOUT,
      withAuth: false,
    },
    [ProxyService.AUTH]: {
      serviceName: 'auth',
      pathRewrite: { '^/api/auth': '' },
      timeout: ProxyFactory.DEFAULT_TIMEOUT,
      withAuth: false,
    },
    [ProxyService.CHATBOT]: {
      serviceName: 'chatbot',
      pathRewrite: { '^/api/chat/message': '/chat/message' },
      timeout: ProxyFactory.DEFAULT_TIMEOUT,
      withAuth: true,
    },
    [ProxyService.ORCHARD]: {
      serviceName: 'orchard',
      pathRewrite: { '^/api/orchards': '/orchards' },
      timeout: ProxyFactory.DEFAULT_TIMEOUT,
      withAuth: true,
    },
    [ProxyService.ALGORITHM_GEN]: {
      serviceName: 'algorithmGen',
      pathRewrite: { '^/api/algorithm-gen': '' },
      timeout: ProxyFactory.DEFAULT_TIMEOUT,
      withAuth: true,
    },
    [ProxyService.PLANT]: {
      serviceName: 'plant',
      pathRewrite: { '^/api/plants': '/plants' },
      timeout: ProxyFactory.DEFAULT_TIMEOUT,
      withAuth: true,
    },
    [ProxyService.RECOMMENDER]: {
      serviceName: 'recommender',
      pathRewrite: { '^/api/recommender': '' },
      timeout: ProxyFactory.ML_TIMEOUT,
      withAuth: true,
    },
  };

  public static createProxy(service: ProxyService): RequestHandler {
    const config = this.PROXY_CONFIGURATIONS[service];

    if (!config) {
      throw new Error(`Unknown proxy service: ${service}`);
    }

    const targetUrl = env.getServiceUrl(config.serviceName);
    const builder = new ProxyConfigBuilder()
      .withTarget(targetUrl)
      .withPathRewrite(config.pathRewrite)
      .withTimeout(config.timeout || this.DEFAULT_TIMEOUT);

    if (config.withAuth) {
      builder.withAuthHeaders();
    } else {
      builder.withBasicBodyHandling();
    }

    return createProxyMiddleware(builder.build());
  }

  public static createAllProxies(): Record<ProxyService, RequestHandler> {
    const proxies = {} as Record<ProxyService, RequestHandler>;

    for (const service of Object.values(ProxyService)) {
      proxies[service as ProxyService] = this.createProxy(
        service as ProxyService
      );
    }

    return proxies;
  }
}
