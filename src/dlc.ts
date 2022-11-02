import db from '@inrixia/db';

import { ERROR, GREEN, continu } from './lib/helpers.js';
import { checkService } from './lib/checkService.js';
import { checkBackups } from './lib/checkBackup.js';
import { checkDir } from './lib/checkDataDir.js';

type Config = {
	baseDataDir: string;
	dataDirs: string[];
	serviceNames: string[];
	backupDir: string;
};
const config = db<Config>('./config.json', {
	template: {
		baseDataDir: 'C:\\DataLog',
		dataDirs: [],
		serviceNames: ['Tardis', 'AdvNMEADataLogger'],
		backupDir: '',
	},
	forceCreate: true,
	pretty: true,
});

const checkStatus = async () => {
	if (config.baseDataDir === '') throw new Error(`config.baseDataDir must be specified!`);
	const serviceStatus = [];
	for (const service of config.serviceNames) serviceStatus.push(await checkService(service));

	if (serviceStatus.some((status) => status === false)) {
		await ERROR(`Issues were found. Record the issue(s) above and refer to the Trial Instructions if a service did not restart\n\n`);
	} else await GREEN('All services running.\n\n');

	await continu();

	for (const dir of config.dataDirs) await checkDir(config.baseDataDir, dir);

	if (config.backupDir !== '') await checkBackups(config.backupDir);
	process.exit(0);
};
checkStatus().catch(async (err) => {
	await ERROR(`The following error was encountered during operation: ${err} \n`);
	await continu();
	process.exit(0);
});
