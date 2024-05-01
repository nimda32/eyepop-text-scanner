import Fastify from 'fastify';
import FastifyVite from '@fastify/vite';
import { EyePop } from "@eyepop.ai/eyepop";
import process from 'process';
import { readFile } from 'fs/promises';
import { join } from 'path';

// ...


let POP_UUID = '';
let POP_API_SECRET = '';

const server = Fastify()
server.setNotFoundHandler(async (request, reply) =>
{
    return reply.html()
});

await server.register(FastifyVite, {
    root: import.meta.url,
    dev: process.argv.includes('--dev'),
    spa: true,
    sourceMap: true,
});

server.post('/eyepop/authenticate', async (request, reply) =>
{
    try
    {
        POP_UUID = request.body.popId;
        POP_API_SECRET = request.body.secretKey;
        reply.send({ message: 'Authenticated' });

    } catch (error)
    {
        console.error('Error:', error);
        reply.send({ error });
    }
});

server.get('/', (req, reply) =>
{
    return reply.html()
});

server.get('/eyepop/session', async (req, reply) =>
{
    console.log('Authenticating EyePop Session');
    // check if the request is from an authenticated user
    const isAuthenticated = req.headers.authorization;

    if (!isAuthenticated)
    {
        console.log('Unathorized Request');
    }

    try
    {

        const endpoint = await EyePop.endpoint(
            {
                popId: POP_UUID,
                auth: { secretKey: POP_API_SECRET }
            }).connect();

        let session = await endpoint.session();

        session = JSON.stringify(session);

        console.log('New EyePop Session:', session)

        reply.send(session);

    } catch (error)
    {
        console.error('Error:', error);
        reply.send({ error });
    }
});

await server.vite.ready()
await server.listen({ port: 8000 })
