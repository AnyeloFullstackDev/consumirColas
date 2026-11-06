import { RabbitQueueClient } from './dist/index.js';

async function main() {
	console.log('--- Iniciando prueba de RabbitQueueClient ---');

	const client = new RabbitQueueClient();

	try {
		console.log('Colas por defecto:', client.getDefaultQueues());
		console.log('API Key detectada:', Boolean(client['defaultApiKey']) ? 'SÍ (configurada)' : 'NO (vacía)');

		console.log('Enviando consulta a la cola y esperando respuesta (timeout: 30s)...');

		const respuesta = await client.consultarEnCola({
			queueIn: 'ConsumerCitizensPersonData',
			queueOut: 'CitizensPersonData',
			payload: {
				letter: 'V',
				documentNumber: '10577440',
			},
			timeoutMs: 30000,
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
