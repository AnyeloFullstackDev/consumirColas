import { RabbitQueueClient } from './dist/index.js';

async function main() {
	console.log('--- Iniciando prueba de RabbitQueueClient ---');

	const client = new RabbitQueueClient();

	try {
		console.log('Enviando consulta a la cola...');
		console.log('Colas por defecto:', client.getDefaultQueues());

		const respuesta = await client.consultarEnCola({
			queueIn: 'ConsumerCitizensPersonData',
			queueOut: 'CitizensPersonData',
			payload: {
				letter: 'V',
				documentNumber: '10577440',
			},
			timeoutMs: 10000,
		});

		console.log('✅ Respuesta recibida con éxito:');
		console.dir(respuesta, { depth: null });
	} catch (error) {
		console.error('❌ Error durante la consulta:', error.message || error);
	} finally {
		await client.close();
		console.log('Conexión cerrada.');
	}
}

main();
