import { Request } from 'express';
import { Options, RequestHandler } from 'http-proxy-middleware';
import { IProxyConfig } from '../../domain/interfaces/IProxyConfig';

export class ProxyConfigBuilder {
  private config: Partial<Options> = {
    changeOrigin: true,
    logLevel: 'debug',
  };

  public withTarget(target: string): ProxyConfigBuilder {
    this.config.target = target;
    return this;
  }

  public withPathRewrite(pathRewrite: Record<string, string>): ProxyConfigBuilder {
    this.config.pathRewrite = pathRewrite;
    return this;
  }

  public withTimeout(timeout: number): ProxyConfigBuilder {
    this.config.timeout = timeout;
    this.config.proxyTimeout = timeout;
    return this;
  }

  public withAuthHeaders(): ProxyConfigBuilder {
    this.config.onProxyReq = (proxyReq, req) => {
      const user = (req as any).user;

      if (user) {
        proxyReq.setHeader('X-User-Id', user.userId);
        proxyReq.setHeader('X-User-Email', user.email);
      }

      this.handleRequestBody(proxyReq, req);
    };

    return this;
  }

  public withBasicBodyHandling(): ProxyConfigBuilder {
    this.config.onProxyReq = (proxyReq, req) => {
      this.handleRequestBody(proxyReq, req);
    };

    return this;
  }

  private handleRequestBody(proxyReq: any, req: Request): void {
    if (req.body && Object.keys(req.body).length) {
      const bodyData = JSON.stringify(req.body);
      proxyReq.setHeader('Content-Type', 'application/json');
      proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
      proxyReq.write(bodyData);
    }
  }

  public build(): Options {
    if (!this.config.target) {
      throw new Error('Proxy target is required');
    }
    return this.config as Options;
  }
}
