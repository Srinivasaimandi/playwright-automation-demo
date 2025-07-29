import Dockerode from 'dockerode';

const docker = new Dockerode();

interface ServiceConfig {
    Image: string;
    ExposedPorts: { [port: string]: {} };
    HostConfig: {
        PortBindings: { [port: string]: Array<{ HostPort: string }> };
    };
}

export class DockerFactory {
    static async createService(serviceName: string) {
        const serviceMap: Record<string, ServiceConfig> = {
            'users-app': {
                Image: 'srinivasaimandi/users-app-demo',
                ExposedPorts: { '9899/tcp': {} },
                HostConfig: {
                    PortBindings: {
                        '9899/tcp': [{ HostPort: '9899' }]
                    }
                }
            }
        }
        const config = serviceMap[serviceName];
        if (!config) {
            throw new Error(`Service ${serviceName} not found`);
        }

        console.log(`Pulling image: ${config.Image}`);
        await new Promise((resolve, reject) => {
            docker.pull(config.Image, (err: any, stream: NodeJS.ReadableStream) => {
                if (err) return reject(err);
                docker.modem.followProgress(stream, (err, res) => {
                    if (err) reject(err);
                    else resolve(res);
                });
            });
        });

        const container = await docker.createContainer({
            ...config,
            name: `${serviceName}-test-${Date.now()}`
        });

        await container.start();
        console.log(`Container for ${serviceName} started.`);
        return container;
    }
}