import { exec as _exec } from 'child_process';
import { promisify } from 'util';
import { WARN, ERROR, log } from './helpers';

const exec = (p: string) =>
	new Promise<{ stdout: string; stderr: string }>((res, rej) =>
		_exec(p, (err, stdout, stderr) => {
			if (err !== null) return rej(stderr || stdout || err);
			return res({ stdout, stderr });
		})
	);

const serviceRunning = async (serviceName: string): Promise<true | string> => {
	const { stdout, stderr } = await exec(`sc query ${serviceName}`).catch((stderr) => ({ stderr, stdout: '' }));
	if (stderr !== '') return stderr;
	if (stdout.toString().indexOf(`RUNNING`) > -1) return stdout;
	return true;
};
const startService = async (serviceName: string) => exec(`net start ${serviceName}`).catch(() => {});

/**
 * Checks if the service is running and starts it if not.
 * @param serviceName Service name to check
 * @returns true if the service is running, false if its not
 */
export const checkService = async (serviceName: string) => {
	await log(`\nChecking service ${serviceName} is running...\n`);
	let serviceStatus = await serviceRunning(serviceName);
	if (serviceStatus !== true) {
		await WARN(`Service ${serviceName} reported: \n${serviceStatus}\nAttempting to restart...`);
		await startService(serviceName);
		serviceStatus = await serviceRunning(serviceName);
		if (serviceStatus !== true) {
			await ERROR(`[ref 2.1] Service ${serviceName} is not running! Failed to automatically restart! Service reported: \n${serviceStatus}\n`);
		} else await WARN(`Service ${serviceName} restarted successfully!`);
		return true;
	}
	return false;
};
